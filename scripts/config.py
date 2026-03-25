"""Scraper configuration: news sources and competitor firm URLs."""

from thefuzz import fuzz

# News sources to scan for growth equity deal announcements
NEWS_SOURCES = [
    {
        "name": "PR Newswire - Private Equity",
        "url": "https://www.prnewswire.com/news-releases/financial-services-latest-news/private-equity-list/",
        "type": "news",
    },
    {
        "name": "Business Wire - Private Equity",
        "url": "https://www.businesswire.com/portal/site/home/template.PAGE/news/",
        "type": "news",
    },
    {
        "name": "GlobeNewsWire - M&A",
        "url": "https://www.globenewswire.com/news-release/category/3/Mergers-and-Acquisitions",
        "type": "news",
    },
    {
        "name": "PE Hub",
        "url": "https://www.pehub.com/",
        "type": "news",
    },
    {
        "name": "Axios Pro Rata",
        "url": "https://www.axios.com/pro/deals",
        "type": "news",
    },
]

# Competitor firm websites — portfolio/news pages
# These are the pages most likely to announce new investments
COMPETITOR_FIRM_URLS = [
    ("Aldrich Capital Partners", "https://www.aldrichcapital.com/news/"),
    ("Aquiline", "https://www.aquiline.com/news/"),
    ("Argentum Group", "https://www.argentumgroup.com/news/"),
    ("Arrowroot Capital", "https://www.arrowrootcapital.com/news/"),
    ("Banneker Partners", "https://www.bannekerpartners.com/"),
    ("Battery Ventures (PE)", "https://www.battery.com/news/"),
    ("Blue Heron Capital", "https://www.blueheroncap.com/news"),
    ("Blueprint Equity", "https://www.blueprintequity.com/news"),
    ("BVP Forge", "https://www.bvp.com/news"),
    ("Carrick Capital Partners", "https://www.carrickcapitalpartners.com/news/"),
    ("Catalyst Investors", "https://www.catalystinvestors.com/news/"),
    ("Centana Growth Partners", "https://centanagrowth.com/news/"),
    ("Edison Partners", "https://www.edisonpartners.com/news/"),
    ("Elephant", "https://www.elephant.vc/news/"),
    ("Five Elms Capital", "https://www.fiveelms.com/news/"),
    ("Frontier Growth Partners", "https://www.frontiergrowth.com/news/"),
    ("Fulcrum Equity Partners", "https://www.fulcrumep.com/news/"),
    ("Growth Catalyst Partners", "https://www.growthcatalyst.com/"),
    ("Growth Street Partners", "https://www.growthstreetpartners.com/"),
    ("Guidepost Growth Equity", "https://www.guidepostgrowth.com/news/"),
    ("Insight", "https://www.insightpartners.com/newsroom/"),
    ("Integrity Growth Partners", "https://www.integritygp.com/news/"),
    ("JMI Equity", "https://jmiequity.com/news/"),
    ("K1", "https://k1.com/news/"),
    ("Kennet Partners (UK / EU)", "https://www.kennet.com/news/"),
    ("Lead Edge", "https://www.leadedge.com/news"),
    ("LLR Partners", "https://www.llrpartners.com/news/"),
    ("LoneTree Capital", "https://www.lonetreecapital.com/"),
    ("Long Ridge Equity Partners", "https://www.longridge.com/news/"),
    ("M33 Growth", "https://www.m33growth.com/news"),
    ("Mainsail", "https://www.mainsailpartners.com/news/"),
    ("Mamba Growth", "https://www.mambagrowth.com/"),
    ("McCarthy Capital Partners", "https://www.mccarthycapital.com/news/"),
    ("Nexa Equity", "https://www.nexaequity.com/"),
    ("Parker Gale Capital", "https://www.parkergale.com/news/"),
    ("PeakEquity Partners", "https://www.peakequity.com/news/"),
    ("PeakSpan Capital", "https://www.peakspancapital.com/news/"),
    ("Polaris Growth Fund", "https://www.polarisgrowthfund.com/"),
    ("Providence Strategic Growth", "https://www.psgequity.com/news/"),
    ("Radian Capital", "https://www.radiancapital.com/"),
    ("Resolve Growth Partners", "https://www.resolvegrowth.com/"),
    ("Resurgens Tech Partners", "https://www.resurgenstech.com/news/"),
    ("Riverside Acceleration", "https://www.riversidecompany.com/news/"),
    ("Sageview Capital", "https://www.sageviewcapital.com/news/"),
    ("Serent Capital", "https://www.serentcapital.com/news/"),
    ("Silversmith Capital Partners", "https://silversmith.com/news/"),
    ("SSM Partners", "https://www.ssmpartners.com/news/"),
    ("Strattam Capital", "https://www.strattamcapital.com/news/"),
    ("Summit Partners", "https://www.summitpartners.com/news/"),
    ("Susquehanna Growth Equity", "https://www.sgep.com/news/"),
    ("Updata Partners", "https://www.updata.com/news/"),
    ("Vertica Capital Partners", "https://www.verticacapital.com/"),
    ("Vista Endeavor", "https://www.vistaequitypartners.com/news/"),
    ("Volition Capital", "https://www.volitioncapital.com/news/"),
]

