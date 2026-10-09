/**
 * API de navegador de STUBX Verify.
 * Es el mismo criterio que lab/verify/lookup.ts en la PR 14
 * (commit 4161ee65fbcdff07f1e55a33e3973362c0592809).
 * Hasta que esa rama se fusione, las fichas son la tanda del 2026-10-08.
 * No consulta la red.
 */

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const COPY = {
  vacio: {
    light: "neutro",
    lightLabel: { es: "Sin resultado", en: "No result" },
    title: { es: "La lectura aparece aquí", en: "The reading shows up here" },
    support: {
      es: "La lectura será una de estas tres. Los detalles técnicos se quedan plegados.",
      en: "The reading will be one of these three. Technical details stay folded.",
    },
  },
  invalida: {
    light: "atencion",
    lightLabel: { es: "Dirección no válida", en: "Address is not valid" },
    title: { es: "Esta dirección no es válida", en: "This address is not valid" },
    support: {
      es: "Tiene que ser la dirección completa, sin el nombre del token y sin texto alrededor.",
      en: "It has to be the full address, without the token name and without surrounding text.",
    },
  },
  oficial: {
    light: "ok",
    lightLabel: { es: "Parece oficial", en: "Looks official" },
    title: { es: "Parece el STUBX oficial", en: "Looks like the official STUBX" },
    support: {
      es: "La dirección coincide con la ficha del registro del 2026-10-08. «Parece» no es una garantía permanente.",
      en: "The address matches the registry card from 2026-10-08. “Looks like” is not a permanent guarantee.",
    },
  },
  copia: {
    light: "riesgo",
    lightLabel: { es: "Posible copia", en: "Possible copy" },
    title: { es: "Cuidado: posible copia", en: "Careful: possible copy" },
    support: {
      es: "El nombre se parece, pero la dirección no es la del registro. Esto no dice quién lo hizo.",
      en: "The name looks similar, but the address is not the registry one. This does not say who did it.",
    },
  },
  otra: {
    light: "atencion",
    lightLabel: { es: "Otra dirección", en: "Another address" },
    title: { es: "No es el STUBX oficial", en: "This is not the official STUBX" },
    support: {
      es: "Hay ficha de esta dirección y no es la del registro. Tampoco es una señal de copia.",
      en: "There is a card for this address and it is not the registry one. It is not a copy signal either.",
    },
  },
  sin_ficha: {
    light: "neutro",
    lightLabel: { es: "Sin ficha", en: "No card" },
    title: { es: "No se pudo comprobar", en: "Could not be checked" },
    support: {
      es: "No está entre las fichas del 2026-10-08. Esta página no consulta la red, así que no rellena el hueco.",
      en: "It is not among the 2026-10-08 cards. This page does not query the network, so it does not fill the gap.",
    },
  },
  lectura_caida: {
    light: "neutro",
    lightLabel: { es: "Lectura no disponible", en: "Reading unavailable" },
    title: { es: "No se pudo comprobar", en: "Could not be checked" },
    support: {
      es: "La lectura no está disponible. Pasa lo mismo si la red de lectura no responde: no hay resultado y no se inventa uno.",
      en: "The reading is unavailable. The same happens if the read network does not respond: there is no result, and none is invented.",
    },
  },
  comprobando: {
    light: "espera",
    lightLabel: { es: "Comprobando", en: "Checking" },
    title: { es: "Comprobando esta dirección…", en: "Checking this address…" },
    support: {
      es: "Solo se mira la ficha local. La dirección no se envía a ningún sitio.",
      en: "Only the local card is read. The address is not sent anywhere.",
    },
  },
};

function pair(es, en) {
  return { es, en };
}

function shown(status, value) {
  if (status === "no_disponible") return "no_disponible";
  if (status === "no_aplica") return "no_aplica";
  if (status !== "verificado" && status !== "inferido") return "desconocido";
  if (value === null || value === "") return "desconocido";
  return value;
}

function statusWord(status, lang) {
  if (status === "no_disponible") return lang === "en" ? "Unavailable" : "No disponible";
  if (status === "no_aplica") return lang === "en" ? "Not applicable" : "No aplica";
  if (status === "verificado") return lang === "en" ? "verified" : "verificado";
  if (status === "inferido") return lang === "en" ? "inferred" : "inferido";
  return lang === "en" ? "Unknown" : "No se sabe";
}

