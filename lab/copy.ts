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

export const PRIVACY_ES =
  "Tu navegador consulta directamente un servicio público de Solana (api.mainnet-beta.solana.com o solana-rpc.publicnode.com), solo en lectura. Este sitio no guarda la dirección, pero ese servicio recibe la dirección y tu IP según sus propias condiciones.";

export const PRIVACY_EN =
  "Your browser queries a public Solana service directly (api.mainnet-beta.solana.com or solana-rpc.publicnode.com), read-only. This site does not store the address, but that service receives the address and your IP under its own terms.";

export const AUDIT_ES =
  "Lectura en directo de datos públicos de la blockchain. No es una auditoría, ni una recomendación, ni un aval. STUBX no tiene relación con este token salvo que sea la CA oficial. Que no aparezcan señales no significa que no haya riesgo.";

export const AUDIT_EN =
  "Live reading of public blockchain data. It is not an audit, a recommendation, or an endorsement. STUBX has no relationship with this token unless it is the official CA. No signals showing does not mean there is no risk.";

export const HOW_VERIFY = {
  es: [
    "Pega la dirección y pulsa Comprobar.",
    PRIVACY_ES,
    "Verás señales con una explicación en lenguaje llano. No es una puntuación.",
  ],
  en: [
    "Paste the address and press Check.",
    PRIVACY_EN,
    "You will see signals with a plain-language explanation. It is not a score.",
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
