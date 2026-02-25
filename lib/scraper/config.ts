/**
 * Scraper configuration: news sources and competitor firm URLs.
 */

export { END_MARKETS } from "@/lib/constants";

export interface ScraperSource {
  name: string;
  url: string;
  type: "news" | "firm";
}

export const NEWS_SOURCES: ScraperSource[] = [
  {
    name: "PR Newswire - Private Equity",
    url: "https://www.prnewswire.com/news-releases/financial-services-latest-news/private-equity-list/",
    type: "news",
  },
  {
    name: "Business Wire - Private Equity",
    url: "https://www.businesswire.com/portal/site/home/template.PAGE/news/",
    type: "news",
  },
  {
    name: "GlobeNewsWire - M&A",
    url: "https://www.globenewswire.com/news-release/category/3/Mergers-and-Acquisitions",
    type: "news",
  },
  {
    name: "PE Hub",
    url: "https://www.pehub.com/",
    type: "news",
  },
  {
    name: "Axios Pro Rata",
    url: "https://www.axios.com/pro/deals",
    type: "news",
  },
];

export const COMPETITOR_FIRM_URLS: ScraperSource[] = [
  { name: "Aldrich Capital Partners", url: "https://www.aldrichcapital.com/news/", type: "firm" },
  { name: "Aquiline", url: "https://www.aquiline.com/news/", type: "firm" },
  { name: "Argentum Group", url: "https://www.argentumgroup.com/news/", type: "firm" },
  { name: "Arrowroot Capital", url: "https://www.arrowrootcapital.com/news/", type: "firm" },
  { name: "Banneker Partners", url: "https://www.bannekerpartners.com/", type: "firm" },
  { name: "Battery Ventures (PE)", url: "https://www.battery.com/news/", type: "firm" },
  { name: "Blue Heron Capital", url: "https://www.blueheroncap.com/news", type: "firm" },
  { name: "Blueprint Equity", url: "https://www.blueprintequity.com/news", type: "firm" },
  { name: "BVP Forge", url: "https://www.bvp.com/news", type: "firm" },
  { name: "Carrick Capital Partners", url: "https://www.carrickcapitalpartners.com/news/", type: "firm" },
  { name: "Catalyst Investors", url: "https://www.catalystinvestors.com/news/", type: "firm" },
  { name: "Centana Growth Partners", url: "https://centanagrowth.com/news/", type: "firm" },
  { name: "Edison Partners", url: "https://www.edisonpartners.com/news/", type: "firm" },
  { name: "Elephant", url: "https://www.elephant.vc/news/", type: "firm" },
  { name: "Five Elms Capital", url: "https://www.fiveelms.com/news/", type: "firm" },
  { name: "Frontier Growth Partners", url: "https://www.frontiergrowth.com/news/", type: "firm" },
  { name: "Fulcrum Equity Partners", url: "https://www.fulcrumep.com/news/", type: "firm" },
  { name: "Growth Catalyst Partners", url: "https://www.growthcatalyst.com/", type: "firm" },
  { name: "Growth Street Partners", url: "https://www.growthstreetpartners.com/", type: "firm" },
  { name: "Guidepost Growth Equity", url: "https://www.guidepostgrowth.com/news/", type: "firm" },
  { name: "Insight", url: "https://www.insightpartners.com/newsroom/", type: "firm" },
  { name: "Integrity Growth Partners", url: "https://www.integritygp.com/news/", type: "firm" },
  { name: "JMI Equity", url: "https://jmiequity.com/news/", type: "firm" },
  { name: "K1", url: "https://k1.com/news/", type: "firm" },
  { name: "Kennet Partners (UK / EU)", url: "https://www.kennet.com/news/", type: "firm" },
  { name: "Lead Edge", url: "https://www.leadedge.com/news", type: "firm" },
  { name: "LLR Partners", url: "https://www.llrpartners.com/news/", type: "firm" },
  { name: "LoneTree Capital", url: "https://www.lonetreecapital.com/", type: "firm" },
  { name: "Long Ridge Equity Partners", url: "https://www.longridge.com/news/", type: "firm" },
  { name: "M33 Growth", url: "https://www.m33growth.com/news", type: "firm" },
  { name: "Mainsail", url: "https://www.mainsailpartners.com/news/", type: "firm" },
  { name: "Mamba Growth", url: "https://www.mambagrowth.com/", type: "firm" },
  { name: "McCarthy Capital Partners", url: "https://www.mccarthycapital.com/news/", type: "firm" },
  { name: "Nexa Equity", url: "https://www.nexaequity.com/", type: "firm" },
  { name: "Parker Gale Capital", url: "https://www.parkergale.com/news/", type: "firm" },
  { name: "PeakEquity Partners", url: "https://www.peakequity.com/news/", type: "firm" },
  { name: "PeakSpan Capital", url: "https://www.peakspancapital.com/news/", type: "firm" },
  { name: "Polaris Growth Fund", url: "https://www.polarisgrowthfund.com/", type: "firm" },
  { name: "Providence Strategic Growth", url: "https://www.psgequity.com/news/", type: "firm" },
  { name: "Radian Capital", url: "https://www.radiancapital.com/", type: "firm" },
  { name: "Resolve Growth Partners", url: "https://www.resolvegrowth.com/", type: "firm" },
  { name: "Resurgens Tech Partners", url: "https://www.resurgenstech.com/news/", type: "firm" },
  { name: "Riverside Acceleration", url: "https://www.riversidecompany.com/news/", type: "firm" },
  { name: "Sageview Capital", url: "https://www.sageviewcapital.com/news/", type: "firm" },
  { name: "Serent Capital", url: "https://www.serentcapital.com/news/", type: "firm" },
  { name: "Silversmith Capital Partners", url: "https://silversmith.com/news/", type: "firm" },
  { name: "SSM Partners", url: "https://www.ssmpartners.com/news/", type: "firm" },
  { name: "Strattam Capital", url: "https://www.strattamcapital.com/news/", type: "firm" },
  { name: "Summit Partners", url: "https://www.summitpartners.com/news/", type: "firm" },
  { name: "Susquehanna Growth Equity", url: "https://www.sgep.com/news/", type: "firm" },
  { name: "Updata Partners", url: "https://www.updata.com/news/", type: "firm" },
  { name: "Vertica Capital Partners", url: "https://www.verticacapital.com/", type: "firm" },
  { name: "Vista Endeavor", url: "https://www.vistaequitypartners.com/news/", type: "firm" },
  { name: "Volition Capital", url: "https://www.volitioncapital.com/news/", type: "firm" },
];

export const ALL_SOURCES: ScraperSource[] = [...NEWS_SOURCES, ...COMPETITOR_FIRM_URLS];
