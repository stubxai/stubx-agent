import path from "node:path";
import { scanTree } from "./forbidden-scan.js";
import { createOrchestrator } from "./orchestrator.js";
import { repoRoot } from "./paths.js";

const command = process.argv[2];

if (command === "scan:forbidden") {
  const root = repoRoot();
  const findings = [
    ...scanTree(path.join(root, "src")),
    ...scanTree(path.join(root, "scripts")),
    ...scanTree(path.join(root, "policy")),
    ...scanTree(path.join(root, "state")),
  ];
  if (findings.length > 0) {
    console.error(JSON.stringify({ ok: false, findings }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, findings: 0 }));
} else if (command === "ppm:print" || command === "ppm:check") {
  const result = createOrchestrator().dispatch(command);
  if (result.ok) {
    console.log(`${JSON.stringify(result.output, null, 2)}\n`);
    process.exit(0);
  }
  console.log(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(2);
} else {
  console.error("Commands: ppm:print, ppm:check, scan:forbidden");
  process.exit(1);
}
