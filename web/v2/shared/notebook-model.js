/**
 * Esquema, comparación e importación del cuaderno.
 * El texto importado no se ejecuta. Una ficha guardada no es una lectura actual.
 */
import { CARD_SCHEMA, CARD_VERSION, DISCLAIMER, OFFICIAL_MINT, isMintAddress } from "./solana-read.js";

export const EXPORT_SCHEMA = "stubx.notebook.export";
export const MAX_BYTES = 1_000_000;
export const MAX_CARDS = 40;
export const MAX_STORED = 200;
export const MAX_NOTE = 2_000;

const CURVE_KEYS = ["present", "status", "virtualToken", "virtualQuote", "realToken", "realQuote", "complete"];

const CARD_KEYS_V1 = [
  "schema",
  "schemaVersion",
  "rulesVersion",
  "network",
  "mint",
  "consultedAt",
  "slot",
  "slotStatus",
  "partial",
  "errors",
  "isMint",
  "program",
  "programStatus",
  "decimals",
  "supplyAccount",
  "supplyRpc",
  "supplyRpcStatus",
  "mintAuthority",
  "freezeAuthority",
  "name",
  "symbol",
  "uri",
  "metadataMutable",
  "extensions",
  "extensionsStatus",
  "curve",
  "officialStubx",
  "disclaimer",
];

const CARD_KEYS_V2 = [
  ...CARD_KEYS_V1.slice(0, CARD_KEYS_V1.indexOf("officialStubx")),
  "largestStatus",
  "officialStubx",
  "disclaimer",
];

const RECORD_KEYS = ["id", "note", "card"];
const STATUSES = new Set([
  "verificado",
  "inferido",
  "ok",
  "ausente",
  "fallo",
  "no_consultado",
  "no_disponible",
  "no_aplica",
  "no_soportada",
]);
const PROGRAMS = new Set(["spl-token", "token-2022", "no_es_mint", "no_disponible"]);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DANGER = /<\s*script|<\/\s*script|javascript\s*:|onerror\s*=|onload\s*=/i;
const BANNED_KEYS = new Set(["price", "bought", "amountbought", "wallet", "seed", "secret", "uiamount", "current"]);

function fail(es, en) {
  return { ok: false, error: { es, en } };
}

function sameKeys(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== allowed.length) return false;
  return allowed.every((key) => Object.hasOwn(value, key));
}

function bannedKey(value, depth) {
  if (depth > 8 || value === null || typeof value !== "object") return false;
  for (const key of Object.keys(value)) {
    if (BANNED_KEYS.has(key.toLowerCase())) return true;
    if (bannedKey(value[key], depth + 1)) return true;
  }
  return false;
}

function dangerousString(value, depth) {
  if (depth > 8) return true;
  if (typeof value === "string") return DANGER.test(value);
  if (Array.isArray(value)) return value.some((item) => dangerousString(item, depth + 1));
  if (value && typeof value === "object") return Object.values(value).some((item) => dangerousString(item, depth + 1));
  return false;
}

function textField(value) {
  if (!value || typeof value !== "object") return false;
  if (!sameKeys(value, ["text", "status"])) return false;
  if (value.text !== null && (typeof value.text !== "string" || value.text.length > 300)) return false;
  return STATUSES.has(value.status);
}

function authority(value) {
  if (!value || typeof value !== "object") return false;
  if (!sameKeys(value, ["state", "address", "status"])) return false;
  if (!["revocada", "activa", "no_decodificable", "no_disponible", "no_aplica"].includes(value.state)) return false;
  if (value.address !== null && (typeof value.address !== "string" || value.address.length > 44)) return false;
  return STATUSES.has(value.status);
}

function amount(value) {
  return value === null || (typeof value === "string" && /^\d+$/.test(value) && value.length <= 40);
}

