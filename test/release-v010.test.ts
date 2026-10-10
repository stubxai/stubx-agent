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
    assert.match(log, /## \[0\.1\.0\] — 2026-10-09/);
    assert.match(log, /### Verify/);
    assert.match(log, /### Lab/);
    assert.match(log, /### Web v2/);
    assert.match(log, /### Indexación/);
    assert.match(log, /robots\.txt/);
    assert.match(log, /sitemap\.xml/);
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
    assert.match(message, /STUBX 0\.1\.0/);
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
