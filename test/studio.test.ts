import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../src/paths.js";

const LICENSE_ES =
  "Recursos de STUBX (Agente Talón, imágenes de fondo y kit): puedes usarlos para crear contenido no comercial sobre STUBX. El personaje y parte de los recursos se han generado con IA y es posible que no tengan protección de derechos de autor en todos los países; no damos garantías sobre esos derechos. No puedes usarlos para hacerte pasar por @stubxai ni por el equipo, ni para presentar algo como oficial, ni en estafas, clones o promociones de otros tokens. Tú eres responsable de lo que escribes y publicas. No uses imágenes, marcas ni datos de otras personas sin su permiso. Podemos retirar este permiso si se usa mal.";
const LICENSE_EN =
  "STUBX assets (Agente Talón, backgrounds and kit): you may use them to create non-commercial content about STUBX. The character and some assets were generated with AI and may not be protected by copyright in every country; we make no warranties about those rights. You may not use them to impersonate @stubxai or the team, to present anything as official, or for scams, clones or promoting other tokens. You are responsible for what you write and publish. Do not use other people's images, brands or data without their permission. We may withdraw this permission if it is misused.";

const REQUIRED_TERMS = [
  "fomo",
  "última oportunidad",
  "last chance",
  "hoy o nunca",
  "antes de que suba",
  "before it pumps",
  "corre",
  "hurry",
  "solo hoy",
  "limited",
  "cuenta atrás",
  "countdown",
  "precio",
  "price",
  "market cap",
  "mcap",
  "capitalización",
  "volumen",
  "volume",
  "chart",
  "gráfico",
  "x10",
  "10x",
  "x100",
  "100x",
  "1000x",
  "moon",
  "to the moon",
  "lambo",
  "rocket",
  "cohete",
  "holders",
  "holder",
  "hodl",
  "holdea",
  "listing",
  "listado",
  "listará",
  "binance",
  "coinbase",
  "cex",
  "garantizado",
  "guaranteed",
  "sin riesgo",
  "risk-free",
  "rentabilidad",
  "retorno",
  "roi",
  "ganancias",
  "gains",
  "profit",
  "beneficio",
  "pasivo",
  "passive income",
  "sorteo",
  "giveaway",
  "airdrop",
  "regalo",
  "free tokens",
  "recompensa",
  "reward",
  "fund",
  "tesorería",
  "treasury",
  "reserva",
  "reserve",
  "respaldo",
  "backing",
  "backed",
  "compra ya",
  "compra",
  "comprar",
  "buy now",
  "invierte",
  "invest",
  "pump",
  "pump.fun",
  "oficial",
  "official",
  "verificado",
  "verified",
  "partner",
  "anuncio oficial",
  "cristian",
  "pardo",
  "camacho",
];

type Hit = { kind: string; term: string };
type Analyze = (text: string) => { blocked: boolean; hits: Hit[] };
type Glyph = {
  ch: string;
  x: number;
  y: number;
  size: number;
  role: string;
  missing?: boolean;
};
type Card = {
  rgba: Uint8ClampedArray;
  png: Uint8Array;
  width: number;
  height: number;
  glyphs: Glyph[];
  fits: boolean;
  brandFontSize: number;
  brandTop: number;
  footerTop: number;
  label: string;
  watermarkAlpha: number;
  fill: number[];
  texts: string[];
};
type InkPoint = { col: number; row: number };

function studioRoot(): string {
  return path.join(repoRoot(), "web/v2/studio");
}

function readStudio(rel: string): string {
  return readFileSync(path.join(studioRoot(), rel), "utf8");
}

