# Product Requirements Document
## Wavecrest Deal Tracker — Competitive Deal Intelligence Platform

**Prepared for:** Wavecrest Growth Partners  
**Version:** 1.0  
**Date:** February 25, 2026  
**Status:** Draft

---

## 1. Overview

The Wavecrest Deal Tracker is an internal web application that automatically scans the web daily for growth equity deals announced by competitors, ingests them into a centralized tracker, and provides the team with a collaborative, spreadsheet-like interface to review, annotate, and manage deal intelligence. The app should be simple, reliable, and usable by non-technical team members from day one.

---

## 2. Problem Statement

Wavecrest's investment team currently tracks competitor deal activity manually — monitoring news sites, press releases, and databases on an ad hoc basis. This leads to missed deals, duplicated effort, and no single source of truth. The team needs an automated pipeline that captures deals in real time and a shared workspace to discuss and categorize them.

---

## 3. Goals & Success Metrics

**Goals:**
- Eliminate manual scanning of deal news sources
- Create a single, persistent, team-wide source of truth for competitor deal activity
- Enable lightweight collaboration (comments, edits) directly on the tracker

**Success Metrics:**
- 80%+ of publicly announced competitor deals captured within 24 hours
- All team members actively logging in and adding comments within 2 weeks of launch
- <5 minutes for any team member to find a specific deal or filter by end market

---

## 4. Users & Access

All team members share a single universal login (shared email/password credentials). There are no distinct user roles or permission levels — every logged-in user has full access to all features (create, read, update, delete deals and comments). This keeps the system simple and avoids user management overhead.

**Login:** Shared email/password (e.g., team@wavecrestgrowth.com / shared password)  
**Future consideration:** Individual accounts with role-based permissions can be added in a later version if needed.

---

## 5. Core Features

### 5.1 Automated Deal Ingestion (Daily Web Scan)

The system runs a daily background job that scans configured web sources for new growth equity deals. Sources should include:

- **News aggregators & press releases:** PR Newswire, Business Wire, GlobeNewsWire
- **Industry publications:** TechCrunch, PitchBook News, Crunchbase News, PE Hub, Axios Pro Rata
- **Competitor firm websites:** Direct RSS or scrape of portfolio/news pages for each tracked competitor (see full list below)

**Tracked Competitor Firms (61 firms):**

| | | |
|---|---|---|
| Aldrich Capital Partners | Five Elms Capital | Parker Gale Capital |
| Aquiline | Frontier Growth Partners | PeakEquity Partners |
| Argentum Group | Fulcrum Equity Partners | PeakSpan Capital |
| Arrowroot Capital | Growth Catalyst Partners | Polaris Growth Fund |
| Banneker Partners | Growth Street Partners | Providence Strategic Growth |
| Battery Ventures (PE) | Guidepost Growth Equity | Radian Capital |
| Blue Heron Capital | Insight | Resolve Growth Partners |
| Blueprint Equity | Integrity Growth Partners | Resurgens Tech Partners |
| BVP Forge | JMI Equity | Riverside Acceleration |
| Carrick Capital Partners | K1 | Sageview Capital |
| Catalyst Investors | Kennet Partners (UK / EU) | Serent Capital |
| Centana Growth Partners | Lead Edge | Silversmith Capital Partners |
| Edison Partners | Level Equity | SSM Partners |
| Elephant | LLR Partners | Strattam Capital |
| LoneTree Capital | Summit Partners | |
| Long Ridge Equity Partners | Susquehanna Growth Equity | |
| M33 Growth | Updata Partners | |
| Mainsail | Vertica Capital Partners | |
| Mamba Growth | Vista Endeavor | |
| McCarthy Capital Partners | Volition Capital | |
| Nexa Equity | | |

**Ingestion pipeline:**
1. Scraper/API collector runs daily (configurable schedule, default 9:00 AM ET)
2. Raw results are parsed for deal attributes (company name, investor, amount, description)
3. LLM-powered extraction normalizes unstructured text into structured fields
4. Deduplication logic checks against existing tracker entries (fuzzy match on company name + investor + date window)
5. New deals are added with status blank (no status assigned until team reviews)
6. Team is notified via email digest or Slack integration (stretch goal)

### 5.2 Deal Tracker (Spreadsheet-Like Interface)

The primary UI is an editable data table with the following columns:

| Column | Type | Auto-populated? | Editable? |
|--------|------|-----------------|-----------|
| **Date** | Date | Yes (from source) | Yes |
| **Company Name** | Text | Yes | Yes |
| **Investor** | Text | Yes | Yes |
| **$ Raised** | Currency (USD) | Yes (if disclosed) | Yes |
| **Company End Market** | Single-select dropdown | Yes (LLM-classified) | Yes |
| **Company Description** | Text (multi-line) | Yes (LLM-generated summary) | Yes |
| **Team Comments** | Text (multi-line) | No | Yes |
| **Status** | Single-select | No (blank for new) | Yes |
| **Source URL** | URL link | Yes | Yes |