# Canonical competitor firm names (derived from COMPETITOR_FIRM_URLS)
COMPETITOR_FIRM_NAMES = {name for name, _ in COMPETITOR_FIRM_URLS}

# Common aliases / abbreviations that map to a canonical firm name.
# When Claude extracts a deal with an alias, we normalize it to the canonical name.
COMPETITOR_FIRM_ALIASES = {
    "PSG Equity": "Providence Strategic Growth",
    "PSG": "Providence Strategic Growth",
    "Providence Strategic Growth (PSG)": "Providence Strategic Growth",
    "Battery Ventures": "Battery Ventures (PE)",
    "Battery": "Battery Ventures (PE)",
    "Kennet Partners": "Kennet Partners (UK / EU)",
    "Kennet": "Kennet Partners (UK / EU)",
    "Insight Partners": "Insight",
    "Mainsail Partners": "Mainsail",
    "Riverside Acceleration Capital": "Riverside Acceleration",
    "Long Ridge": "Long Ridge Equity Partners",
    "Susquehanna Growth": "Susquehanna Growth Equity",
    "SGE Partners": "Susquehanna Growth Equity",
    "Vista Equity Partners": "Vista Endeavor",
    "Vista Equity": "Vista Endeavor",
    "Elephant Ventures": "Elephant",
    "BVP": "BVP Forge",
    "Bessemer": "BVP Forge",
    "Bessemer Venture Partners": "BVP Forge",
    "Summit": "Summit Partners",
    "LLR": "LLR Partners",
    "JMI": "JMI Equity",
    "Lead Edge Capital": "Lead Edge",
    "K1 Investment Management": "K1",
    "GTCR": None,  # Explicitly NOT a competitor — do not match
}


def match_competitor_firm(investor: str, threshold: int = 80) -> str | None:
    """Match an investor name to a competitor firm. Returns the canonical firm
    name if matched, or None if the investor is not a tracked competitor.

    Checks exact alias matches first, then fuzzy-matches against canonical names.
    """
    if not investor or investor.lower() in ("not specified", "undisclosed", "unknown", "n/a", ""):
        return None

    # Check aliases first (exact, case-insensitive)
    for alias, canonical in COMPETITOR_FIRM_ALIASES.items():
        if investor.lower() == alias.lower():
            return canonical  # None if explicitly excluded

    # Fuzzy match against canonical firm names
    best_score = 0
    best_match = None
    for firm_name in COMPETITOR_FIRM_NAMES:
        score = fuzz.ratio(investor.lower(), firm_name.lower())
        if score > best_score:
            best_score = score
            best_match = firm_name

    if best_score >= threshold:
        return best_match

    return None


# End markets for classification
END_MARKETS = [
    "Construction Tech",
    "Real Estate Tech",
    "FinTech",
    "Payments",
    "InsurTech",
    "HealthTech",
    "HR Tech",
    "Vertical SaaS",
    "Cybersecurity",
    "Data & Analytics",
    "EdTech",
    "Supply Chain / Logistics",
    "Climate Tech",
    "Legal Tech",
    "MarTech / AdTech",
    "Other",
]
