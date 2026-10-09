import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../src/paths.js";

const CA = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
const CLONE = "Hhq4ffySVX3UQqSowjhP1Lwa8YuJDf7iH2hYWvVHTuEf";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MICA_ES =
  "Esta comunicación publicitaria de criptoactivos no ha sido revisada ni aprobada por ninguna autoridad competente de ningún Estado miembro de la Unión Europea. El oferente del criptoactivo es el único responsable del contenido de esta comunicación publicitaria de criptoactivos.";
const MICA_EN =
  "This crypto-asset marketing communication has not been reviewed or approved by any competent authority in any Member State of the European Union. The offeror of the crypto-asset is solely responsible for the content of this crypto-asset marketing communication.";

const ROUTES = [
  "index.html",
  "verify/index.html",
  "lab/index.html",
  "tablero/index.html",
  "avances/index.html",
  "methodology/index.html",
  "security/index.html",
  "risks/index.html",
  "legal/index.html",
  "proofs/index.html",
  "status/index.html",
  "tokenomics/index.html",
  "community/index.html",
  "marca/index.html",
  "build/index.html",
  "aprender/index.html",
  "studio/index.html",
  "cuaderno/index.html",
  "contribuir/index.html",
  "404.html",
];

type View = {
  kind: string;
  light: string;
  mint: string | null;
  partialNote: { es: string; en: string } | null;
};

type Lookup = {
  classifyAddress: (raw: string, cards: readonly object[], source?: string) => View;
  emptyView: () => View;
  pendingView: (raw: string) => View;
  isAddress: (value: string) => boolean;
  normalizeAddress: (raw: string) => string;
};

function siteRoot(): string {
  return path.join(repoRoot(), "web", "v2");
}

function read(rel: string): string {
  return readFileSync(path.join(siteRoot(), rel), "utf8");
}

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function contrast(a: string, b: string): number {
  const lin = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
  };
  const hi = Math.max(lin(a), lin(b));
  const lo = Math.min(lin(a), lin(b));
  return (hi + 0.05) / (lo + 0.05);
}

