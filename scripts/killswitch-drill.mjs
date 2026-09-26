// Runs the kill-switch drill and writes drill-report.json and drill-report.md.
// No network, no secrets. Build first with `tsc` (npm run drill:killswitch does it).
import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { drillMarkdown, runKillSwitchDrill } from "../dist/src/drill.js";

const outDir = process.env.DRILL_OUT_DIR ? path.resolve(process.env.DRILL_OUT_DIR) : process.cwd();
const report = runKillSwitchDrill({ commit: process.env.GITHUB_SHA ?? null });
const markdown = drillMarkdown(report);

writeFileSync(path.join(outDir, "drill-report.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.join(outDir, "drill-report.md"), markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

console.log(markdown);
process.exit(report.ok ? 0 : 1);
