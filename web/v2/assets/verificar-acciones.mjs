/**
 * Acciones de Verify hacia el cuaderno local.
 * La dirección no va en la consulta ni al servidor. Se guarda red y dirección en IndexedDB.
 */
import { formatAmount } from "../shared/amount.js";
import { compareRecords, pickPrevious, staleLine, validateCard, withinStoreLimit } from "../shared/notebook-model.js";
import { PUBLICNODE_RPC, isAllowedRpcUrl, readMint } from "../shared/solana-read.js";

const DB_NAME = "stubx-cuaderno";
const STORE = "records";

const COPY = {
  es: {
    saving: "Guardando esta dirección en este navegador…",
    saved: "Consulta guardada en este navegador. La hora es la de este guardado.",
    none: "No hay una consulta anterior de esta dirección en esta red.",
    compare: "Comparar consultas",
    unknown: "no se puede determinar si cambió",
    changed: "cambió",
    same: "igual",
    changes: "Qué cambió",
    unknownTitle: "Lo que no se puede determinar",
    noChange: "No hay un cambio en los datos leídos en las dos consultas.",
    db: "Este navegador no dejó guardar el cuaderno.",
    fail: "No se pudo leer la red para guardar. No se ha inventado un resultado.",
    full: "Este navegador ya tiene el máximo de fichas.",
    left: "Esta consulta",
    right: "La anterior",
    yes: "sí",
    no: "no",
    missing: "no disponible",
  },
  en: {
    saving: "Saving this address in this browser…",
    saved: "Query saved in this browser. The time is the time of this save. It is not a recommendation.",
    none: "There is no earlier query of this address on this network.",
    compare: "Compare queries",
    unknown: "it cannot be determined whether it changed",
    changed: "changed",
    same: "same",
    changes: "What changed",
    unknownTitle: "What cannot be determined",
    noChange: "There is no change in the facts read on both queries.",
    db: "This browser did not allow the notebook to be saved.",
    fail: "The network could not be read in order to save. No result was invented.",
    full: "This browser already has the maximum number of cards.",
    left: "This query",
    right: "The previous one",
    yes: "yes",
    no: "no",
    missing: "unavailable",
  },
};

function lang() {
  return document.documentElement.lang === "en" ? "en" : "es";
}

