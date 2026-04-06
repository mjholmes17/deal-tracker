import { runScraper } from "@/lib/scraper";

async function main() {
  try {
    const result = await runScraper();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  } catch (e) {
    console.error("Scraper failed:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

main();
