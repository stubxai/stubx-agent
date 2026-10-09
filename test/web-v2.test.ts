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
  title: { es: string; en: string };
  partialNote: { es: string; en: string } | null;
  rows: { label: { es: string; en: string }; value: { es: string; en: string } }[];
};

type Lookup = {
  classifyAddress: (raw: string, cards: readonly object[], source?: string, evm?: readonly object[]) => View;
  emptyView: () => View;
  pendingView: (raw: string) => View;
  isAddress: (value: string) => boolean;
  normalizeAddress: (raw: string) => string;
};

function redirectMap(root: string): Map<string, string> {
  const text = readFileSync(path.join(root, "_redirects"), "utf8");
  const map = new Map<string, string>();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    const from = parts[0] ?? "";
    const to = (parts[1] ?? "").split("#")[0] ?? "";
    if (from.startsWith("/") && to) map.set(from.replace(/\/+$/, "") || "/", to);
  }
  return map;
}

function localTargetExists(root: string, fromFile: string, url: string): boolean {
  const clean = (url.split("#")[0] ?? "").replace(/\/+$/, "") || "/";
  const candidate = clean.startsWith("/")
    ? path.join(root, clean === "/" ? "index.html" : clean.slice(1))
    : path.resolve(path.dirname(fromFile), clean);
  const asFile = candidate.endsWith(".html") || path.extname(candidate) !== "" ? candidate : path.join(candidate, "index.html");
  if (statSync(asFile, { throwIfNoEntry: false })?.isFile()) return true;
  if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return true;
  const rel = clean.startsWith("/") ? clean : `/${path.relative(root, candidate).split(path.sep).join("/")}`;
  const dest = redirectMap(root).get(rel.replace(/\/+$/, "") || "/");
  if (!dest) return false;
  if (dest.startsWith("http://") || dest.startsWith("https://")) return true;
  const destPath = path.join(root, dest.replace(/^\//, ""));
  return (
    statSync(destPath, { throwIfNoEntry: false })?.isFile() === true ||
    statSync(path.join(destPath, "index.html"), { throwIfNoEntry: false })?.isFile() === true
  );
}

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

  test("pages do not load a CDN or a remote stylesheet, and the worker stays under lab", () => {
    const root = siteRoot();
    for (const file of walk(root)) {
      const rel = path.relative(root, file);
      if (path.basename(file) === "sw.js") {
        assert.equal(rel, path.join("lab", "sw.js"));
      }
      const text = readFileSync(file, "utf8");
      if (/serviceWorker\.register/.test(text)) {
        assert.equal(rel, path.join("assets", "shell.js"));
      }
      if (!file.endsWith(".html") && !file.endsWith(".css") && !file.endsWith(".js")) continue;
      assert.equal(/url\(\s*['"]?https?:/i.test(text), false, rel);
    }
    const worker = read("lab/sw.js");
    assert.match(worker, /\/lab\//);
    assert.match(worker, /path === "\/"/);
    assert.match(worker, /aviso|notice/);
    const shell = read("assets/shell.js");
    assert.match(shell, /register\("\/lab\/sw\.js", \{ scope: "\/lab\/" \}\)/);
    assert.match(shell, /onLab && "serviceWorker" in navigator/);
    assert.match(read("lab/index.html"), /worker-src 'self'/);
    assert.match(read("index.html"), /worker-src 'none'/);
    assert.match(read("verify/index.html"), /worker-src 'none'/);
    for (const file of htmlFiles(root)) {
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        const url = match[1] ?? "";
        if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("mailto:")) continue;
        assert.equal(url.startsWith("//"), false, url);
      }
      const linked = [...html.matchAll(/<(?:script|img)\b[^>]*(?:src|href)="(https?:\/\/[^"]+)"/g)];
      const styles = [...html.matchAll(/<link\b(?![^>]*rel="canonical")[^>]*href="(https?:\/\/[^"]+)"/g)];
      assert.deepEqual(linked, [], path.relative(root, file));
      assert.deepEqual(styles, [], path.relative(root, file));
    }
  });

  test("local links, labels, alt text, and both languages stay paired", () => {
    const root = siteRoot();
    for (const file of htmlFiles(root)) {
      const html = readFileSync(file, "utf8");
      const es = html.match(/class="[^"]*\blang es\b[^"]*"/g)?.length ?? 0;
      const en = html.match(/class="[^"]*\blang en\b[^"]*"/g)?.length ?? 0;
      for (const img of html.matchAll(/<img\b[^>]*>/g)) {
        assert.match(img[0], /\balt="/);
      }
      for (const input of html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)) {
        const id = input[1] ?? "";
        assert.match(html, new RegExp(`<label[^>]*\\bfor="${id}"`));
      }
      if (path.basename(file) === "archivo.html") {
        assert.equal((html.match(/N\.º \d+ del inventario/g) ?? []).length, 18);
      } else {
        assert.equal(es, en, path.relative(root, file));
        assert.ok(es > 0);
      }
      for (const match of html.matchAll(/\b(?:href|src|srcset)="([^"]+)"/g)) {
        const raw = match[1] ?? "";
        for (const part of raw.split(",")) {
          const url = part.trim().split(/\s+/)[0] ?? "";
          if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("https://") || url.startsWith("http://")) {
            continue;
          }
          assert.equal(localTargetExists(root, file, url), true, `${url} from ${path.relative(root, file)}`);
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
    assert.match(html, /2026-10-09/);
    assert.match(html, /USD Coin/);
    assert.equal(html.includes("\uFFFD"), false);
    assert.match(html, /assets\/verify\.js/);
    const bundle = read("assets/verify.js");
    assert.match(bundle, /stubx-verify-preview/);
    assert.match(bundle, /ERYyyaE2Y2GuKB28YbC2w1nCuQ5ENQ89LR44kicvpump/);
    assert.match(bundle, /FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump/);
    assert.match(bundle, /0xC99056C762F0802e4154E6322bd71ae928857777/);
    assert.equal(/fetch\(/.test(bundle), false);
    assert.equal(bundle.includes("\uFFFD"), false);
    const snap = JSON.parse(read("modules/snapshot.json")) as { commit: string; merged: boolean; liveNetwork: boolean; cardsDate: string };
    assert.equal(snap.commit, "635a1edf39faf8fb68a5b164f79ef948a32e1dc9");
    assert.equal(snap.merged, false);
    assert.equal(snap.liveNetwork, false);
    assert.equal(snap.cardsDate, "2026-10-09");
  });

  test("lookup classifies the 2026-10-09 cards, the older clones, and 0x addresses", async () => {
    const href = pathToFileURL(path.join(siteRoot(), "modules/verify/lookup.mjs")).href;
    const lookup = (await import(href)) as Lookup;
    const data = JSON.parse(read("modules/verify/cards.json")) as { cards: object[]; evm: object[] };
    assert.equal(data.cards.length, 7);
    assert.equal(data.evm.length, 2);
    assert.equal(lookup.emptyView().kind, "vacio");
    assert.equal(lookup.pendingView(CA).kind, "comprobando");
    assert.equal(lookup.classifyAddress("", data.cards, "lista", data.evm).kind, "vacio");
    assert.equal(lookup.classifyAddress("no es una direccion", data.cards, "lista", data.evm).kind, "invalida");
    const official = lookup.classifyAddress(`  ${CA.slice(0, 8)} ${CA.slice(8)}  `, data.cards, "lista", data.evm);
    assert.equal(official.kind, "oficial");
    assert.equal(official.light, "ok");
    assert.equal(official.mint, CA);
    assert.match(official.partialNote?.es ?? "", /censo/);
    const clone = lookup.classifyAddress(CLONE, data.cards, "lista", data.evm);
    assert.equal(clone.kind, "copia");
    assert.equal(clone.light, "riesgo");
    const ery = lookup.classifyAddress("ERYyyaE2Y2GuKB28YbC2w1nCuQ5ENQ89LR44kicvpump", data.cards, "lista", data.evm);
    assert.equal(ery.kind, "copia");
    const fmn = lookup.classifyAddress("FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump", data.cards, "lista", data.evm);
    assert.equal(fmn.kind, "copia");
    const other = lookup.classifyAddress(USDC, data.cards, "lista", data.evm);
    assert.equal(other.kind, "otra");
    assert.equal(other.light, "atencion");
    const usdcName = other.rows.find((row) => row.label.es === "Nombre");
    assert.equal(usdcName?.value.es, "USD Coin");
    assert.equal(usdcName?.value.es.includes("\uFFFD"), false);
    const knownEvm = lookup.classifyAddress("0xC99056C762F0802e4154E6322bd71ae928857777", data.cards, "lista", data.evm);
    assert.equal(knownEvm.kind, "evm");
    assert.equal(knownEvm.light, "riesgo");
    assert.equal(knownEvm.title.es, "Copia conocida");
    const otherEvm = lookup.classifyAddress("0x0000000000000000000000000000000000000001", data.cards, "lista", data.evm);
    assert.equal(otherEvm.kind, "evm");
    assert.equal(otherEvm.light, "atencion");
    assert.match(otherEvm.title.es, /solo existe en Solana/);
    const missing = lookup.classifyAddress("11111111111111111111111111111111", data.cards, "lista", data.evm);
    assert.equal(missing.kind, "sin_ficha");
    const down = lookup.classifyAddress(CA, data.cards, "caida", data.evm);
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

  test("public anchors, the archive, and the publish flag stay intact", () => {
    const home = read("index.html");
    for (const id of ["wallets", "transparencia", "reparto", "estado", "ppm"]) {
      assert.match(home, new RegExp(`id="${id}"`));
    }
    for (const rel of ROUTES) {
      const html = read(rel);
      assert.equal(html.includes("Cristian"), false, rel);
      assert.equal(html.split('class="draft"').length - 1, 1, rel);
      assert.match(html, /Borrador del repositorio\. No publicado en stubxai.com\./);
      assert.match(html, /rel="canonical" href="https:\/\/stubxai.com\//);
      assert.match(html, /property="og:image"/);
      assert.match(html, /name="twitter:card"/);
    }
    assert.equal(read("archivo.html").includes("Cristian"), false);
    assert.match(read("404.html"), /href="\/assets\/site\.css"/);
    assert.match(read("404.html"), /href="\/"/);
    assert.equal(/href="assets\//.test(read("404.html")), false);
    const redirects = read("_redirects");
    assert.match(redirects, /https:\/\/superb-horse-9036f5\.netlify\.app\/\*  https:\/\/stubxai.com\/:splat  301!/);
    assert.equal(redirects.includes("/proofs/#archivo"), false);
    assert.match(read("_headers"), /Strict-Transport-Security: max-age=31536000; includeSubDomains/);
    assert.match(read("_headers"), /Cloudflare Pages/);
    const robots = read("robots.txt");
    for (const bot of ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot", "anthropic-ai", "Applebot-Extended", "Bytespider", "meta-externalagent"]) {
      assert.match(robots, new RegExp(`User-agent: ${bot}\\nDisallow: /`));
    }
    assert.match(read("sitemap.xml"), /https:\/\/stubxai.com\/verify\//);
    assert.match(read("sitemap.xml"), /https:\/\/stubxai.com\/archivo\.html/);
    const security = read("security/index.html");
    assert.match(security, /ERYyyaE2Y2GuKB28YbC2w1nCuQ5ENQ89LR44kicvpump/);
    assert.match(security, /FMNb4CR8ksibmgY7Ztei6BWcZXi3WHcVeJhYb9TNpump/);
    assert.match(security, /0xC99056C762F0802e4154E6322bd71ae928857777/);
    assert.match(security, /0xAEE5212f20cc95370cb3556c4493CFD07721a5a3/);
    assert.match(security, /Cloudflare Pages/);
    assert.match(security, /edad mínima de 18 años/);
    assert.match(security, /de práctica/);
    assert.match(security, /STUBX no es un exchange/);
    assert.match(read("tokenomics/index.html"), /se mezcló con su dinero; no se usó por separado para el proyecto/);
    assert.match(read("marca/index.html"), /ipfs add --only-hash --cid-version=1 --raw-leaves/);
    assert.match(read("marca/index.html"), /bfae3649d4b255d72ca13985344082b079cdf4a3cdd582c6e5b224d1d96a2d17/);
    assert.match(read("marca/index.html"), /id="reglas"/);
    const phrases = spawnSync("python3", ["web/v2/tools/check_legal_phrases.py"], { cwd: repoRoot(), encoding: "utf8" });
    assert.equal(phrases.status, 0, phrases.stderr);
    const refused = spawnSync("python3", ["web/v2/tools/build_site.py", "--publish"], {
      cwd: repoRoot(),
      encoding: "utf8",
      env: { ...process.env, STUBX_PUBLISH: "" },
    });
    assert.equal(refused.status, 1, refused.stdout);
    assert.match(refused.stderr, /STUBX_PUBLISH=1 y --publish/);
    assert.match(read("index.html"), /class="draft"/);
    const flag = spawnSync(
      "python3",
      [
        "-c",
        [
          "import importlib.util",
          "spec = importlib.util.spec_from_file_location('build_site', 'web/v2/tools/build_site.py')",
          "mod = importlib.util.module_from_spec(spec)",
          "spec.loader.exec_module(mod)",
          "assert mod.draft_html(True) == ''",
          "draft = mod.draft_html(False)",
          "assert draft.count('class=\"draft\"') == 1",
          "assert 'Cristian' not in draft",
          "assert 'No publicado en stubxai.com' in draft",
        ].join("\n"),
      ],
      { cwd: repoRoot(), encoding: "utf8" },
    );
    assert.equal(flag.status, 0, flag.stderr);
  });

  test("the lab bundle hook keeps the snapshot when lab/ is absent", () => {
    const run = spawnSync(process.execPath, ["web/v2/tools/bundle-from-lab.mjs"], {
      cwd: repoRoot(),
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /635a1ed/);
  });
});
