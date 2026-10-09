import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { DISCLAIMER, UNKNOWN_LINE } from "../copy.js";
import { repoRootFromMeta } from "../paths.js";
import { PALETTE, contrast } from "../theme.js";
import { bannedHits } from "../text.js";
import { buildOutputs, pagesDiffer } from "../tools/build-pages.js";

const root = repoRootFromMeta(import.meta.url);

function page(pages: Array<{ rel: string; body: string }>, suffix: string): string {
  const found = pages.find((item) => item.rel.endsWith(suffix));
  assert.ok(found, suffix);
  return found.body;
}

function externalSubresources(source: string): string[] {
  const hits: string[] = [];
  for (const match of source.matchAll(/<(script|link|img|iframe|source|audio|video|embed|object)\b[^>]*>/gi)) {
    const tag = match[0] ?? "";
    const src = /\s(?:src|href)\s*=\s*"([^"]*)"/i.exec(tag);
    const url = src?.[1] ?? "";
    if (url.length === 0) continue;
    if (/^(https?:)?\/\//i.test(url) || /^[a-z][a-z0-9+.-]*:/i.test(url)) hits.push(url);
  }
  for (const match of source.matchAll(/url\(\s*['"]?([^'")]+)/gi)) {
    const url = match[1] ?? "";
    if (/^(https?:)?\/\//i.test(url)) hits.push(url);
  }
  if (/@import\b/i.test(source)) hits.push("@import");
  return hits;
}

function unnamedButtons(html: string): string[] {
  const hits: string[] = [];
  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = match[1] ?? "";
    const label = /aria-label\s*=\s*"([^"]+)"/i.exec(attrs)?.[1] ?? "";
    const text = (match[2] ?? "").replace(/<[^>]+>/g, "").trim();
    if (label.length === 0 && text.length === 0) hits.push(match[0] ?? "");
  }
  return hits;
}

describe("páginas estáticas", () => {
  const pages = buildOutputs(root);
  const htmlPages = pages.filter((item) => item.rel.endsWith(".html"));
  const css = page(pages, "assets/site.css");
  const missionJs = page(pages, "assets/mission.js");
  const sw = readFileSync(path.join(root, "site-drafts/sw.js"), "utf8");

  test("los HTML generados coinciden con los archivos del repositorio", () => {
    assert.deepEqual(pagesDiffer(root, pages), []);
  });

  test("cada página lleva el aviso, la fecha y la diferencia entre desconocido y comprobado", () => {
    for (const item of htmlPages) {
      assert.match(item.body, new RegExp(DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(item.body, /2026-10-08/);
      assert.match(item.body, new RegExp(UNKNOWN_LINE.es.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(item.body, /lang="es"/);
      assert.match(item.body, /<main id="contenido"/);
      assert.match(item.body, /href="#contenido"/);
      assert.match(item.body, /<h1>/);
      assert.match(item.body, /<title>[^<]+<\/title>/);
      assert.deepEqual(externalSubresources(item.body), [], item.rel);
      assert.deepEqual(unnamedButtons(item.body), [], item.rel);
      assert.equal(item.body.includes("tabindex=\"1\""), false, item.rel);
      for (const match of item.body.matchAll(/tabindex="(-?\d+)"/g)) {
        assert.ok(Number(match[1]) <= 0, item.rel);
      }
    }
  });

  test("no hay recursos externos ni analítica en css, script ni service worker", () => {
    assert.deepEqual(externalSubresources(css), []);
    assert.deepEqual(externalSubresources(missionJs), []);
    assert.equal(/https?:\/\//.test(sw), false);
    assert.equal(sw.includes("localStorage"), false);
    assert.match(sw, /caches\.delete/);
    const joined = pages.map((item) => item.body).join("\n") + sw;
    assert.equal(/gtag|google-analytics|googletagmanager|plausible|posthog/i.test(joined), false);
    for (const item of pages) {
      if (item.rel.endsWith("tablero/index.html")) continue;
      assert.deepEqual(bannedHits(item.body), [], item.rel);
    }
  });

  test("la paleta tiene contraste suficiente y el css la usa", () => {
    assert.ok(contrast(PALETTE.text, PALETTE.bg) >= 7);
    assert.ok(contrast(PALETTE.muted, PALETTE.bg) >= 4.5);
    assert.ok(contrast(PALETTE.accentInk, PALETTE.accent) >= 4.5);
    assert.ok(contrast(PALETTE.accent, PALETTE.bg) >= 3);
    assert.ok(contrast(PALETTE.ok, PALETTE.bg) >= 4.5);
    assert.ok(contrast(PALETTE.attention, PALETTE.bg) >= 4.5);
    assert.ok(contrast(PALETTE.risk, PALETTE.bg) >= 4.5);
    for (const color of Object.values(PALETTE)) {
      assert.match(css, new RegExp(color, "i"));
    }
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion/);
  });

  test("lab, verify y tablero salen de los datos del repositorio", () => {
    const lab = page(pages, "lab/index.html");
    const verify = page(pages, "verify/index.html");
    const board = page(pages, "tablero/index.html");
    assert.match(lab, /data-mission="mision-01"/);
    assert.match(lab, /Cómo detectar un token clon en 5 comprobaciones/);
    assert.match(lab, /How to spot a clone token in 5 checks/);
    assert.match(lab, /TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump/);
    assert.match(missionJs, /function answer/);
    assert.match(missionJs, /function initialProgress/);
    assert.match(verify, /EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/);
    assert.match(verify, /no disponible/);
    assert.match(board, /data-status="en_revision"/);
    assert.match(board, /id="tarea-U01"/);
    assert.equal(board.includes('id="tarea-U01" data-status="publicada"'), false);
    assert.equal(board.includes('data-web="si"'), false);
    assert.match(board, /https:\/\/github.com\/stubxai\/stubx-agent\/pull\/13/);
    assert.match(board, /lab\/test\/mission\.test\.ts/);
    assert.match(board, /\.github\/workflows\/ci\.yml/);
    assert.match(page(pages, "index.html"), /href="\.\/lab\/index\.html"/);
  });

  test("los svg decorativos no se anuncian como imagen sin texto", () => {
    for (const item of htmlPages) {
      for (const svg of item.body.matchAll(/<svg\b[^>]*>/gi)) {
        assert.match(svg[0] ?? "", /aria-hidden="true"/);
      }
    }
  });
});