describe("web v2", () => {
  test("every mapped route exists and shares the shell", () => {
    for (const rel of ROUTES) {
      const html = read(rel);
      assert.match(html, /<html lang="es"/);
      assert.match(html, /name="viewport"/);
      assert.match(html, /class="skip lang es"/);
      assert.match(html, /class="skip lang en"/);
      assert.match(html, /<title/);
      assert.match(html, /<main id="contenido"/);
      assert.match(html, /Content-Security-Policy/);
      assert.match(html, /assets\/site\.css/);
      assert.match(html, /assets\/shell\.js/);
      assert.match(html, /data-set-lang="es"/);
      assert.match(html, /data-set-lang="en"/);
    }
  });

  test("token.json matches the production copy byte for byte", () => {
    const root = repoRoot();
    const live = readFileSync(path.join(root, "web/v2/token.json"));
    const current = readFileSync(path.join(root, "web/current/token.json"));
    assert.deepEqual(live, current);
  });

  test("pages do not load a CDN, a service worker, or a remote stylesheet", () => {
    const root = siteRoot();
    for (const file of walk(root)) {
      const rel = path.relative(root, file);
      assert.equal(path.basename(file) === "sw.js", false, rel);
      const text = readFileSync(file, "utf8");
      assert.equal(/serviceWorker\.register/.test(text), false, rel);
      if (!file.endsWith(".html") && !file.endsWith(".css") && !file.endsWith(".js")) continue;
      assert.equal(/url\(\s*['"]?https?:/i.test(text), false, rel);
    }
    for (const file of htmlFiles(root)) {
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        const url = match[1] ?? "";
        if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("mailto:")) continue;
        assert.equal(url.startsWith("//"), false, url);
      }
      const linked = [...html.matchAll(/<(?:script|link|img)\b[^>]*(?:src|href)="(https?:\/\/[^"]+)"/g)];
      assert.deepEqual(linked, [], path.relative(root, file));
    }
  });

  test("local links, labels, alt text, and both languages stay paired", () => {
    const root = siteRoot();
    for (const file of htmlFiles(root)) {
      const html = readFileSync(file, "utf8");
      const es = html.match(/class="[^"]*\blang es\b[^"]*"/g)?.length ?? 0;
      const en = html.match(/class="[^"]*\blang en\b[^"]*"/g)?.length ?? 0;
      assert.equal(es, en, path.relative(root, file));
      assert.ok(es > 0);
      for (const img of html.matchAll(/<img\b[^>]*>/g)) {
        assert.match(img[0], /\balt="/);
      }
      for (const input of html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)) {
        const id = input[1] ?? "";
        assert.match(html, new RegExp(`<label[^>]*\\bfor="${id}"`));
      }
      for (const match of html.matchAll(/\b(?:href|src|srcset)="([^"]+)"/g)) {
        const raw = match[1] ?? "";
        for (const part of raw.split(",")) {
          const url = part.trim().split(/\s+/)[0] ?? "";
          if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("https://") || url.startsWith("http://")) {
            continue;
          }
          const clean = url.split("#")[0] ?? "";
          if (!clean) continue;
          const target = path.resolve(path.dirname(file), clean);
          assert.equal(statSync(target, { throwIfNoEntry: false }) !== undefined, true, `${url} from ${path.relative(root, file)}`);
        }
      }
    }
  });

  test("the official contract, channels, and notices are present in both languages", () => {
    const home = read("index.html");
    const security = read("security/index.html");
    const risks = read("risks/index.html");
    const legal = read("legal/index.html");
    for (const html of [home, security, risks, legal]) {
      assert.ok(html.includes(CA));
      assert.ok(html.includes(MICA_ES));
      assert.ok(html.includes(MICA_EN));
    }
    for (const html of [home, security]) {
      assert.match(html, /x\.com\/stubxai/);
      assert.match(html, /stubxai\.hq@gmail\.com/);
      assert.match(html, /github\.com\/stubxai\/stubx-agent/);
      assert.match(html, /t\.me\/stubxai/);
    }
    assert.match(home, /href="verify\/index\.html"/);
    assert.match(home, /Analizar token/);
    assert.match(home, /Analyze token/);
    assert.match(security, /Comunidad STUBX/);
    assert.match(security, /COMUNIDAD/);
    assert.match(risks, /puedes perder todo lo que aportes/);
    assert.match(risks, /you can lose everything you put in/i);
  });

  test("unbuilt modules stay explanatory", () => {
    for (const rel of ["studio/index.html", "cuaderno/index.html", "contribuir/index.html"]) {
      const html = read(rel);
      assert.match(html, /No construido/);
      assert.match(html, /Not built/);
      assert.equal(/<form\b/.test(html), false, rel);
      assert.equal(/<input\b/.test(html), false, rel);
      assert.equal(/type="file"/.test(html), false, rel);
    }
  });

  test("verify is the dated card demo, not a live reading", () => {
    const html = read("verify/index.html");
    assert.match(html, /id="consulta"/);
    assert.match(html, /id="direccion-token"/);
    assert.match(html, /id="resultado"/);
    assert.match(html, /id="ver-lectura-caida"/);
    assert.match(html, /2026-10-08/);
    assert.match(html, /assets\/verify\.js/);
    const bundle = read("assets/verify.js");
    assert.match(bundle, /stubx-verify-preview/);
    assert.equal(/fetch\(/.test(bundle), false);
    const snap = JSON.parse(read("modules/snapshot.json")) as { commit: string; merged: boolean; liveNetwork: boolean; cardsDate: string };
    assert.equal(snap.commit, "4161ee65fbcdff07f1e55a33e3973362c0592809");
    assert.equal(snap.merged, false);
    assert.equal(snap.liveNetwork, false);
    assert.equal(snap.cardsDate, "2026-10-08");
  });

  test("lookup classifies the real 2026-10-08 cards", async () => {
    const href = pathToFileURL(path.join(siteRoot(), "modules/verify/lookup.mjs")).href;
    const lookup = (await import(href)) as Lookup;
    const data = JSON.parse(read("modules/verify/cards.json")) as { cards: object[] };
    assert.equal(data.cards.length, 5);
    assert.equal(lookup.emptyView().kind, "vacio");
    assert.equal(lookup.pendingView(CA).kind, "comprobando");
    assert.equal(lookup.classifyAddress("", data.cards).kind, "vacio");
    assert.equal(lookup.classifyAddress("no es una direccion", data.cards).kind, "invalida");
    const official = lookup.classifyAddress(`  ${CA.slice(0, 8)} ${CA.slice(8)}  `, data.cards);
    assert.equal(official.kind, "oficial");
    assert.equal(official.light, "ok");
    assert.equal(official.mint, CA);
    assert.match(official.partialNote?.es ?? "", /incompleta/);
    const clone = lookup.classifyAddress(CLONE, data.cards);
    assert.equal(clone.kind, "copia");
    assert.equal(clone.light, "riesgo");
    const other = lookup.classifyAddress(USDC, data.cards);
    assert.equal(other.kind, "otra");
    assert.equal(other.light, "atencion");
    const missing = lookup.classifyAddress("11111111111111111111111111111111", data.cards);
    assert.equal(missing.kind, "sin_ficha");
    const down = lookup.classifyAddress(CA, data.cards, "caida");
    assert.equal(down.kind, "lectura_caida");
    assert.equal(down.light, "neutro");
  });

  test("palette pairs used as text clear 4.5:1", () => {
    const css = read("assets/tool.css");
    const pick = (name: string) => {
      const found = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
      assert.ok(found?.[1], name);
      return found[1];
    };
    const bg = pick("--bg");
    const elev = pick("--bg-elev");
    const text = pick("--text");
    const muted = pick("--muted");
    const accent = pick("--accent");
    const ink = pick("--accent-ink");
    for (const [fg, surface] of [
      [text, bg],
      [muted, bg],
      [text, elev],
      [muted, elev],
      [ink, accent],
      [pick("--ok"), bg],
      [pick("--attention"), bg],
      [pick("--risk"), bg],
    ] as const) {
      assert.ok(contrast(fg, surface) >= 4.5, `${fg} on ${surface}`);
    }
  });

  test("the lab bundle hook keeps the snapshot when lab/ is absent", () => {
    const run = spawnSync(process.execPath, ["web/v2/tools/bundle-from-lab.mjs"], {
      cwd: repoRoot(),
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /4161ee6/);
  });
});