function t(key) {
  return COPY[lang()][key];
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

let lastSaved = null;
let lastView = null;

function box() {
  return document.getElementById("comparacion-verify");
}

function say(message) {
  const node = box();
  if (!node) return;
  node.replaceChildren();
  const p = document.createElement("p");
  p.className = "nota";
  p.textContent = message;
  node.append(p);
}

function sideText(row, side, card) {
  const raw = side === "left" ? row.left : row.right;
  if (row.amount && raw !== null) {
    const formatted = formatAmount(raw, card.decimals, lang());
    if (formatted) return formatted;
  }
  if (raw === "true") return t("yes");
  if (raw === "false") return t("no");
  return raw ?? t("missing");
}

function gridFor(rows, verdict, current, previous) {
  const grid = document.createElement("div");
  grid.className = "comparacion";
  const word = verdict === "cambio" ? t("changed") : verdict === "igual" ? t("same") : t("unknown");
  for (const row of rows) {
    const article = document.createElement("article");
    article.className = "ficha";
    article.dataset.veredicto = verdict;
    const title = document.createElement("h3");
    title.textContent = row.field[lang()];
    const left = document.createElement("p");
    left.textContent = `${t("left")}: ${sideText(row, "left", current.card)}`;
    const right = document.createElement("p");
    right.textContent = `${t("right")}: ${sideText(row, "right", previous.card)}`;
    const mark = document.createElement("p");
    mark.className = verdict === "cambio" ? "nota" : "muted";
    mark.textContent = word;
    article.append(title, left, right, mark);
    grid.append(article);
  }
  return grid;
}

function paintComparison(current, previous, compared) {
  const node = box();
  if (!node) return;
  node.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = t("compare");
  const when = document.createElement("p");
  when.className = "sello";
  when.textContent = staleLine(previous.card.consultedAt, lang());
  node.append(title, when);
  if (!compared.changes.length) {
    const empty = document.createElement("p");
    empty.textContent = t("noChange");
    node.append(empty);
  } else {
    const heading = document.createElement("h3");
    heading.id = "que-cambio";
    heading.textContent = t("changes");
    node.append(heading, gridFor(compared.changes, "cambio", current, previous));
  }
  if (compared.unknown.length) {
    const details = document.createElement("details");
    details.className = "aviso-mas grupo-desconocido";
    const summary = document.createElement("summary");
    summary.textContent = t("unknownTitle");
    details.append(summary, gridFor(compared.unknown, "indeterminado", current, previous));
    node.append(details);
  }
  lastView = { current, previous };
  const changes = document.getElementById("que-cambio");
  if (changes) changes.scrollIntoView({ block: "nearest" });
}

async function readCurrent(mint) {
  if (lastSaved && lastSaved.card.mint === mint) return lastSaved;
  if (!isAllowedRpcUrl(PUBLICNODE_RPC)) return null;
  const result = await readMint({
    mint,
    endpoint: PUBLICNODE_RPC,
    transport: browserTransport,
    minIntervalMs: 2000,
  });
  if (!result.card) return null;
  return { id: crypto.randomUUID(), note: "", card: result.card, source: "leida" };
}

async function saveQuery(mint) {
  say(t("saving"));
  try {
    const record = await readCurrent(mint);
    if (!record) {
      say(t("fail"));
      return;
    }
    const checked = validateCard(record.card);
    if (!checked.ok) {
      say(t("fail"));
      return;
    }
    const db = await openDb();
    const existing = await dbAll(db);
    if (!existing.some((item) => item.id === record.id) && !withinStoreLimit(existing.length, 1)) {
      say(t("full"));
      return;
    }
    await dbPut(db, { id: record.id, note: "", card: checked.card });
    lastSaved = { id: record.id, note: "", card: checked.card };
    say(t("saved"));
  } catch {
    say(t("db"));
  }
}

async function comparePrevious(mint, focusChanges) {
  say(t("saving"));
  try {
    const current = await readCurrent(mint);
    if (!current) {
      say(t("fail"));
      return;
    }
    const db = await openDb();
    const existing = await dbAll(db);
    const previous = pickPrevious(existing, current.card, current.id);
    if (!previous) {
      say(t("none"));
      return;
    }
    const compared = compareRecords(current, previous);
    if (!compared.ok) {
      say(compared.error[lang()]);
      return;
    }
    paintComparison(current, previous, compared);
    if (focusChanges) {
      const changes = document.getElementById("que-cambio");
      if (changes) changes.scrollIntoView({ block: "start" });
    }
  } catch {
    say(t("db"));
  }
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const understand = target.closest("#entender-resultado");
  if (understand) {
    event.preventDefault();
    const href = understand.getAttribute("data-guia") || "/aprender/#guia-identificar";
    location.assign(href);
    return;
  }
  const save = target.closest("#guardar-consulta");
  if (save) {
    const mint = save.getAttribute("data-mint") || "";
    saveQuery(mint);
    return;
  }
  const previous = target.closest("#comparar-anterior");
  if (previous) {
    comparePrevious(previous.getAttribute("data-mint") || "", false);
    return;
  }
  const changed = target.closest("#ver-cambio");
  if (changed) {
    if (lastView) {
      const node = document.getElementById("que-cambio");
      if (node) node.scrollIntoView({ block: "start" });
      else comparePrevious(changed.getAttribute("data-mint") || "", true);
      return;
    }
    comparePrevious(changed.getAttribute("data-mint") || "", true);
  }
});

document.addEventListener("stubx-lang", () => {
  if (!lastView) return;
  const compared = compareRecords(lastView.current, lastView.previous);
  if (compared.ok) paintComparison(lastView.current, lastView.previous, compared);
});
