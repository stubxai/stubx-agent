import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export function bundlePares() {
  const chain = readFileSync(path.join(root, "pares/chain-read.mjs"), "utf8").replace(/^export /gm, "");
  const page = readFileSync(path.join(root, "pares/pares-page.mjs"), "utf8");
  const importLine = page.match(/^import .+\n/);
  if (!importLine) throw new Error("La página de la curva no importa el informe.");
  const body = page.slice(importLine[0].length);
  return `${importLine[0]}// Generado por web/v2/tools/bundle-pares.mjs. La fuente está en pares/.\n${chain}\n${body}`;
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  writeFileSync(path.join(root, "web/v2/assets/pares.mjs"), bundlePares());
}
