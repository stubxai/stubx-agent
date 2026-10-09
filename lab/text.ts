const BANNED: readonly RegExp[] = [
  /rentabil/i,
  /precio/i,
  /\bprofit\b/i,
  /buy now/i,
  /compra ya/i,
  /apúrate/i,
  /apurate/i,
  /última hora/i,
  /ultimas horas/i,
  /últimas horas/i,
  /\bpremio\b/i,
  /\bpremios\b/i,
  /\breward\b/i,
  /\brewards\b/i,
  /\bwallet\b/i,
  /\bwallets\b/i,
  /seed phrase/i,
  /frase semilla/i,
  /clave privada/i,
  /private key/i,
  /gtag\(/,
  /google-analytics/i,
  /googletagmanager/i,
  /plausible/i,
  /posthog/i,
];

export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
    return out;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStrings(item, out);
    }
  }
  return out;
}

export function bannedHits(value: unknown): string[] {
  const hits: string[] = [];
  for (const text of collectStrings(value)) {
    for (const pattern of BANNED) {
      if (pattern.test(text)) {
        hits.push(`${pattern.source} :: ${text.slice(0, 120)}`);
      }
    }
  }
  return hits;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderInline(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replaceAll(/`([^`]+)`/g, (_match, code: string) => `<code>${code}</code>`);
}

export function renderMarkdown(source: string): string {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  let html = "";
  let list: string[] | null = null;
  const flush = (): void => {
    if (!list) {
      return;
    }
    html += `<ul>${list.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    list = null;
  };
  for (const line of lines) {
    if (line.startsWith("- ")) {
      list ??= [];
      list.push(renderInline(line.slice(2)));
      continue;
    }
    flush();
    if (line.startsWith("# ")) {
      html += `<h2>${renderInline(line.slice(2))}</h2>`;
    } else if (line.startsWith("## ")) {
      html += `<h3>${renderInline(line.slice(3))}</h3>`;
    } else if (line.trim() !== "") {
      html += `<p>${renderInline(line)}</p>`;
    }
  }
  flush();
  return html;
}

export type GuideBlocks = {
  es: string;
  en: string;
};

export function splitBilingualMarkdown(source: string): GuideBlocks | null {
  const esMark = "\n## Español\n";
  const enMark = "\n## English\n";
  const normalized = source.replaceAll("\r\n", "\n");
  const esAt = normalized.indexOf(esMark);
  const enAt = normalized.indexOf(enMark);
  if (esAt < 0 || enAt < 0 || enAt < esAt) {
    return null;
  }
  const es = normalized.slice(esAt + esMark.length, enAt).trim();
  const en = normalized.slice(enAt + enMark.length).trim();
  if (es.length === 0 || en.length === 0) {
    return null;
  }
  return { es, en };
}
