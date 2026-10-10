import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { repoRoot } from "../src/paths.js";

const root = repoRoot();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("v0.1.0 notes, without a tag", () => {
  test("the public changelog names Verify, Lab, web v2, and indexing", () => {
    const log = read("CHANGELOG.md");
    assert.match(log, /## \[0\.1\.0\] — 2026-10-10/);
    assert.match(log, /Lo que hay en este repositorio hasta el 2026-10-10\./);
    assert.match(log, /### Verify/);
    assert.match(log, /### Lab/);
    assert.match(log, /### Web v2/);
    assert.match(log, /### Indexación/);
    assert.match(log, /robots\.txt/);
    assert.match(log, /sitemap\.xml/);
    assert.match(log, /Esta entrada no despliega `web\/v2\/`\. stubxai.com no cambia por este documento\. La v2 ya está desplegada desde el 2026-10-09\./);
    assert.match(log, /`web\/v2\/` es la web publicada en stubxai.com desde el 2026-10-09 \(merge `ed1c7759`\)/);
    assert.equal(log.includes("no están construidos"), false);
    assert.equal(log.includes("hay que reescribir"), false);
    assert.equal(log.includes("No es una lectura en vivo"), false);
    assert.match(log, /Studio está desplegado \(PR #20 y #26\) y se indexa\. Verify universal está desplegado \(merge `2434636`\)\./);
    assert.match(log, /En la web v2, `\/verify` es Verify universal, desplegado \(merge `2434636`\)\./);
    assert.match(log, /Este repositorio no inserta medición de visitas ni cookies\. Cloudflare Web Analytics debe estar apagado en el panel de la zona \(sin baliza en el HTML servido el 2026-10-10\)\./);
    assert.match(log, /no está creado/);
    assert.match(log, /2026-09-26 · Esqueleto público/);
    assert.equal(log.includes("## 0.1.0 — 2026-09-26"), false);
  });

  test("Spanish and English notes cover the same four pieces", () => {
    const es = read("docs/releases/v0.1.0/NOTAS.es.md");
    const en = read("docs/releases/v0.1.0/NOTAS.en.md");
    for (const text of [es, en]) {
      assert.match(text, /Verify/);
      assert.match(text, /Lab/);
      assert.match(text, /web v2/i);
      assert.match(text, /sitemap\.xml/);
      assert.match(text, /robots\.txt/);
      assert.match(text, /0\.1\.0/);
    }
    assert.match(es, /Fecha de estas notas: 2026-10-10\./);
    assert.match(en, /These notes are dated 2026-10-10\./);
    assert.match(es, /La web v2 se desplegó en stubxai.com el 2026-10-09, fuera de estas notas\. Estas notas no la despliegan ni la cambian\./);
    assert.match(en, /Web v2 was deployed to stubxai.com on 2026-10-09, outside these notes\. These notes do not deploy or change it\./);
    assert.match(es, /Este repositorio no inserta medición de visitas ni cookies\. Cloudflare Web Analytics debe estar apagado en el panel de la zona \(sin baliza en el HTML servido el 2026-10-10\)\./);
    assert.match(en, /This repository inserts no visit measurement or cookies\. Cloudflare Web Analytics must be off in the zone dashboard \(no beacon in the HTML served on 2026-10-10\)\./);
    assert.equal(es.includes("vista previa"), false);
    assert.equal(en.toLowerCase().includes("preview"), false);
    assert.match(es, /`web\/v2\/` es la web publicada en stubxai.com desde el 2026-10-09 \(merge `ed1c7759`\)\. `web\/current\/` es la copia anterior, para volver atrás\./);
    assert.match(en, /`web\/v2\/` is the website published on stubxai.com since 2026-10-09 \(merge `ed1c7759`\)\. `web\/current\/` is the earlier copy, kept so it can be put back\./);
    assert.match(es, /Studio está desplegado \(PR #20 y #26\) y se indexa\. Verify universal está desplegado \(merge `2434636`\)\. El cuaderno no forma parte de este despliegue\./);
    assert.match(en, /Studio is deployed \(pull requests #20 and #26\) and it is indexable\. Verify universal is deployed \(merge `2434636`\)\. The notebook is not part of this deployment\./);
    assert.match(es, /cualquier mint SPL o Token-2022/);
    assert.match(en, /any SPL or Token-2022 mint/);
    assert.equal(es.includes("hay que reescribir"), false);
    assert.equal(en.includes("this paragraph has to be rewritten"), false);
    assert.equal(es.includes("no consulta la red"), false);
    assert.equal(en.includes("does not query the network"), false);
    assert.equal(es.includes("no están construidos"), false);
    assert.equal(en.includes("not built"), false);
    assert.equal(es.includes("/studio/"), false);
    assert.equal(en.includes("/studio/"), false);
    assert.match(es, /Puedes perderlo todo/);
    assert.match(en, /You could lose everything/);
    assert.equal(en.includes("You can lose"), false);
    assert.equal(es.includes("Memecoin experimental"), false);
    assert.equal(en.includes("Experimental memecoin"), false);
  });

  test("the tag message is ready and the helper refuses to create it", () => {
    const message = read("docs/releases/v0.1.0/tag-message.txt");
    const guide = read("docs/releases/v0.1.0/TAG.md");
    const helper = read("scripts/prepare-v0.1.0-tag.mjs");
    assert.match(message, /STUBX 0\.1\.0 \(2026-10-10\)/);
    assert.match(message, /You could lose everything/);
    assert.match(guide, /no creado/);
    assert.match(guide, /git tag -a v0\.1\.0 SHA/);
    assert.equal(helper.includes("git tag"), true);
    assert.match(helper, /process\.exit\(1\)/);
    assert.equal(/exec(File|Sync)?\(/.test(helper), false);
    assert.equal(helper.includes("child_process"), false);

    const shown = spawnSync(process.execPath, ["scripts/prepare-v0.1.0-tag.mjs"], { cwd: root, encoding: "utf8" });
    assert.equal(shown.status, 0, shown.stderr);
    assert.match(shown.stdout, /no creado/);
    assert.match(shown.stdout, /no ejecuta/);

    const refused = spawnSync(process.execPath, ["scripts/prepare-v0.1.0-tag.mjs", "--create"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /No se crea el tag/);

    const tags = spawnSync("git", ["tag", "-l", "v0.1.0"], { cwd: root, encoding: "utf8" });
    assert.equal(tags.status, 0);
    assert.equal(tags.stdout.trim(), "");
  });

  test("README and LIMITS use the current footer, not the retired line", () => {
    const readme = read("README.md");
    const limits = read("LIMITS.md");
    for (const text of [readme, limits]) {
      assert.equal(text.includes("Memecoin experimental"), false);
      assert.equal(text.includes("you can lose everything"), false);
      assert.match(text, /You could lose everything|Puedes perderlo todo/);
    }
    assert.match(readme, /docs\/releases\/v0\.1\.0\/NOTAS\.es\.md/);
    assert.match(readme, /docs\/releases\/v0\.1\.0\/NOTAS\.en\.md/);
  });
});
