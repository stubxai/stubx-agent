import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function findRepoRoot(start: string): string {
  let dir = path.resolve(start);
  for (let i = 0; i < 8; i += 1) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error("No se encontró la raíz del repositorio.");
}

export function repoRootFromMeta(metaUrl: string): string {
  return findRepoRoot(path.dirname(fileURLToPath(metaUrl)));
}
