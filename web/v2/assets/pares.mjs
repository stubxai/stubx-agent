import { readCurveState } from "../modules/chain-read.mjs";
import { canonicalJson, describePair, drawSnapshot, evidenceRecord, sha256Hex, snapshotLines } from "../modules/pair-report.mjs";

const TEXT = {
  direccion: ["Esa dirección no es válida. Suele tener entre 32 y 44 letras y números.", "That address is not valid. It is usually 32 to 44 letters and numbers."],
  no_mint: ["Esa cuenta no es un mint. No hay informe.", "That account is not a mint. There is no report."],
  limite: ["El servicio limitó la consulta. No se inventa una ruta favorable. Puedes volver a leer.", "The service limited the query. A favorable route is not invented. You can read again."],
  tiempo: ["El servicio no respondió a tiempo. No se inventa una ruta favorable. Puedes volver a leer.", "The service did not answer in time. A favorable route is not invented. You can read again."],
  red: ["El servicio no respondió. No se inventa una ruta favorable. Puedes volver a leer.", "The service did not answer. A favorable route is not invented. You can read again."],
  leyendo: ["Leyendo datos públicos. No se firma nada.", "Reading public data. Nothing is signed."],
};

let current = null;

function lang() {
  return document.documentElement.dataset.lang === "en" ? "en" : "es";
}

function span(es, en) {
  const wrap = document.createDocumentFragment();
  const left = document.createElement("span");
  left.className = "lang es";
  left.lang = "es";
  left.textContent = es;
  const right = document.createElement("span");
  right.className = "lang en";
  right.lang = "en";
  right.textContent = en;
  wrap.append(left, right);
  return wrap;
}

function show(lines) {
  const out = document.querySelector("#resultado");
  if (!out) return;
  out.replaceChildren();
  const title = document.createElement("h2");
  title.append(span("Informe", "Report"));
  out.append(title);
  for (const item of lines) {
    const p = document.createElement("p");
    p.append(span(item.es, item.en));
    out.append(p);
  }
  out.tabIndex = -1;
  out.focus();
}

function fail(code) {
  current = null;
  const exportButton = document.querySelector("#exportar");
  if (exportButton) exportButton.hidden = true;
  const pair = TEXT[code] ?? TEXT.red;
  show([{ es: pair[0], en: pair[1] }]);
}

function hosts(reads) {
  const found = [];
  for (const row of reads ?? []) {
    try {
      const host = new URL(row.endpoint).host;
      if (host && !found.includes(host)) found.push(host);
    } catch {
      /* una fuente ilegible no se inventa */
    }
  }
  return found;
}

function feeLine(labelEs, labelEn, bps) {
  if (bps === null) {
    return {
      es: `${labelEs}: no disponible. No se pone cero en su lugar.`,
      en: `${labelEn}: not available. Zero is not used in its place.`,
    };
  }
  return {
    es: `${labelEs}: ${bps} diezmilésimas.`,
    en: `${labelEn}: ${bps} basis points.`,
  };
}

