/**
 * Punto de integración con la PR 14.
 * Si lab/ y site-drafts/ ya están en el árbol (rama fusionada), copia
 * el bundle de navegador que genera esa PR. Si no están, deja la
 * instantánea fechada y sale bien: no finge un build que no existe.
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const snapshotPath = path.join(root, "web/v2/modules/snapshot.json");
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));

const verifyBundle = path.join(root, "site-drafts/assets/verify.js");
const missionBundle = path.join(root, "site-drafts/assets/mission.js");
const lookupSource = path.join(root, "lab/verify/lookup.ts");

if (!existsSync(lookupSource) || !existsSync(verifyBundle) || !existsSync(missionBundle)) {
  if (snapshot.merged !== false || snapshot.commit !== "4161ee65fbcdff07f1e55a33e3973362c0592809") {
    console.error("La instantánea no coincide con la PR 14 y lab/ tampoco está en esta rama.");
    process.exit(1);
  }
  console.log(
    "lab/ no está en esta rama. Se mantiene el bundle de navegador de la PR 14, commit 4161ee6, fichas del 2026-10-08.",
  );
  process.exit(0);
}

copyFileSync(verifyBundle, path.join(root, "web/v2/assets/verify.js"));
copyFileSync(missionBundle, path.join(root, "web/v2/assets/mission.js"));
console.log(
  "Bundles copiados desde site-drafts/. Vuelve a ejecutar web/v2/tools/build_site.py y revisa que las fichas sigan fechadas.",
);