export function validateCard(card) {
  const version = card && card.schemaVersion;
  const keys = version === 1 ? CARD_KEYS_V1 : version === 2 ? CARD_KEYS_V2 : null;
  if (!keys || !sameKeys(card, keys)) return fail("La ficha no tiene la forma esperada.", "The card does not have the expected shape.");
  if (card.schema !== CARD_SCHEMA || (version !== 1 && version !== CARD_VERSION)) {
    return fail("La versión de la ficha no es la de este cuaderno.", "The card version is not the one this notebook uses.");
  }
  if (card.rulesVersion !== "0.1.0" || card.network !== "solana") {
    return fail("La ficha no dice la red o la versión de reglas.", "The card does not name the network or the rules version.");
  }
  if (!isMintAddress(card.mint)) {
    return fail("La dirección de la ficha no es una dirección de Solana.", "The address on the card is not a Solana address.");
  }
  if (typeof card.consultedAt !== "string" || !ISO.test(card.consultedAt)) {
    return fail("La ficha no trae una hora UTC.", "The card does not include a UTC time.");
  }
  if (card.slot !== null && (!Number.isSafeInteger(card.slot) || card.slot < 0)) {
    return fail("El slot no es un entero razonable.", "The slot is not a reasonable integer.");
  }
  if (!STATUSES.has(card.slotStatus) || typeof card.partial !== "boolean" || typeof card.isMint !== "boolean") {
    return fail("Falta un estado de la ficha.", "A card status is missing.");
  }
  if (!PROGRAMS.has(card.program) || !STATUSES.has(card.programStatus)) {
    return fail("El programa del token no está en la lista.", "The token program is not on the list.");
  }
  if (card.decimals !== null && (!Number.isInteger(card.decimals) || card.decimals < 0 || card.decimals > 18)) {
    return fail("Los decimales no son válidos.", "The decimals are not valid.");
  }
  if (!amount(card.supplyAccount) || !amount(card.supplyRpc) || !STATUSES.has(card.supplyRpcStatus)) {
    return fail("El suministro no es un entero en unidades mínimas.", "Supply is not an integer in base units.");
  }
  if (!authority(card.mintAuthority) || !authority(card.freezeAuthority)) {
    return fail("Un permiso no tiene la forma esperada.", "A permission does not have the expected shape.");
  }
  if (!textField(card.name) || !textField(card.symbol) || !textField(card.uri)) {
    return fail("Un texto de metadatos no tiene la forma esperada.", "A metadata text does not have the expected shape.");
  }
  if (!["si", "no", "no_disponible", "no_aplica", "ausente", "fallo"].includes(card.metadataMutable)) {
    return fail("La mutabilidad no está en la lista.", "Mutability is not on the list.");
  }
  if (version === 2 && !STATUSES.has(card.largestStatus)) {
    return fail("El estado de las cuentas grandes no está en la lista.", "The large-account status is not on the list.");
  }
  if (!Array.isArray(card.extensions) || card.extensions.length > 40 || !STATUSES.has(card.extensionsStatus)) {
    return fail("Las extensiones no tienen la forma esperada.", "Extensions do not have the expected shape.");
  }
  for (const item of card.extensions) {
    if (!item || typeof item.name !== "string" || item.name.length > 80 || !Number.isInteger(item.type)) {
      return fail("Hay una extensión ilegible.", "An extension is unreadable.");
    }
    if (item.status !== "verificado" && item.status !== "no_soportada") {
      return fail("El estado de una extensión no está en la lista.", "An extension status is not on the list.");
    }
  }
  const curve = card.curve;
  if (!sameKeys(curve, CURVE_KEYS)) return fail("La curva tiene campos de más o de menos.", "The curve has extra or missing fields.");
  if (curve.present !== null && typeof curve.present !== "boolean") return fail("La curva no es un sí o un no.", "The curve is not a yes or a no.");
  if (!STATUSES.has(curve.status)) return fail("El estado de la curva no está en la lista.", "The curve status is not on the list.");
  for (const key of ["virtualToken", "virtualQuote", "realToken", "realQuote"]) {
    if (!amount(curve[key])) return fail("Una cantidad de la curva no es un entero.", "A curve amount is not an integer.");
  }
  if (curve.complete !== null && typeof curve.complete !== "boolean") {
    return fail("El campo complete no es un sí o un no.", "The complete field is not a yes or a no.");
  }
  if (typeof card.officialStubx !== "boolean" || card.officialStubx !== (card.mint === OFFICIAL_MINT)) {
    return fail("La marca de STUBX no coincide con la dirección.", "The STUBX mark does not match the address.");
  }
  if (!card.disclaimer || card.disclaimer.es !== DISCLAIMER.es || card.disclaimer.en !== DISCLAIMER.en) {
    return fail("Falta el aviso fijo de la ficha.", "The fixed card notice is missing.");
  }
  if (!Array.isArray(card.errors) || card.errors.length > 12) {
    return fail("La lista de errores no es válida.", "The error list is not valid.");
  }
  for (const item of card.errors) {
    if (!item || typeof item.method !== "string" || typeof item.message !== "string") {
      return fail("Hay un error ilegible.", "An error entry is unreadable.");
    }
    if (item.message.length > 300 || item.method.length > 40) return fail("Un error es demasiado largo.", "An error entry is too long.");
  }
  if (dangerousString(card, 0) || bannedKey(card, 0)) {
    return fail("La ficha trae texto que este cuaderno no guarda.", "The card contains text this notebook does not store.");
  }
  return { ok: true, card };
}

