export const DISCLAIMER =
  "Herramienta educativa con datos públicos. No es consejo de inversión. Cripto de alto riesgo · Puedes perderlo todo.";

export const DISCLAIMER_EN =
  "Educational tool using public data. Not investment advice. High-risk crypto · You could lose everything.";

export const UNKNOWN_LINE = {
  es: "Lo desconocido no es lo mismo que lo comprobado.",
  en: "Unknown is not the same as verified.",
} as const;

export const OFFLINE_LINE = {
  es: "Copia estática. Sin conexión se puede leer; no actualiza la cadena.",
  en: "Static copy. It can be read offline; it does not update the chain.",
} as const;

export const DRAFT_LINE = {
  es: "Borrador del repositorio. No publicado en stubxai.com.",
  en: "Repository draft. Not published on stubxai.com.",
} as const;

export const READONLY_LINE = {
  es: "Solo lectura: no conecta carteras ni firma nada. Las fichas no son una auditoría ni una garantía.",
  en: "Read-only: it does not connect wallets or sign anything. The cards are not an audit or a guarantee.",
} as const;

export const HOW_VERIFY = {
  es: [
    "Pega la dirección y pulsa Comprobar.",
    "El texto grande es la lectura. Los datos técnicos están plegados.",
    "Si se parece a la oficial y no lo es, lo dice y marca los caracteres que cambian. Si no hay ficha y no se parece, no se pudo comprobar: esta página no llama a la red.",
  ],
  en: [
    "Paste the address and press Check.",
    "The large text is the reading. Technical details stay folded.",
    "If it looks like the official one and it is not, the page says so and marks the characters that change. If there is no card and it does not look alike, it could not be checked: this page does not call the network.",
  ],
} as const;

export const HOW_LAB = {
  es: [
    "Lee la pregunta y elige una respuesta. Si encaja, pulsa Siguiente paso.",
    "Si no encaja, verás por qué y puedes probar otra.",
    "El progreso se queda en este navegador. No hay cuenta ni puntuación.",
  ],
  en: [
    "Read the question and choose an answer. If it fits, press Next step.",
    "If it does not fit, you will see why and you can try another.",
    "Progress stays in this browser. There is no account and no score.",
  ],
} as const;
