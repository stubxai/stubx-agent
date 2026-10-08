#!/usr/bin/env node
import { repoRootFrom } from "./root.js";
import { scanVerifyTree } from "./scan.js";

const findings = scanVerifyTree(repoRootFrom(import.meta.url));
if (findings.length > 0) {
  console.error(JSON.stringify({ ok: false, findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, findings: 0 }));
