# Wavecrest Deal Tracker

Internal web app for Wavecrest Growth Partners that automatically scans the web daily for growth equity competitor deals and presents them in a collaborative, editable tracker.

Full product spec: @docs/PRD.md

## Tech Stack

- **Frontend:** Next.js (App Router) + React + shadcn/ui + Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma
- **Auth:** Simple session-based auth with shared team credential (env var)
- **Scraping:** Python scripts + Claude API for extraction/classification
- **Hosting:** Vercel (frontend + API) or Railway

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run linter
- `npx prisma migrate dev` — run database migrations
- `npx prisma studio` — open database GUI
- `npx prisma generate` — regenerate Prisma client after schema changes

## Project Structure

```
/app              — Next.js App Router pages and layouts
/app/api          — API routes (CRUD endpoints for deals)
/components       — React components (deal table, filters, modals)
/components/ui    — shadcn/ui base components
/lib              — Shared utilities, db client, auth helpers
/prisma           — Database schema and migrations
/scripts          — Python scraping scripts
/docs             — PRD and other documentation
```

## Database

The primary table is `deals` with columns: date, company_name, investor, amount_raised, end_market, description, source_url, status, comments, created_at, updated_at, deleted_at.

Status values: "Saw and Passed", "Did Not See", "Irrelevant" (nullable — blank for new deals).

End market is a dropdown. Initial values listed in @docs/PRD.md.

## Code Style

- TypeScript strict mode
- Use named exports
- Tailwind for all styling, no custom CSS files
- NEVER commit .env files
- Keep components small and composable
- Use server components by default, client components only when needed for interactivity

## Important Rules

- The deal table must feel like a spreadsheet — click any cell to edit, auto-save on blur
- All CRUD operations go through API routes, never direct DB calls from components
- Scraper runs Mon/Wed/Fri at 9:00 AM ET via cron
- Deduplication: fuzzy match on company_name + investor against all existing deals (including soft-deleted) before inserting
- 61 competitor firms are tracked — full list in @docs/PRD.md
