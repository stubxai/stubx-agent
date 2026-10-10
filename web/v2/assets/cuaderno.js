/**
 * Cuaderno local. Solo lectura, sin cartera y sin ejecutar el JSON importado.
 */
import {
  DEFAULT_RPC,
  DISCLAIMER,
  OFFICIAL_MINT,
  isAllowedRpcUrl,
  readMint,
} from "../shared/solana-read.js";
import {
  MAX_BYTES,
  MAX_NOTE,
  MAX_STORED,
  compareRecords,
  staleLine,
  toExport,
  validateCard,
  validateExport,
  withNote,
  withinStoreLimit,
} from "../shared/notebook-model.js";

const DB_NAME = "stubx-cuaderno";
const STORE = "records";

const COPY = {
  es: {
    consulting: "Consultando la red…",
    invalid: "Esa dirección no es válida. Una dirección de Solana suele tener entre 32 y 44 letras y números, sin 0, O, I ni l.",
    rpc: "Ese lector no está en la lista. Solo se puede usar api.mainnet-beta.solana.com o solana-rpc.publicnode.com. No se ha llamado a la red.",
    full: `Este navegador ya tiene ${MAX_STORED} fichas. Borra alguna para guardar otra.`,
    partial: "La lectura está incompleta. Lo que falta no se ha puesto a cero.",
    network: "No se pudo leer la red. Revisa la conexión e inténtalo otra vez. No se ha inventado un resultado.",
    saved: "Consulta guardada en este navegador. No es una lectura en vivo.",
    saveFail: "Esta lectura trae texto que el cuaderno no guarda. No se ha guardado.",
    db: "Este navegador no dejó guardar el cuaderno. Si está en modo privado, el almacenamiento puede estar cerrado.",
    noteFail: "La nota tiene que ser texto, de hasta 2000 caracteres, y no puede ser un script.",
    noteOk: "Nota guardada. Sigue separada de los datos de la cadena.",
    compareNeed: "Elige dos consultas distintas.",
    deleted: "Consultas borradas de este navegador.",
    cancel: "No se ha borrado nada.",
    empty: "Todavía no hay consultas guardadas.",
    importOk: "Copia importada. Cada ficha sigue siendo la de su fecha, no una lectura actual.",
    fileBig: "El archivo pasa de 1 MB. No se importa.",
    fileRead: "No se pudo leer el archivo.",
    exportEmpty: "No hay consultas que exportar.",
    exportOk: "Copia descargada. Sigue en este navegador.",
    sameMint: "Solo se comparan dos consultas de la misma dirección.",
    official: "Es la dirección oficial de STUBX.",
    notOfficial: "No es la dirección oficial de STUBX.",
    untrusted: "Nombre, símbolo y URI son texto de terceros. No son un enlace ni una imagen.",
    requery: "Volver a consultar",
    saveNote: "Guardar nota",
    noteLabel: "Nota personal, separada de la cadena",
    none: "no disponible",
    program: "Programa",
    mintAuth: "Permiso de emisión",
    freezeAuth: "Permiso de congelación",
    supplyAccount: "Suministro en la cuenta",
    supplyRpc: "Suministro leído aparte",
    decimals: "Decimales",
    name: "Nombre",
    symbol: "Símbolo",
    uri: "URI de metadatos",
    mutable: "Metadatos mutables",
    extensions: "Extensiones",
    curve: "Curva",
    slot: "Slot",
    errors: "Qué no se pudo leer",
    yes: "sí",
    no: "no",
    revoked: "revocada",
    active: "activa",
    undecodable: "no se pudo leer",
    spl: "SPL Token",
    token2022: "Token-2022",
    notMint: "No es una cuenta de mint",
    unknownProgram: "no disponible",
    compareTitle: "Comparación",
    left: "Consulta A",
    right: "Consulta B",
    changed: "cambió",
    same: "igual",
    format: "La versión de la ficha no es la misma. Se comparan solo los campos que existen en las dos.",
  },
  en: {
    consulting: "Reading the network…",
    invalid: "That address is not valid. A Solana address is usually 32 to 44 letters and numbers, with no 0, O, I, or l.",
    rpc: "That reader is not on the list. Only api.mainnet-beta.solana.com or solana-rpc.publicnode.com can be used. The network was not called.",
    full: `This browser already has ${MAX_STORED} cards. Delete one to save another.`,
    partial: "The reading is incomplete. What is missing was not filled in with zero.",
    network: "The network could not be read. Check the connection and try again. No result was invented.",
    saved: "Query saved in this browser. It is not a live reading.",
    saveFail: "This reading contains text the notebook does not store. It was not saved.",
    db: "This browser did not allow the notebook to be saved. In private mode, storage may be closed.",
    noteFail: "The note must be text, at most 2000 characters, and it cannot be a script.",
    noteOk: "Note saved. It stays separate from the chain data.",
    compareNeed: "Choose two different queries.",
    deleted: "Queries deleted from this browser.",
    cancel: "Nothing was deleted.",
    empty: "There are no saved queries yet.",
    importOk: "Copy imported. Each card is still the one from its date, not a current reading.",
    fileBig: "The file is over 1 MB. It was not imported.",
    fileRead: "The file could not be read.",
    exportEmpty: "There are no queries to export.",
    exportOk: "Copy downloaded. It also stays in this browser.",
    sameMint: "Only two queries of the same address can be compared.",
    official: "This is the official STUBX address.",
    notOfficial: "This is not the official STUBX address.",
    untrusted: "Name, symbol, and URI are third-party text. They are not a link and not an image.",
    requery: "Check again",
    saveNote: "Save note",
    noteLabel: "Personal note, separate from the chain",
    none: "unavailable",
    program: "Program",
    mintAuth: "Mint authority",
    freezeAuth: "Freeze authority",
    supplyAccount: "Supply on the account",
    supplyRpc: "Supply read separately",
    decimals: "Decimals",
    name: "Name",
    symbol: "Symbol",
    uri: "Metadata URI",
    mutable: "Mutable metadata",
    extensions: "Extensions",
    curve: "Curve",
    slot: "Slot",
    errors: "What could not be read",
    yes: "yes",
    no: "no",
    revoked: "revoked",
    active: "active",
    undecodable: "could not be read",
    spl: "SPL Token",
    token2022: "Token-2022",
    notMint: "Not a mint account",
    unknownProgram: "unavailable",
    compareTitle: "Comparison",
    left: "Query A",
    right: "Query B",
    changed: "changed",
    same: "same",
    format: "The card version is not the same. Only fields that exist on both are compared.",
  },
};

