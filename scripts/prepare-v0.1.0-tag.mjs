/**
 * Imprime cómo crear el tag v0.1.0 más adelante.
 * No ejecuta git tag ni git push. --create también se niega.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagePath = path.join(root, "docs/releases/v0.1.0/tag-message.txt");

if (process.argv.includes("--create") || process.argv.includes("--push")) {
  console.error("No se crea el tag v0.1.0 desde este script. Lee docs/releases/v0.1.0/TAG.md.");
  process.exit(1);
}

const message = readFileSync(messagePath, "utf8").trim();
if (!message.includes("0.1.0") || !message.includes("You could lose everything")) {
  console.error("El mensaje del tag no está completo.");
  process.exit(1);
}

console.log("Tag v0.1.0: preparado, no creado.");
console.log("Mensaje anotado: docs/releases/v0.1.0/tag-message.txt");
console.log("Cuando haya autorización, sobre el SHA de main:");
console.log("  git tag -a v0.1.0 SHA -F docs/releases/v0.1.0/tag-message.txt");
console.log("Este script no ejecuta esa orden.");