function authorityLine(fact) {
  const visible = shown(fact.status, fact.state);
  if (visible === "no_disponible" || visible === "desconocido" || visible === "no_aplica") {
    return pair(statusWord(visible, "es"), statusWord(visible, "en"));
  }
  const es = fact.state === "revocada" ? "Cerrado" : fact.state === "activa" ? "Abierto" : "No se pudo leer";
  const en = fact.state === "revocada" ? "Closed" : fact.state === "activa" ? "Open" : "Could not be read";
  return pair(`${es} · ${statusWord(fact.status, "es")}`, `${en} · ${statusWord(fact.status, "en")}`);
}

export function normalizeAddress(raw) {
  return raw.replace(/[\s\u00a0]+/g, "");
}

export function isAddress(value) {
  return BASE58.test(value);
}

function viewOf(kind, mint, rows, partialNote) {
  const copy = COPY[kind];
  return {
    kind,
    light: copy.light,
    lightLabel: copy.lightLabel,
    title: copy.title,
    support: copy.support,
    mint,
    rows,
    partialNote,
  };
}

export function pendingView(raw) {
  const mint = normalizeAddress(raw);
  return viewOf("comprobando", mint.length > 0 ? mint : null, [], null);
}

export function emptyView() {
  return viewOf("vacio", null, [], null);
}

function rowsFor(card) {
  const registry = shown(card.inRegistryStatus, card.inRegistry === null ? null : card.inRegistry ? "sí" : "no");
  const registryEn = shown(card.inRegistryStatus, card.inRegistry === null ? null : card.inRegistry ? "yes" : "no");
  const name = shown(card.nameStatus, card.name);
  const copySignal =
    card.impersonation === null
      ? pair("No se sabe", "Unknown")
      : card.impersonation
        ? pair("Sí", "Yes")
        : pair("No", "No");
  const progress = shown(card.curveProgressStatus, card.curveProgress);
  const progressValue =
    progress === "no_disponible" || progress === "no_aplica" || progress === "desconocido"
      ? pair(statusWord(progress, "es"), statusWord(progress, "en"))
      : pair(
          `${progress} % · ${statusWord(card.curveProgressStatus, "es")}`,
          `${progress}% · ${statusWord(card.curveProgressStatus, "en")}`,
        );
  const metadata =
    card.metadataReading === "mutables"
      ? pair("Sí, en la ficha", "Yes, on the card")
      : card.metadataReading === "no_mutables_en_fuentes"
        ? pair("No, en las fuentes leídas", "No, in the sources read")
        : pair("No se sabe", "Unknown");
  return [
    {
      label: pair("Nombre", "Name"),
      value: name === card.name && card.name ? pair(card.name, card.name) : pair(statusWord(name, "es"), statusWord(name, "en")),
    },
    {
      label: pair("En el registro de esta ficha", "In this card’s registry"),
      value:
        registry === "sí" || registry === "no"
          ? pair(registry === "sí" ? "Sí" : "No", registryEn === "yes" ? "Yes" : "No")
          : pair(statusWord(registry, "es"), statusWord(registry, "en")),
    },
    { label: pair("Permiso de crear más tokens", "Permission to create more tokens"), value: authorityLine(card.mintAuthority) },
    { label: pair("Permiso de congelar", "Permission to freeze"), value: authorityLine(card.freezeAuthority) },
    { label: pair("El nombre puede cambiar", "The name can change"), value: metadata },
    { label: pair("Señal de copia", "Copy signal"), value: copySignal },
    { label: pair("Avance de la curva", "Curve progress"), value: progressValue },
    { label: pair("Fecha de la ficha", "Card date"), value: pair(card.createdAt ?? "2026-10-08", card.createdAt ?? "2026-10-08") },
  ];
}

const PARTIAL = pair(
  "La ficha está incompleta: la muestra de holders no está. Eso no se rellena con un cero.",
  "The card is incomplete: the holder sample is missing. That is not filled in with a zero.",
);

export function classifyAddress(raw, cards, source) {
  if (raw.trim() === "") return emptyView();
  const mint = normalizeAddress(raw);
  if (!isAddress(mint)) return viewOf("invalida", null, [], null);
  if (source === "caida") return viewOf("lectura_caida", mint, [], null);
  const card = cards.find((item) => item.mint === mint);
  if (!card) return viewOf("sin_ficha", mint, [], null);
  const kind = card.role === "registro" ? "oficial" : card.role === "clon" ? "copia" : "otra";
  return viewOf(kind, card.mint, rowsFor(card), card.partial ? PARTIAL : null);
}
