/** Textos fijos del PNG. El filtro no los evalúa: la marca y el pie se dibujan siempre. */

import { clipToken, isStubxToken } from "./logo.mjs";

export const BRAND = {
  es: "Contenido comunitario · no oficial",
  en: "Community content · unofficial",
};

export const RISK = {
  es: "Cripto de alto riesgo",
  en: "High-risk crypto",
};

export const FOOTER = {
  es: "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.",
  en: "High-risk crypto · You could lose everything · Not investment advice.",
};

/**
 * Aviso mínimo de la imagen. Legal aprueba estas cadenas: se cambian aquí y en ningún otro sitio.
 * NOTICE_FULL en imágenes de 1080 px o más en el lado corto. NOTICE_SHORT en formatos más pequeños.
 */
export const NOTICE_FULL = {
  es: "Contenido comunitario · No oficial · Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión",
  en: "Community content · Unofficial · High-risk crypto · You could lose everything · Not investment advice",
};

export const NOTICE_SHORT = {
  es: "No oficial · Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión",
  en: "Unofficial · High-risk crypto · You could lose everything · Not investment advice",
};

export const NOTICE_MIN_PX = 14;
export const NOTICE_RATIO = 0.025;
export const NOTICE_REFERENCE = 1080;
export const WATERMARK_ALPHA = 0.65;

export const WATERMARK = "no oficial · unofficial";

const RISK_TAIL = {
  es: "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión",
  en: "High-risk crypto · You could lose everything · Not investment advice",
};

export function isSmallFormat(width, height) {
  const shortSide = Math.min(Number(width) || 0, Number(height) || 0);
  return shortSide < NOTICE_REFERENCE;
}

export function noticeFloor(height) {
  const h = Number(height) || 0;
  return Math.max(NOTICE_MIN_PX, Math.ceil(Math.min(h, NOTICE_REFERENCE) * NOTICE_RATIO));
}

export function noticeFor(lang, token, width, height) {
  const code = lang === "en" ? "en" : "es";
  const name = clipToken(token ?? "");
  if (name && !isStubxToken(name)) return `${brandFor(code, name)} · ${RISK_TAIL[code]}`;
  return isSmallFormat(width, height) ? NOTICE_SHORT[code] : NOTICE_FULL[code];
}

export const PNG_COMMENT = "Community content, unofficial. Not from @stubxai.";

export const AI_LABEL = {
  ai: {
    es: "Imagen generada con IA",
    en: "AI-generated image",
  },
  mascota: {
    es: "Ilustración con elementos generados con IA.",
    en: "Illustration with AI-generated elements.",
  },
};

export function brandFor(lang, token) {
  const name = clipToken(token);
  const code = lang === "en" ? "en" : "es";
  if (!name || isStubxToken(name)) return BRAND[code];
  if (code === "en") return `Not official from ${name} or STUBX`;
  return `No oficial de ${name} ni de STUBX`;
}

export function aiLabel(origins, lang) {
  const set = new Set(origins);
  const code = lang === "en" ? "en" : "es";
  if (set.has("ai")) return AI_LABEL.ai[code];
  if (set.has("mascota")) return AI_LABEL.mascota[code];
  return "";
}
