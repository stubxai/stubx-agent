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

export const WATERMARK = "no oficial · unofficial";

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