function pageLines(evidence, digest) {
  const connector = {
    abierta: ["Conector: curva abierta.", "Connector: open curve."],
    completa: ["Conector: curva completa. No es una conclusión favorable.", "Connector: complete curve. This is not a favorable conclusion."],
    sin_curva: ["Conector: no hay curva. No es una conclusión favorable.", "Connector: no curve. This is not a favorable conclusion."],
  }[evidence.connector] ?? ["Conector: no disponible. No es una conclusión favorable.", "Connector: unavailable. This is not a favorable conclusion."];
  const route = evidence.route === "un_paso"
    ? ["Ruta: un solo paso en la curva abierta. No se suman dos pasos.", "Route: one step on the open curve. Two steps are not added together."]
    : ["Ruta: no compatible. No se inventa un paso.", "Route: not compatible. A step is not invented."];
  const base = evidence.base === "desconocida"
    ? ["Moneda base: desconocida.", "Base currency: unknown."]
    : [`Moneda base: ${evidence.base}.`, `Base currency: ${evidence.base}.`];
  const lines = [
    { es: "No es una auditoría ni una recomendación. Muestra datos públicos de la cadena en el momento indicado; no dice si un token es bueno, seguro o una buena compra.", en: "It is not an audit or a recommendation. It shows public chain data at the stated time; it does not say whether a token is good, safe, or a good purchase." },
    { es: `Token analizado: ${evidence.mint}`, en: `Token analyzed: ${evidence.mint}` },
  ];
  if (evidence.official) {
    lines.push({ es: "Esta dirección coincide con la CA publicada de STUBX.", en: "This address matches the published STUBX CA." });
  } else {
    lines.push({ es: "STUBX no revisa ni respalda este token.", en: "STUBX does not review or endorse this token." });
  }
  lines.push({ es: "Un emparejamiento no es una colaboración ni un respaldo.", en: "A pairing is not a collaboration or an endorsement." });
  if (evidence.name) lines.push({ es: `Nombre leído: ${evidence.name}. Es un texto de la cuenta, no un aval.`, en: `Name read: ${evidence.name}. It is account text, not an endorsement.` });
  else lines.push({ es: "Nombre: no disponible. No se rellena.", en: "Name: not available. It is not filled in." });
  if (evidence.uri) lines.push({ es: `Enlace de metadatos, no se abre: ${evidence.uri}`, en: `Metadata link, not opened: ${evidence.uri}` });
  lines.push(
    { es: base[0], en: base[1] },
    { es: connector[0], en: connector[1] },
    { es: route[0], en: route[1] },
    feeLine("Comisión del protocolo", "Protocol fee", evidence.protocolFeeBps),
    feeLine("Comisión de creación", "Creation fee", evidence.creatorFeeBps),
    evidence.slot === null
      ? { es: "Slot: no disponible.", en: "Slot: not available." }
      : { es: `Slot: ${evidence.slot}`, en: `Slot: ${evidence.slot}` },
    { es: `Hora UTC: ${evidence.readAt}`, en: `UTC time: ${evidence.readAt}` },
    { es: `Fuente de las lecturas que respondieron: ${evidence.source}`, en: `Source of the reads that answered: ${evidence.source}` },
    { es: "Instantánea: puede haber cambiado.", en: "Snapshot: it may have changed." },
    { es: `sha256: ${digest}`, en: `sha256: ${digest}` },
    { es: "El hash detecta cambios respecto a esta evidencia. No certifica que sea verdad.", en: "The hash detects changes against this evidence. It does not certify that it is true." },
  );
  return lines;
}

function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportReport() {
  if (!current) return;
  const lines = snapshotLines(current.evidence, lang());
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawSnapshot(ctx, lines);
  const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) return;
  const stem = `pares-${current.evidence.mint.slice(0, 8)}`;
  download(`${stem}.png`, png);
  download(`${stem}.json`, new Blob([`${current.json}\n`], { type: "application/json" }));
}

async function onSubmit(event) {
  event.preventDefault();
  const address = document.querySelector("#direccion-token");
  const button = event.submitter ?? document.querySelector("#consulta button[type='submit']");
  if (!address || !address.value.trim()) {
    fail("direccion");
    return;
  }
  if (button) button.disabled = true;
  fail("leyendo");
  try {
    const state = await readCurveState(address.value);
    if (!state.ok) {
      fail(TEXT[state.code] ? state.code : "red");
      return;
    }
    const pair = describePair(state);
    if (!pair.ok) {
      fail("red");
      return;
    }
    const evidence = evidenceRecord({
      mint: state.mint,
      name: state.metadata?.name || null,
      uri: state.metadata?.uri || null,
      base: pair.base,
      connector: pair.connector,
      route: pair.route,
      protocolFeeBps: pair.protocolFeeBps,
      creatorFeeBps: pair.creatorFeeBps,
      slot: state.slot,
      source: hosts(state.reads).join(", ") || "no disponible",
      readAt: state.fetchedAt,
    });
    const canonical = canonicalJson(evidence);
    const digest = await sha256Hex(canonical);
    current = { evidence, json: JSON.stringify({ evidence, sha256: digest }, null, 2) };
    const exportButton = document.querySelector("#exportar");
    if (exportButton) exportButton.hidden = false;
    show(pageLines(evidence, digest));
  } catch {
    fail("red");
  } finally {
    if (button) button.disabled = false;
  }
}

const form = document.querySelector("#consulta");
form?.addEventListener("submit", onSubmit);
document.querySelector("#exportar")?.addEventListener("click", () => {
  exportReport().catch(() => fail("red"));
});
