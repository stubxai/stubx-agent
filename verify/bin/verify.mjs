#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = path.join(root, "dist", "verify", "cli.js");
if (!existsSync(cli)) {
  console.error("Falta dist/verify/cli.js. Ejecuta: npm run verify -- <mint>");
  process.exit(1);
}
const run = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(run.status ?? 1);
