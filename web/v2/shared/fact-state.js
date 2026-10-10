/**
 * Estado de un dato leído, separado del texto que se muestra.
 * ok: la consulta respondió y hay un valor.
 * ausente: la consulta respondió y el dato no está.
 * fallo: la consulta no respondió o rechazó la petición.
 * no_consultado: esta lectura no pidió ese dato.
 * Un valor vacío no se llama verificado. Un fallo no se llama ausencia.
 */

export const FACT = Object.freeze({
  ok: "ok",
  ausente: "ausente",
  fallo: "fallo",
  no_consultado: "no_consultado",
});

const WORDS = {
  ok: { es: "leído", en: "read" },
  ausente: { es: "ausente comprobado", en: "confirmed absent" },
  fallo: { es: "consulta fallida", en: "failed query" },
  no_consultado: { es: "no consultado", en: "not queried" },
};

const EMPTY = new Set([null, undefined, ""]);

export function factState(status, value) {
  if (status === "ok") return FACT.ok;
  if (status === "verificado" || status === "inferido" || status === "leida") {
    return EMPTY.has(value) ? FACT.ausente : FACT.ok;
  }
  if (status === "ausente" || status === "ausente_comprobado") return FACT.ausente;
  if (status === "fallo" || status === "consulta_fallida") return FACT.fallo;
  if (status === "no_consultado") return FACT.no_consultado;
  if (status === "no_aplica") return "no_aplica";
  if (status === "no_soportada") return FACT.fallo;
  if (status === "no_disponible") return FACT.fallo;
  return FACT.fallo;
}

export function factWord(state, lang) {
  const row = WORDS[state];
  if (!row) return lang === "en" ? "unknown" : "no se sabe";
  return lang === "en" ? row.en : row.es;
}

export function factLine(status, value, lang) {
  const state = factState(status, value);
  if (state === FACT.ok && !EMPTY.has(value)) return String(value);
  return factWord(state, lang);
}

export function combinesVerifiedWithMissing(status, value) {
  const state = factState(status, value);
  return (status === "verificado" || status === "ok") && state !== FACT.ok;
}

export function missingFacts(items, lang) {
  const missing = items.filter((item) => item.state !== FACT.ok && item.state !== "no_aplica");
  if (!missing.length) {
    return {
      state: "ok",
      text: lang === "en" ? "No requested fact is missing in this reading." : "No falta ningún dato pedido en esta lectura.",
    };
  }
  const text = missing.map((item) => `${item.label}: ${factWord(item.state, lang)}`).join("; ");
  return {
    state: "falta",
    text: lang === "en" ? `Missing data: ${text}.` : `Faltan datos: ${text}.`,
  };
}