export function validateRecord(record) {
  if (!sameKeys(record, RECORD_KEYS)) {
    return fail("Cada consulta tiene que traer id, nota y ficha, y nada más.", "Each query must contain an id, a note, and a card, and nothing else.");
  }
  if (typeof record.id !== "string" || !ID.test(record.id)) {
    return fail("El identificador de la consulta no es válido.", "The query id is not valid.");
  }
  if (typeof record.note !== "string") {
    return fail("La nota tiene que ser un texto de hasta 2000 caracteres.", "The note must be text of at most 2000 characters.");
  }
  const note = visibleText(record.note);
  if (note.length > MAX_NOTE) {
    return fail("La nota tiene que ser un texto de hasta 2000 caracteres.", "The note must be text of at most 2000 characters.");
  }
  if (DANGER.test(note)) {
    return fail("La nota parece un script. No se importa.", "The note looks like a script. It was not imported.");
  }
  const card = validateCard(record.card);
  if (!card.ok) return card;
  return { ok: true, record: { id: record.id, note, card: card.card } };
}

export function validateExport(text) {
  if (typeof text !== "string") return fail("El archivo no es texto.", "The file is not text.");
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_BYTES) {
    return fail("El archivo pasa de 1 MB. No se importa.", "The file is over 1 MB. It was not imported.");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("El archivo no es JSON. No se importa.", "The file is not JSON. It was not imported.");
  }
  if (dangerousString(parsed, 0) || bannedKey(parsed, 0)) {
    return fail("El archivo trae texto que este cuaderno no guarda.", "The file contains text this notebook does not store.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return fail("La copia no tiene la forma esperada.", "The copy does not have the expected shape.");
  }
  const keys = Object.keys(parsed);
  if (keys.length !== 4 || !keys.includes("schema") || !keys.includes("schemaVersion") || !keys.includes("exportedAt") || !keys.includes("cards")) {
    return fail("La copia tiene campos de más o de menos.", "The copy has extra or missing fields.");
  }
  if (parsed.schema !== EXPORT_SCHEMA || parsed.schemaVersion !== 1) {
    return fail("Esta copia no es de este cuaderno.", "This copy is not from this notebook.");
  }
  if (typeof parsed.exportedAt !== "string" || !ISO.test(parsed.exportedAt)) {
    return fail("La copia no trae una hora UTC.", "The copy does not include a UTC time.");
  }
  if (!Array.isArray(parsed.cards) || parsed.cards.length > MAX_CARDS) {
    return fail(`Se pueden importar hasta ${MAX_CARDS} consultas.`, `You can import up to ${MAX_CARDS} queries.`);
  }
  const records = [];
  const seen = new Set();
  for (const item of parsed.cards) {
    const checked = validateRecord(item);
    if (!checked.ok) return checked;
    if (seen.has(checked.record.id)) return fail("Hay dos consultas con el mismo id.", "Two queries share the same id.");
    seen.add(checked.record.id);
    records.push(checked.record);
  }
  return { ok: true, records };
}

