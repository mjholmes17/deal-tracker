import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";

// POST /api/deals/refresh — trigger manual scraper run
export async function POST() {
  const scriptsDir = join(process.cwd(), "scripts");
  const scriptPath = join(scriptsDir, "scraper.py");

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn("python", [scriptPath], {
      cwd: scriptsDir,
      env: { ...process.env },
      timeout: 300_000, // 5 min max
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        // Parse how many new deals were inserted from the output
        const match = stdout.match(/(\d+) new deal\(s\)/);
        const newDeals = match ? parseInt(match[1], 10) : 0;
        resolve(
          NextResponse.json({
            success: true,
            newDeals,
            message: `Scraper completed. ${newDeals} new deal(s) found.`,
          })
        );
      } else {
        console.error("Scraper stderr:", stderr);
        resolve(
          NextResponse.json(
            {
              success: false,
              message: "Scraper failed. Check server logs.",
              error: stderr.slice(-500),
            },
            { status: 500 }
          )
        );
      }
    });

    proc.on("error", (err) => {
      resolve(
        NextResponse.json(
          {
            success: false,
            message: `Failed to start scraper: ${err.message}`,
          },
          { status: 500 }
        )
      );
    });
  });
}