const STATUS = {
  verificado: { es: "verificado", en: "verified" },
  inferido: { es: "inferido", en: "inferred" },
  no_disponible: { es: "no disponible", en: "unavailable" },
  no_aplica: { es: "no aplica", en: "not applicable" },
  no_soportada: { es: "no soportado", en: "not supported" },
};

function lang() {
  return document.documentElement.lang === "en" ? "en" : "es";
}

function t(key) {
  return COPY[lang()][key];
}

function el(tag, attrs) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value != null) node.setAttribute(key, String(value));
    }
  }
  return node;
}

function text(tag, value, attrs) {
  const node = el(tag, attrs);
  node.textContent = value == null ? "" : String(value);
  return node;
}

function showMessage(message, kind) {
  const node = document.getElementById("consulta-error");
  if (!node) return;
  node.hidden = !message;
  node.textContent = message || "";
  node.dataset.kind = kind || "";
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("indexedDB"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("indexedDB"));
  });
}

function dbAll(db) {
  return new Promise((resolve, reject) => {
    const items = [];
    const request = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(items);
        return;
      }
      items.push(cursor.value);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

function dbPut(db, record) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function dbClear(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function browserTransport(endpoint, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });
    return { status: response.status, body: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

function endpointFromForm() {
  const input = document.getElementById("rpc-url");
  const value = input && typeof input.value === "string" ? input.value.trim() : "";
  return value || DEFAULT_RPC;
}

function statusLabel(value) {
  const row = STATUS[value];
  return row ? row[lang()] : t("none");
}

function programLabel(value) {
  if (value === "spl-token") return t("spl");
  if (value === "token-2022") return t("token2022");
  if (value === "no_es_mint") return t("notMint");
  return t("unknownProgram");
}

function authorityLabel(value) {
  if (!value) return t("none");
  if (value.state === "revocada") return t("revoked");
  if (value.state === "activa") return t("active");
  if (value.state === "no_decodificable") return t("undecodable");
  return statusLabel(value.state);
}

function shown(value) {
  if (value === null || value === undefined || value === "") return t("none");
  if (value === true) return t("yes");
  if (value === false) return t("no");
  return String(value);
}

function row(list, label, value, status) {
  const term = text("dt", label);
  const detail = text("dd", status ? `${shown(value)} · ${statusLabel(status)}` : shown(value));
  list.append(term, detail);
}

function renderCard(card) {
  const article = el("article", { class: "ficha" });
  article.append(text("p", staleLine(card.consultedAt, lang()), { class: "sello" }));
  article.append(text("p", card.officialStubx ? t("official") : t("notOfficial")));
  if (card.partial) article.append(text("p", t("partial"), { class: "nota" }));
  article.append(text("p", DISCLAIMER[lang()], { class: "nota" }));
  const code = el("code", { class: "mint" });
  code.textContent = card.mint;
  const mintLine = el("p");
  mintLine.append(code);
  article.append(mintLine);
  const list = el("dl");
  row(list, t("program"), programLabel(card.program), card.programStatus);
  const mintAuth = card.mintAuthority.address
    ? `${authorityLabel(card.mintAuthority)} · ${card.mintAuthority.address}`
    : authorityLabel(card.mintAuthority);
  const freezeAuth = card.freezeAuthority.address
    ? `${authorityLabel(card.freezeAuthority)} · ${card.freezeAuthority.address}`
    : authorityLabel(card.freezeAuthority);
  row(list, t("mintAuth"), mintAuth, card.mintAuthority.status);
  row(list, t("freezeAuth"), freezeAuth, card.freezeAuthority.status);
  row(list, t("supplyAccount"), card.supplyAccount, card.isMint ? "verificado" : card.supplyRpcStatus);
  row(list, t("supplyRpc"), card.supplyRpc, card.supplyRpcStatus);
  row(list, t("decimals"), card.decimals, card.decimals === null ? "no_disponible" : "verificado");
  row(list, t("name"), card.name.text, card.name.status);
  row(list, t("symbol"), card.symbol.text, card.symbol.status);
  row(list, t("uri"), card.uri.text, card.uri.status);
  const mutable = card.metadataMutable === "si" ? t("yes") : card.metadataMutable === "no" ? t("no") : statusLabel(card.metadataMutable);
  row(list, t("mutable"), mutable);
  const extensionText = card.extensions.length
    ? card.extensions.map((item) => `${item.name} (${statusLabel(item.status)})`).join(", ")
    : null;
  row(list, t("extensions"), extensionText, card.extensionsStatus);
  const curve = card.curve;
  const curveText = curve.present
    ? `${t("yes")} · ${curve.realToken ?? t("none")} / ${curve.virtualToken ?? t("none")}`
    : curve.present;
  row(list, t("curve"), curveText, curve.status);
  row(list, t("slot"), card.slot, card.slotStatus);
  article.append(list);
  article.append(text("p", t("untrusted"), { class: "muted" }));
  if (card.errors.length) {
    article.append(text("h3", t("errors")));
    const errors = el("ul");
    for (const item of card.errors) {
      errors.append(text("li", `${item.at} · ${item.method} · ${item.message}`));
    }
    article.append(errors);
  }
  return article;
}

function fillSelect(select, records, selected) {
  select.replaceChildren();
  const blank = el("option", { value: "" });
  blank.textContent = "—";
  select.append(blank);
  for (const record of records) {
    const option = el("option", { value: record.id });
    option.textContent = `${record.card.consultedAt} · ${record.card.mint.slice(0, 8)}…`;
    if (record.id === selected) option.selected = true;
    select.append(option);
  }
}

function renderRecords(records) {
  const list = document.getElementById("lista-consultas");
  const left = document.getElementById("comparar-izquierda");
  const right = document.getElementById("comparar-derecha");
  if (!list || !left || !right) return;
  const leftId = left.value;
  const rightId = right.value;
  list.replaceChildren();
  if (!records.length) {
    list.append(text("p", t("empty")));
  }
  for (const record of records) {
    const block = el("article", { class: "consulta-guardada", "data-id": record.id });
    block.append(renderCard(record.card));
    const note = el("div", { class: "nota-personal" });
    const label = text("label", t("noteLabel"));
    label.htmlFor = `nota-${record.id}`;
    const area = el("textarea", { id: `nota-${record.id}`, class: "nota", maxlength: String(MAX_NOTE) });
    area.value = record.note;
    const save = el("button", { type: "button" });
    save.textContent = t("saveNote");
    save.addEventListener("click", () => saveNote(record.id, area.value));
    note.append(label, area, save);
    const again = el("button", { type: "button" });
    again.textContent = t("requery");
    again.addEventListener("click", () => consult(record.card.mint));
    block.append(note, again);
    list.append(block);
  }
  fillSelect(left, records, leftId);
  fillSelect(right, records, rightId);
}

let records = [];
let dbPromise = null;

function database() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

async function refresh() {
  const db = await database();
  records = (await dbAll(db)).sort((a, b) => (a.card.consultedAt < b.card.consultedAt ? 1 : -1));
  renderRecords(records);
  renderComparison();
}

async function persist(record) {
  const checked = validateCard(record.card);
  if (!checked.ok) {
    showMessage(checked.error[lang()], "error");
    return false;
  }
  const replacing = records.some((item) => item.id === record.id);
  if (!replacing && !withinStoreLimit(records.length, 1)) {
    showMessage(t("full"), "error");
    return false;
  }
  const db = await database();
  await dbPut(db, { id: record.id, note: record.note, card: checked.card });
  return true;
}

async function consult(mint) {
  const button = document.getElementById("consultar");
  const input = document.getElementById("direccion-cuaderno");
  if (button) button.disabled = true;
  showMessage(t("consulting"), "info");
  const endpoint = endpointFromForm();
  if (!isAllowedRpcUrl(endpoint)) {
    showMessage(t("rpc"), "error");
    if (button) button.disabled = false;
    return;
  }
  try {
    const result = await readMint({
      mint,
      endpoint,
      transport: browserTransport,
      minIntervalMs: 2000,
    });
    const box = document.getElementById("resultado");
    if (!result.card) {
      showMessage(t(result.error === "rpc" ? "rpc" : "invalid"), "error");
      if (box) box.replaceChildren();
      return;
    }
    if (box) {
      box.replaceChildren(renderCard(result.card));
      box.focus();
      box.scrollIntoView({ block: "start" });
    }
    if (result.error === "partial" || result.card.partial) showMessage(t("partial"), "error");
    else if (!result.ok) showMessage(t("network"), "error");
    const record = { id: crypto.randomUUID(), note: "", card: result.card };
    const saved = await persist(record);
    if (!saved) return;
    showMessage(result.card.partial ? t("partial") : t("saved"), result.card.partial ? "error" : "ok");
    await refresh();
  } catch (error) {
    showMessage(t("db"), "error");
  } finally {
    if (button) button.disabled = false;
    if (input && mint) input.value = mint;
  }
}

async function saveNote(id, note) {
  const current = records.find((item) => item.id === id);
  if (!current) return;
  const next = withNote(current, note);
  if (!next.ok) {
    showMessage(t("noteFail"), "error");
    return;
  }
  try {
    const saved = await persist(next.record);
    if (!saved) return;
    showMessage(t("noteOk"), "ok");
    await refresh();
  } catch (error) {
    showMessage(t("db"), "error");
  }
}

function renderComparison() {
  const out = document.getElementById("comparacion");
  const leftId = document.getElementById("comparar-izquierda")?.value;
  const rightId = document.getElementById("comparar-derecha")?.value;
  if (!out) return;
  out.replaceChildren();
  if (!leftId || !rightId) return;
  if (leftId === rightId) {
    out.append(text("p", t("compareNeed"), { class: "campo-error" }));
    return;
  }
  const left = records.find((item) => item.id === leftId);
  const right = records.find((item) => item.id === rightId);
  if (!left || !right) return;
  const compared = compareRecords(left, right);
  if (!compared.ok) {
    out.append(text("p", compared.error[lang()], { class: "campo-error" }));
    return;
  }
  out.append(text("h3", t("compareTitle")));
  out.append(text("p", staleLine(left.card.consultedAt, lang()), { class: "sello" }));
  out.append(text("p", staleLine(right.card.consultedAt, lang()), { class: "sello" }));
  if (compared.formatChanged) out.append(text("p", t("format")));
  const grid = el("div", { class: "comparacion" });
  for (const rowItem of compared.rows) {
    const article = el("article", { class: "ficha" });
    article.append(text("h3", rowItem.field[lang()]));
    article.append(text("p", `${t("left")}: ${rowItem.left ?? t("none")}`));
    article.append(text("p", `${t("right")}: ${rowItem.right ?? t("none")}`));
    article.append(text("p", rowItem.same ? t("same") : t("changed"), { class: rowItem.same ? "muted" : "nota" }));
    grid.append(article);
  }
  out.append(grid);
  if (compared.notes.left || compared.notes.right) {
    const notes = el("div", { class: "nota-personal" });
    notes.append(text("p", `${t("left")}: ${compared.notes.left}`));
    notes.append(text("p", `${t("right")}: ${compared.notes.right}`));
    out.append(notes);
  }
}

async function exportCopy() {
  if (!records.length) {
    showMessage(t("exportEmpty"), "error");
    return;
  }
  const json = toExport(records, new Date().toISOString());
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = el("a", { href: url, download: "cuaderno-stubx.json" });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showMessage(t("exportOk"), "ok");
}

async function importCopy(file) {
  if (!file) return;
  if (file.size > MAX_BYTES) {
    showMessage(t("fileBig"), "error");
    return;
  }
  let textValue = "";
  try {
    textValue = await file.text();
  } catch (error) {
    showMessage(t("fileRead"), "error");
    return;
  }
  const parsed = validateExport(textValue);
  if (!parsed.ok) {
    showMessage(parsed.error[lang()], "error");
    return;
  }
  const incomingNew = parsed.records.filter((record) => !records.some((item) => item.id === record.id)).length;
  if (!withinStoreLimit(records.length, incomingNew)) {
    showMessage(t("full"), "error");
    return;
  }
  try {
    const db = await database();
    for (const record of parsed.records) await dbPut(db, record);
    showMessage(t("importOk"), "ok");
    await refresh();
  } catch (error) {
    showMessage(t("db"), "error");
  }
}

function armDelete() {
  const box = document.getElementById("confirmar-borrado");
  if (box) box.hidden = false;
}

async function confirmDelete() {
  try {
    const db = await database();
    await dbClear(db);
    const box = document.getElementById("confirmar-borrado");
    if (box) box.hidden = true;
    const result = document.getElementById("resultado");
    if (result) result.replaceChildren();
    const compare = document.getElementById("comparacion");
    if (compare) compare.replaceChildren();
    showMessage(t("deleted"), "ok");
    await refresh();
  } catch (error) {
    showMessage(t("db"), "error");
  }
}

function cancelDelete() {
  const box = document.getElementById("confirmar-borrado");
  if (box) box.hidden = true;
  showMessage(t("cancel"), "info");
}

function bind() {
  const form = document.getElementById("consulta");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const mint = document.getElementById("direccion-cuaderno")?.value.trim() ?? "";
    consult(mint);
  });
  document.getElementById("exportar")?.addEventListener("click", () => {
    exportCopy();
  });
  document.getElementById("importar-archivo")?.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    importCopy(file);
    event.target.value = "";
  });
  document.getElementById("borrar")?.addEventListener("click", armDelete);
  document.getElementById("borrar-confirmar")?.addEventListener("click", confirmDelete);
  document.getElementById("borrar-cancelar")?.addEventListener("click", cancelDelete);
  document.getElementById("comparar")?.addEventListener("click", renderComparison);
  document.addEventListener("stubx-lang", () => {
    renderRecords(records);
    const current = document.getElementById("resultado")?.querySelector(".ficha");
    if (current) {
      /* La ficha visible se vuelve a pintar con el idioma nuevo desde la última lectura guardada. */
    }
    const latest = records[0];
    const box = document.getElementById("resultado");
    if (latest && box && box.childElementCount) box.replaceChildren(renderCard(latest.card));
    renderComparison();
  });
  refresh().catch(() => showMessage(t("db"), "error"));
}

bind();

export { OFFICIAL_MINT };