**End Market dropdown values (initial set, admin-configurable):**
Construction Tech, Real Estate Tech, FinTech, Payments, InsurTech, HealthTech, HR Tech, Vertical SaaS, Cybersecurity, Data & Analytics, EdTech, Supply Chain / Logistics, Climate Tech, Legal Tech, MarTech / AdTech, Other

**Status dropdown values:**
Saw and Passed, Did Not See, Irrelevant

### 5.3 CRUD Operations

Any logged-in user can:
- **Create** a deal manually (for deals the scraper missed)
- **Read** all deals with sorting, filtering, and search
- **Update** any field inline (click-to-edit, auto-save)
- **Delete** a deal (soft delete with undo option)

### 5.4 Filtering, Sorting & Search

- Filter by: Date range, Investor, End Market, Status, $ Raised range
- Sort by: Any column (ascending/descending)
- Full-text search across Company Name, Investor, Description, and Comments
- Save filter presets (e.g., "FinTech deals this quarter")

### 5.5 Authentication & Access

- Single shared email/password login for the team
- Session-based auth with secure cookies
- No individual user accounts or roles in V1
- Password can be changed by anyone with current access

### 5.6 Data Persistence

- All data stored in a relational database (PostgreSQL recommended)
- Daily automated backups
- Export to CSV/Excel on demand

---

## 6. Technical Architecture (Recommended)

This section is a recommendation for Claude Code implementation. The stack is chosen for simplicity and suitability for a first-time builder.

**Frontend:** Next.js (React) with a component library like shadcn/ui or Ant Design for the table UI  
**Backend:** Next.js API routes (or a separate Express/FastAPI server)  
**Database:** PostgreSQL (hosted on Supabase, Neon, or Railway for simplicity)  
**ORM:** Prisma (type-safe, great migration tooling)  
**Auth:** Simple session-based auth with a shared credential (environment variable)  
**Scraping/Ingestion:** Python scripts using BeautifulSoup/Scrapy + Claude API for extraction, run on a cron schedule (GitHub Actions, Railway cron, or Vercel cron)  
**Hosting:** Vercel (frontend + API) or Railway (full-stack)

**Simplified system diagram:**

```
[Daily Cron Job]
       │
       ▼
[Scraper Scripts] ──► [Claude API: extract & classify] ──► [PostgreSQL DB]
                                                                 ▲
                                                                 │
[Browser] ──► [Next.js Frontend] ──► [API Routes] ──────────────┘
                                          │
                                    [Session Auth]
```

---

## 7. Data Model (Simplified)

```
deals
├── id              UUID (primary key)
├── date            DATE
├── company_name    VARCHAR(255)
├── investor        VARCHAR(255)
├── amount_raised   DECIMAL (nullable)
├── end_market      VARCHAR(100)
├── description     TEXT
├── source_url      VARCHAR(500)
├── status          ENUM (Saw and Passed, Did Not See, Irrelevant) — nullable, blank for new deals
├── comments        TEXT (free-form team comments, editable inline)
├── created_at      TIMESTAMP
├── updated_at      TIMESTAMP
└── deleted_at      TIMESTAMP (nullable, soft delete)

scrape_sources
├── id              UUID
├── name            VARCHAR(255)
├── url             VARCHAR(500)
├── source_type     ENUM (rss, web_scrape)
├── is_active       BOOLEAN
└── last_scraped_at TIMESTAMP
```

*Note: No users table in V1. Auth is handled via a single shared credential stored as an environment variable (hashed password). Individual user accounts can be added in a future version.*

---

## 8. MVP Scope vs. Future Enhancements

### MVP (Build First)
- Shared team login (single email/password)
- Deal table with all core columns
- Full CRUD (inline editing, manual add, soft delete)
- Sort, filter, and search
- Daily automated scraping from news sources + competitor firm websites (9:00 AM ET)
- LLM-powered deal extraction and end-market classification
- CSV export

### V2 Enhancements
- **Slack integration** — notifications to a team channel when new deals are ingested
- Saved filter presets
- Deal detail view with expanded comments
- Bulk edit / bulk status update
- Individual user accounts with login tracking

### V3 / Long-term
- Analytics dashboard (deal volume by end market, investor activity heatmap)
- AI-generated weekly summary email
- Additional data enrichment (company headcount, founding year, location)
- Mobile-responsive / PWA

---

## 9. Non-Functional Requirements

- **Performance:** Table should load in <2 seconds for up to 5,000 deals
- **Availability:** 99.5% uptime (acceptable for internal tool)
- **Security:** HTTPS only, hashed shared password, no deal data exposed publicly
- **Data retention:** All deals retained indefinitely; soft-deleted records purged after 90 days
- **Browser support:** Chrome and Edge (latest versions)

---

## 10. Resolved Decisions

1. **PitchBook / Crunchbase:** Not using — no API integration needed
2. **Competitor firms:** 61 firms listed in Section 5.1 (provided by team)
3. **Scrape frequency:** Once daily at 9:00 AM ET
4. **Auth approach:** Shared email/password login, no individual accounts or roles
5. **User management:** Not needed for V1 — single universal login
