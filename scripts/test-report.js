import { writeFileSync } from "node:fs";
import path from "node:path";

const summary = {
  ok: true,
  pass: 0,
  fail: 0,
  skipped: 0,
  tests: [],
};

export default async function* report(source) {
  for await (const event of source) {
    const data = event.data ?? {};
    const kind = data.details?.type;
    const file = typeof data.file === "string" ? path.relative(process.cwd(), data.file) : data.file;
    if (kind === "suite") {
      continue;
    }
    if (event.type === "test:pass") {
      summary.pass += 1;
      summary.tests.push({ name: data.name, file, status: "pass" });
    } else if (event.type === "test:fail") {
      summary.fail += 1;
      summary.ok = false;
      summary.tests.push({
        name: data.name,
        file,
        status: "fail",
        error: data.details?.error?.message ?? "failed",
      });
    } else if (event.type === "test:skip" || event.type === "test:todo") {
      summary.skipped += 1;
    }
  }
  writeFileSync("test-report.json", `${JSON.stringify(summary, null, 2)}\n`);
}
