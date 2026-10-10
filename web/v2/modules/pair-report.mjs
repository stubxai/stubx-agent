export const REPORT_VERSION = "u09-pares-1";
export const OFFICIAL_MINT = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
export const QUERY_LIMIT = 6;
export const QUERY_WINDOW_MS = 60_000;
export const NAME_LIMIT = 48;
export const PUBLIC_WARNING = {
  es: "Lectura de datos públicos. No es una comparación de calidad, ni una recomendación, ni un aval. STUBX no tiene relación con estos tokens salvo la CA oficial.",
  en: "Public data reading. It is not a quality comparison, a recommendation, or an endorsement. STUBX has no relationship with these tokens except the official CA.",
};

export function takeQuerySlot(stamps, now, limit = QUERY_LIMIT, windowMs = QUERY_WINDOW_MS) {
  const fresh = stamps.filter((stamp) => typeof stamp === "number" && now - stamp < windowMs);
  if (fresh.length >= limit) return { allowed: false, stamps: fresh };
  return { allowed: true, stamps: [...fresh, now] };
}

export async function readWithinLimit(stamps, now, read) {
  const slot = takeQuerySlot(stamps, now);
  if (!slot.allowed) return { allowed: false, stamps: slot.stamps, result: null };
  return { allowed: true, stamps: slot.stamps, result: await read() };
}