export function visibleText(value) {
  return String(value).replace(/\p{Cf}/gu, "");
}

export function withinStoreLimit(existingCount, incomingNewCount) {
  if (!Number.isInteger(existingCount) || existingCount < 0) return false;
  if (!Number.isInteger(incomingNewCount) || incomingNewCount < 0) return false;
  return existingCount + incomingNewCount <= MAX_STORED;
}

export function toExport(records, exportedAt) {
  return JSON.stringify(
    {
      schema: EXPORT_SCHEMA,
      schemaVersion: 1,
      exportedAt,
      cards: records.map((record) => ({ id: record.id, note: record.note, card: record.card })),
    },
    null,
    2,
  );
}

const COMPARE_FIELDS = [
  ["program", "Programa", "Program"],
  ["mintAuthority.state", "Permiso de emisión", "Mint authority"],
  ["freezeAuthority.state", "Permiso de congelación", "Freeze authority"],
  ["supplyAccount", "Suministro en la cuenta", "Supply on the account"],
  ["supplyRpc", "Suministro de getTokenSupply", "Supply from getTokenSupply"],
  ["decimals", "Decimales", "Decimals"],
  ["name.text", "Nombre", "Name"],
  ["symbol.text", "Símbolo", "Symbol"],
  ["metadataMutable", "Metadatos mutables", "Mutable metadata"],
  ["curve.present", "Curva presente", "Curve present"],
  ["curve.realToken", "Cantidad real de tokens de la curva", "Real curve token amount"],
  ["curve.virtualToken", "Cantidad virtual de tokens de la curva", "Virtual curve token amount"],
  ["curve.complete", "Curva completa", "Curve complete"],
  ["slot", "Slot", "Slot"],
];

function readPath(card, path) {
  let current = card;
  for (const part of path.split(".")) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }
  if (current === undefined) return null;
  return current;
}

export function compareRecords(left, right) {
  if (!left || !right || left.card.mint !== right.card.mint) {
    return fail("Solo se comparan dos consultas de la misma dirección.", "Only two queries of the same address can be compared.");
  }
  const rows = COMPARE_FIELDS.map(([path, es, en]) => {
    const a = readPath(left.card, path);
    const b = readPath(right.card, path);
    return {
      field: { es, en },
      left: a === null || a === undefined ? null : String(a),
      right: b === null || b === undefined ? null : String(b),
      same: Object.is(a, b),
      leftAt: left.card.consultedAt,
      rightAt: right.card.consultedAt,
    };
  });
  return {
    ok: true,
    mint: left.card.mint,
    formatChanged: left.card.schemaVersion !== right.card.schemaVersion,
    rows,
    notes: { left: left.note, right: right.note },
  };
}

export function staleLine(consultedAt, lang) {
  const local = formatLocal(consultedAt, lang);
  if (lang === "en") return `Checked on ${consultedAt} UTC · local ${local} · this may have changed`;
  return `Consultado el ${consultedAt} UTC · hora local ${local} · puede haber cambiado`;
}

export function formatLocal(consultedAt, lang) {
  const date = new Date(consultedAt);
  if (Number.isNaN(date.getTime())) return lang === "en" ? "unknown local time" : "hora local desconocida";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function withNote(record, note) {
  if (typeof note !== "string") {
    return fail("La nota tiene que ser texto, de hasta 2000 caracteres, y no puede ser un script.", "The note must be text, at most 2000 characters, and it cannot be a script.");
  }
  const cleaned = visibleText(note);
  if (cleaned.length > MAX_NOTE || DANGER.test(cleaned)) {
    return fail("La nota tiene que ser texto, de hasta 2000 caracteres, y no puede ser un script.", "The note must be text, at most 2000 characters, and it cannot be a script.");
  }
  return { ok: true, record: { id: record.id, note: cleaned, card: record.card } };
}
