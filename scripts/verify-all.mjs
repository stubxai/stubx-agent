// Runs every existing check in order and writes verify-report.json and verify-report.md.
// No network, no secrets. Build first with `tsc` (npm run verify:all does it).
import { spawnSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { VERIFY_STEPS, buildVerifyReport, verifyMarkdown } from "../dist/src/verify-all.js";

const outDir = process.env.VERIFY_OUT_DIR ? path.resolve(process.env.VERIFY_OUT_DIR) : process.cwd();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

if (process.argv.includes("--list")) {
  console.log(VERIFY_STEPS.map((s) => s.script).join("\n"));
  process.exit(0);
}

const gitHead = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
const commit = process.env.GITHUB_SHA ?? (gitHead.status === 0 ? gitHead.stdout.trim() : null);

const results = [];
for (const step of VERIFY_STEPS) {
  const started = Date.now();
  const run = spawnSync(npm, ["run", "-s", step.script], { stdio: "inherit", env: process.env });
  results.push({ id: step.id, exitCode: run.status ?? 1, durationMs: Date.now() - started });
}

const report = buildVerifyReport({ date: new Date().toISOString(), commit, node: process.version, results });
const markdown = verifyMarkdown(report);
writeFileSync(path.join(outDir, "verify-report.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.join(outDir, "verify-report.md"), markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}
console.log(markdown);
process.exit(report.ok ? 0 : 1);