async function load<T>(rel: string): Promise<T> {
  return (await import(pathToFileURL(path.join(studioRoot(), rel)).href)) as T;
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? (map.get(key) ?? null) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

function pixel(card: Card, x: number, y: number): number[] {
  const i = (y * card.width + x) * 4;
  return [card.rgba[i] ?? 0, card.rgba[i + 1] ?? 0, card.rgba[i + 2] ?? 0, card.rgba[i + 3] ?? 0];
}

function glyphPixel(card: Card, glyph: Glyph, point: InkPoint): number[] {
  const scale = glyph.size / 8;
  const x = Math.floor(glyph.x + point.col * scale);
  const y = Math.floor(glyph.y + point.row * scale);
  return pixel(card, x, y);
}

function sameColor(got: number[], want: readonly number[]): boolean {
  return got[0] === want[0] && got[1] === want[1] && got[2] === want[2] && got[3] === want[3];
}

function joined(card: Card, role: string): string {
  return card.glyphs
    .filter((glyph) => glyph.role === role)
    .map((glyph) => glyph.ch)
    .join("");
}

describe("studio", () => {
  test("la lista cubre el dictamen y las palabras cortas no se buscan como fragmento", async () => {
    const list = JSON.parse(readStudio("blocklist.json")) as {
      shortWords: string[];
      terms: string[];
      emojis: string[];
      emojiSequences: string[];
      handles: string[];
      domains: string[];
    };
    assert.deepEqual(list.shortWords, ["ya", "now", "buy", "fondo", "return", "ape", "ath"]);
    for (const term of REQUIRED_TERMS) assert.ok(list.terms.includes(term), term);
    for (const word of list.shortWords) assert.equal(list.terms.includes(word), false, word);
    assert.deepEqual(list.emojis, ["🚀", "🌕", "📈", "💎", "🙌", "🤑", "💰"]);
    assert.deepEqual(list.emojiSequences, ["💎🙌"]);
    assert.deepEqual(list.handles, ["stubxai", "CreadorSTUBX"]);
    assert.deepEqual(list.domains, ["stubxai.com", "t.me"]);

    const { analyze, exportAllowed } = await load<{ analyze: Analyze; exportAllowed: (title: string, body: string) => boolean }>(
      "lib/filter.mjs",
    );
    const blocked = [
      "MOON",
      "m o o n",
      "m.o.o.n",
      "mo\u200Bon",
      "mооn",
      "x 1 0 0",
      "x100",
      "c0mpra-ya",
      "g4r4ntiz4d0",
      "garantizadó",
      "últimá oportunidad",
      "l1sting",
      "h0dl",
      "y4",
      "en el fondo",
      "correo urgente",
      "correcto",
      "🚀",
      "🚀\uFE0F",
      "💎🙌",
      "😀 no, pero 💰 sí",
      "https://example.com/ruta",
      "www.example.org",
      "mira stubxai . com",
      "entra en t . me",
      "@stubxai",
      "@ stubxai",
      "@CreadorSTUBX",
      "＠stubxai",
      "1".repeat(32),
      "1".repeat(44),
      "Zz9".repeat(11),
      [..."Zz9".repeat(11)].join(" "),
      "antes de que suba el gráfico",
      "profundo",
    ];
    for (const sample of blocked) {
      assert.equal(analyze(sample).blocked, true, sample);
    }
    const allowed = [
      "playa",
      "knowledge",
      "buyer",
      "papel",
      "athlete",
      "returning",
      "fondos",
      "comprobar la dirección",
      "La gracia no sustituye a mirar nada mas ahora.",
      "abc".repeat(12),
      "El nombre no basta",
      "hablo de stubxai",
      "@stubxaiextra",
      "1".repeat(31),
      `${"1".repeat(20)}0${"1".repeat(20)}`,
      "😀",
      "Una nota sin enlace.",
    ];
    for (const sample of allowed) {
      assert.equal(analyze(sample).blocked, false, sample);
    }
    assert.equal(exportAllowed("playa", "comprobar"), true);
    assert.equal(exportAllowed("playa", "moon"), false);
    assert.equal(analyze("correo").hits.some((hit) => hit.term === "corre"), true);
    assert.equal(analyze("profundo").hits.some((hit) => hit.term === "fund"), true);
  });

  test("el filtro no mira la marca ni el pie, y el dibujo sí los incluye", async () => {
    const { analyze, exportAllowed } = await load<{ analyze: Analyze; exportAllowed: (title: string, body: string) => boolean }>(
      "lib/filter.mjs",
    );
    const { BRAND, FOOTER, WATERMARK } = await load<{
      BRAND: { es: string; en: string };
      FOOTER: { es: string; en: string };
      WATERMARK: string;
    }>("lib/copy.mjs");
    assert.equal(analyze(BRAND.es).blocked, true);
    assert.equal(analyze(BRAND.en).blocked, true);
    assert.equal(analyze(FOOTER.en).blocked, true);
    assert.equal(analyze(WATERMARK).blocked, true);
    const templates = JSON.parse(readStudio("templates.json")) as {
      templates: { title: { es: string; en: string }; body: { es: string; en: string } }[];
    };
    for (const template of templates.templates) {
      for (const lang of ["es", "en"] as const) {
        assert.equal(exportAllowed(template.title[lang], template.body[lang]), true, `${template.title[lang]} / ${template.body[lang]}`);
      }
    }
  });

  test("aiOrigin elige la etiqueta más restrictiva y el catálogo la declara", async () => {
    const { aiLabel, AI_LABEL } = await load<{
      aiLabel: (origins: string[], lang: string) => string;
      AI_LABEL: { ai: { es: string; en: string }; mascota: { es: string; en: string } };
    }>("lib/copy.mjs");
    assert.equal(AI_LABEL.ai.es, "Imagen generada con IA");
    assert.equal(AI_LABEL.ai.en, "AI-generated image");
    assert.equal(AI_LABEL.mascota.es, "Ilustración con elementos generados con IA.");
    assert.equal(AI_LABEL.mascota.en, "Illustration with AI-generated elements.");
    assert.equal(aiLabel([], "es"), "");
    assert.equal(aiLabel(["ninguno"], "es"), "");
    assert.equal(aiLabel(["mascota"], "es"), AI_LABEL.mascota.es);
    assert.equal(aiLabel(["mascota"], "en"), AI_LABEL.mascota.en);
    assert.equal(aiLabel(["ai"], "es"), AI_LABEL.ai.es);
    assert.equal(aiLabel(["ai", "mascota", "ninguno"], "en"), AI_LABEL.ai.en);

    const catalog = JSON.parse(readStudio("catalog.json")) as {
      items: { archivo: string; licencia: string; permitido: boolean; aiOrigin: string; sha256: string }[];
    };
    const origins = new Set(catalog.items.map((item) => item.aiOrigin));
    assert.deepEqual([...origins].sort(), ["mascota", "ninguno"]);
    for (const item of catalog.items) {
      assert.equal(item.permitido, true, item.archivo);
      assert.ok(["ai", "mascota", "ninguno"].includes(item.aiOrigin), item.archivo);
      const bytes = readFileSync(path.join(studioRoot(), item.archivo));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, item.archivo);
    }
    const reglas = readStudio("reglas/index.html");
    for (const item of catalog.items) assert.ok(reglas.includes(item.licencia), item.licencia);
  });

  test("la licencia va literal, sin fondos, y no hay galería ni subidas", () => {
    const editor = readStudio("index.html");
    const reglas = readStudio("reglas/index.html");
    const script = readStudio("studio.js");
    assert.ok(reglas.includes(LICENSE_ES));
    assert.ok(reglas.includes(LICENSE_EN));
    assert.equal(reglas.includes("fondos"), false);
    assert.equal(editor.includes("fondos"), false);
    for (const html of [editor, reglas]) {
      assert.equal(/<form\b/.test(html), false);
      assert.equal(/type="file"/.test(html), false);
      assert.match(html, /No hay subida de archivos ni galería pública/);
      assert.match(html, /There is no file upload and no public gallery/);
    }
    assert.equal(/type="file"|<form\b|gallery|galería/.test(script), false);
    assert.match(script, /canvas\.toBlob/);
    assert.match(script, /injectComment/);
    assert.match(script, /navigator\.share/);
    assert.match(script, /exportAllowed/);
    assert.match(editor, /id="descargar"[^>]*disabled/);
    assert.match(editor, /id="borrar"/);
    assert.match(readStudio("studio.css"), /min-height:\s*44px/);
  });

  test("no hay hosts externos en el editor y la navegación y el CSP de Studio están puestos", () => {
    const allowed = new Set(["stubxai.com", "www.stubxai.com"]);
    const oflHosts = new Set(["github.com", "scripts.sil.org"]);
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full, out);
        else out.push(full);
      }
      return out;
    };
    for (const file of walk(studioRoot())) {
      const rel = path.relative(studioRoot(), file);
      if (!/\.(html|js|mjs|css|json|txt)$/.test(file)) continue;
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/https?:\/\/([^/\s"'<>)]+)/g)) {
        const host = (match[1] ?? "").toLowerCase();
        if (rel.endsWith(".txt")) assert.ok(oflHosts.has(host), `${host} en ${rel}`);
        else assert.ok(allowed.has(host), `${host} en ${rel}`);
      }
    }
    const home = readFileSync(path.join(repoRoot(), "web/v2/index.html"), "utf8");
    assert.match(home, /href="\/studio\/"/);
    const headers = readFileSync(path.join(repoRoot(), "web/v2/_headers"), "utf8");
    assert.match(headers, /\/studio\/\*[\s\S]*default-src 'none'/);
    assert.match(headers, /\/studio\/\*[\s\S]*worker-src 'none'/);
    assert.match(readStudio("index.html"), /default-src 'none'/);
    assert.match(readStudio("index.html"), /worker-src 'none'/);
    const visible = ["index.html", "reglas/index.html", "studio.js", "studio.css", "catalog.json", "templates.json"];
    for (const rel of visible) {
      const text = readStudio(rel);
      assert.equal(/\bholders?\b/i.test(text), false, rel);
      assert.equal(/\breserves?\b/i.test(text), false, rel);
      assert.equal(/\breserva\b/i.test(text), false, rel);
    }
  });

  test("el borrador se guarda y se borra en local", async () => {
    const { DRAFT_KEY, loadDraft, saveDraft, clearDraft } = await load<{
      DRAFT_KEY: string;
      loadDraft: (storage: ReturnType<typeof memoryStorage>) => { v: number; title: string } | null;
      saveDraft: (storage: ReturnType<typeof memoryStorage>, draft: { title: string }) => void;
      clearDraft: (storage: ReturnType<typeof memoryStorage>) => void;
    }>("lib/draft.mjs");
    const storage = memoryStorage();
    assert.equal(DRAFT_KEY, "stubx-studio-draft");
    assert.equal(loadDraft(storage), null);
    saveDraft(storage, { title: "Hola" });
    assert.equal(loadDraft(storage)?.title, "Hola");
    assert.equal(loadDraft(storage)?.v, 1);
    clearDraft(storage);
    assert.equal(loadDraft(storage), null);
    storage.setItem(DRAFT_KEY, "{");
    assert.equal(loadDraft(storage), null);
  });

  test("cada PNG lleva banda, pie, marca de agua, contraste y comentario", { timeout: 120_000 }, async () => {
    const { renderCard, BRAND_BG, BRAND_FG, contrastHex } = await load<{
      renderCard: (options: Record<string, unknown>) => Promise<Card>;
      BRAND_BG: number[];
      BRAND_FG: number[];
      contrastHex: (a: string, b: string) => number;
    }>("lib/render.mjs");
    const { BRAND, FOOTER, PNG_COMMENT, AI_LABEL } = await load<{
      BRAND: { es: string; en: string };
      FOOTER: { es: string; en: string };
      PNG_COMMENT: string;
      AI_LABEL: { mascota: { es: string } };
    }>("lib/copy.mjs");
    const { readComments, injectComment } = await load<{
      readComments: (png: Uint8Array) => { keyword: string; text: string }[];
      injectComment: (png: Uint8Array, text: string) => Uint8Array;
    }>("lib/png.mjs");
    const { inkSpan } = await load<{ inkSpan: (ch: string) => { top: InkPoint; bottom: InkPoint } | null }>("lib/font.mjs");
    const templates = JSON.parse(readStudio("templates.json")) as {
      formats: { id: string; width: number; height: number }[];
      zones: Record<string, unknown>;
      templates: { title: { es: string; en: string }; body: { es: string; en: string } }[];
    };
    assert.ok(contrastHex("#f4f7fb", "#10243f") >= 4.5);

    const base = {
      width: 1080,
      height: 1080,
      lang: "es",
      title: "Hola",
      body: "Texto limpio para la prueba.",
      fill: "#0a090d",
      ink: "#fff3f5",
      origins: ["mascota"],
      zones: templates.zones,
    };
    const marked = await renderCard({ ...base, watermark: true });
    const plain = await renderCard({ ...base, watermark: false });
    assert.ok(marked.brandFontSize >= marked.height * 0.025);
    assert.ok(marked.brandFontSize >= 8);
    assert.equal(marked.label, AI_LABEL.mascota.es);
    assert.equal(joined(marked, "brand"), BRAND.es.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
    assert.equal(joined(marked, "footer"), FOOTER.es.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
    assert.equal(joined(marked, "ai"), AI_LABEL.mascota.es.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
    assert.ok(marked.watermarkAlpha >= 0.1 && marked.watermarkAlpha <= 0.15);
    assert.equal(readComments(marked.png).some((item) => item.keyword === "Comment" && item.text === PNG_COMMENT), true);
    const replaced = injectComment(marked.png, PNG_COMMENT);
    assert.equal(readComments(replaced).filter((item) => item.keyword === "Comment").length, 1);

    const brand = marked.glyphs.find((glyph) => glyph.role === "brand" && glyph.ch === "C");
    assert.ok(brand);
    const span = inkSpan("C");
    assert.ok(span);
    assert.ok(sameColor(glyphPixel(marked, brand, span.top), BRAND_FG));
    assert.ok(sameColor(glyphPixel(marked, brand, span.bottom), BRAND_FG));
    assert.ok(sameColor(pixel(marked, 2, marked.brandTop + 2), BRAND_BG));
    for (let y = marked.brandTop; y < marked.height; y += 1) {
      for (let x = 0; x < marked.width; x += 8) {
        assert.deepEqual(pixel(marked, x, y), pixel(plain, x, y));
      }
    }

    const fill = marked.fill;
    const wm = [255, 243, 245];
    const blend = (channel: number, ink: number) => Math.round(channel * (1 - marked.watermarkAlpha) + ink * marked.watermarkAlpha);
    const counts = [0, 0, 0, 0];
    for (let y = 0; y < marked.brandTop; y += 2) {
      for (let x = 0; x < marked.width; x += 2) {
        const before = pixel(plain, x, y);
        const after = pixel(marked, x, y);
        if (before[0] !== fill[0] || before[1] !== fill[1] || before[2] !== fill[2]) continue;
        if (after[0] === before[0] && after[1] === before[1] && after[2] === before[2]) continue;
        assert.equal(after[0], blend(before[0] ?? 0, wm[0] ?? 0));
        assert.equal(after[1], blend(before[1] ?? 0, wm[1] ?? 0));
        assert.equal(after[2], blend(before[2] ?? 0, wm[2] ?? 0));
        const qx = x < marked.width / 2 ? 0 : 1;
        const qy = y < marked.brandTop / 2 ? 0 : 2;
        counts[qx + qy] = (counts[qx + qy] ?? 0) + 1;
      }
    }
    assert.ok(counts.every((count) => count > 0), counts.join(","));

    const none = await renderCard({ ...base, origins: ["ninguno"], watermark: false });
    assert.equal(none.label, "");
    assert.equal(none.glyphs.some((glyph) => glyph.role === "ai"), false);

    const english = await renderCard({ ...base, lang: "en", origins: ["ninguno"], watermark: false });
    assert.equal(joined(english, "brand"), BRAND.en.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
    assert.equal(joined(english, "footer"), FOOTER.en.toLocaleUpperCase("es-ES").replaceAll(" ", ""));

    for (const format of templates.formats) {
      for (const template of templates.templates) {
        for (const lang of ["es", "en"] as const) {
          const card = await renderCard({
            width: format.width,
            height: format.height,
            lang,
            title: template.title[lang],
            body: template.body[lang],
            watermark: false,
            origins: ["mascota"],
            zones: templates.zones,
          });
          assert.equal(card.fits, true, `${format.id} ${lang} ${template.title[lang]}`);
          assert.ok(card.brandFontSize >= format.height * 0.025);
          assert.ok(joined(card, "footer").includes(lang === "es" ? "CRIPTO" : "HIGH-RISK"));
        }
      }
    }
  });

  test("un texto largo con eñe sigue llevando pie y marca", { timeout: 60_000 }, async () => {
    const { renderCard } = await load<{ renderCard: (options: Record<string, unknown>) => Promise<Card> }>("lib/render.mjs");
    const { FOOTER, BRAND } = await load<{ FOOTER: { es: string }; BRAND: { es: string } }>("lib/copy.mjs");
    const line = "¿Ñandú pingüino sigue en la viñeta? ¡Sí! ";
    const card = await renderCard({
      width: 1080,
      height: 1080,
      lang: "es",
      title: line.repeat(8),
      body: line.repeat(24),
      watermark: false,
      origins: [],
    });
    assert.equal(card.fits, false);
    assert.equal(joined(card, "brand"), BRAND.es.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
    assert.equal(joined(card, "footer"), FOOTER.es.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
    for (const ch of ["¿", "Ñ", "Ü", "¡"]) {
      const glyph = card.glyphs.find((item) => item.ch === ch && (item.role === "title" || item.role === "body"));
      assert.ok(glyph, ch);
      assert.equal(glyph.missing, false, ch);
    }
    const story = await renderCard({
      width: 1080,
      height: 1920,
      lang: "es",
      title: "Hola",
      body: "Texto corto.",
      watermark: false,
      origins: [],
    });
    assert.ok(story.brandFontSize >= 1920 * 0.025);
    assert.equal(joined(story, "footer"), FOOTER.es.toLocaleUpperCase("es-ES").replaceAll(" ", ""));
  });
});