const INVISIBLE = /[\u061C\u180E\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

export function clipTokenName(name) {
  const cleaned = String(name ?? "").replace(INVISIBLE, "");
  const graphemes = [];
  for (const part of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(cleaned)) {
    const grapheme = /\p{Extended_Pictographic}/u.test(part.segment)
      ? part.segment
      : part.segment.replaceAll("\u200D", "");
    if (grapheme) graphemes.push(grapheme);
  }
  if (graphemes.length <= NAME_LIMIT) return graphemes.join("");
  return `${graphemes.slice(0, NAME_LIMIT).join("")}…`;
}

const FOOTER = {
  es: "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.",
  en: "High-risk crypto · You could lose everything · Not investment advice.",
};

export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function feeBps(field) {
  if (!field || field.status !== "leida" || typeof field.bps !== "bigint" || field.bps > 10000n) return null;
  return Number(field.bps);
}

export function describePair(state) {
  const protocolFeeBps = feeBps(state?.fees?.protocol);
  const creatorFeeBps = feeBps(state?.fees?.creator);
  if (!state || state.ok !== true) {
    return {
      ok: false,
      curve: "no_disponible",
      base: "desconocida",
      protocolFeeBps: null,
      creatorFeeBps: null,
    };
  }
  if (!state.curve) {
    return { ok: true, curve: "sin_curva", base: "desconocida", protocolFeeBps, creatorFeeBps };
  }
  const base = state.curve.quoteSol ? "SOL" : state.curve.quoteMint || "desconocida";
  if (state.curve.complete) {
    return { ok: true, curve: "completa", base, protocolFeeBps, creatorFeeBps };
  }
  return { ok: true, curve: "abierta", base, protocolFeeBps, creatorFeeBps };
}

export function evidenceRecord(input) {
  return {
    version: REPORT_VERSION,
    mint: input.mint,
    name: input.name ?? null,
    uri: input.uri ?? null,
    base: input.base,
    curve: input.curve,
    protocolFeeBps: input.protocolFeeBps,
    creatorFeeBps: input.creatorFeeBps,
    slot: input.slot ?? null,
    source: input.source,
    readAt: input.readAt,
    official: input.mint === OFFICIAL_MINT,
  };
}

function feeText(lang, labelEs, labelEn, bps) {
  if (bps === null) {
    return lang === "en"
      ? `${labelEn}: not available. Zero is not used in its place.`
      : `${labelEs}: no disponible. No se pone cero en su lugar.`;
  }
  return lang === "en" ? `${labelEn}: ${bps} basis points.` : `${labelEs}: ${bps} diezmilésimas.`;
}

export function snapshotLines(evidence, lang) {
  const en = lang === "en";
  const curve = {
    abierta: en ? "Curve: open." : "Curva: abierta.",
    completa: en ? "Curve: complete." : "Curva: completa.",
    sin_curva: en ? "Curve: no curve." : "Curva: no hay curva.",
    no_disponible: en ? "Curve: unavailable." : "Curva: no disponible.",
  };
  const base = evidence.base === "desconocida"
    ? (en ? "Base currency: unknown." : "Moneda base: desconocida.")
    : (en ? `Base currency: ${evidence.base}.` : `Moneda base: ${evidence.base}.`);
  const shown = evidence.name ? clipTokenName(evidence.name) : "";
  const name = evidence.name
    ? (en ? `Name read: ${shown}. It is account text, not an endorsement.` : `Nombre leído: ${shown}. Es un texto de la cuenta, no un aval.`)
    : (en ? "Name: not available. It is not filled in." : "Nombre: no disponible. No se rellena.");
  const lines = [
    { size: "large", text: evidence.readAt },
    { size: "body", text: en ? "Snapshot: it may have changed" : "Instantánea: puede haber cambiado" },
    { size: "body", text: en ? PUBLIC_WARNING.en : PUBLIC_WARNING.es },
    { size: "body", text: en ? "It is not an audit or a recommendation." : "No es una auditoría ni una recomendación." },
    { size: "body", text: en ? "No data is invented." : "No se inventa ningún dato." },
    {
      size: "body",
      text: evidence.official
        ? (en ? "This address matches the published STUBX CA." : "Esta dirección coincide con la CA publicada de STUBX.")
        : (en ? "STUBX does not review or endorse this token." : "STUBX no revisa ni respalda este token."),
    },
    { size: "body", text: en ? `Token analyzed: ${evidence.mint}` : `Token analizado: ${evidence.mint}` },
    { size: "body", text: name },
    { size: "body", text: base },
    { size: "body", text: curve[evidence.curve] ?? curve.no_disponible },
    { size: "body", text: feeText(en ? "en" : "es", "Comisión del protocolo", "Protocol fee", evidence.protocolFeeBps) },
    { size: "body", text: feeText(en ? "en" : "es", "Comisión de creación", "Creation fee", evidence.creatorFeeBps) },
    { size: "body", text: en ? "A pairing is not a collaboration or an endorsement." : "Un emparejamiento no es una colaboración ni un respaldo." },
    { size: "body", text: en ? "The hash detects changes against this evidence. It does not certify that it is true." : "El hash detecta cambios respecto a esta evidencia. No certifica que sea verdad." },
    { size: "small", text: en ? FOOTER.en : FOOTER.es },
    { size: "small", text: "generado con stubxai.com/verify" },
  ];
  if (evidence.slot === null || evidence.slot === undefined) {
    lines.splice(10, 0, { size: "body", text: en ? "Slot: not available." : "Slot: no disponible." });
  } else {
    lines.splice(10, 0, { size: "body", text: `Slot: ${evidence.slot}` });
  }
  return lines;
}

function wrapText(ctx, text, max, size) {
  ctx.font = `${size}px sans-serif`;
  const words = String(text).split(" ");
  const rows = [];
  let current = "";
  const take = (word) => {
    let chunk = "";
    for (const char of word) {
      const next = chunk + char;
      if (ctx.measureText(next).width > max && chunk) {
        rows.push(chunk);
        chunk = char;
      } else {
        chunk = next;
      }
    }
    return chunk;
  };
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= max) {
      current = trial;
      continue;
    }
    if (current) rows.push(current);
    current = ctx.measureText(word).width <= max ? word : take(word);
  }
  if (current) rows.push(current);
  if (!rows.length) rows.push("");
  return rows;
}

export function drawSnapshot(ctx, lines, width = 720) {
  const sizes = { large: 28, body: 16, small: 12 };
  const wrapped = [];
  for (const line of lines) {
    const size = sizes[line.size] ?? 16;
    for (const row of wrapText(ctx, line.text, width - 48, size)) wrapped.push({ text: row, size });
  }
  const height = 32 + wrapped.reduce((sum, row) => sum + row.size + 10, 0) + 16;
  if (ctx.canvas) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
  }
  ctx.fillStyle = "#071422";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#e8eef6";
  let y = 36;
  for (const row of wrapped) {
    ctx.font = `${row.size}px sans-serif`;
    ctx.fillText(row.text, 24, y);
    y += row.size + 10;
  }
  return { width, height };
}
