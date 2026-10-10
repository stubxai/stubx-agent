import { readCurveState } from "../modules/chain-read.mjs";
import {
  componentFees,
  estimateBaseToToken,
  estimateTokenToBase,
  feeBpsForEstimate,
  formatUnits,
  parseAmount,
} from "../modules/curve-math.mjs";

const SOL_DECIMALS = 9;

const TEXT = {
  direccion: ["Esa dirección no es válida. Suele tener entre 32 y 44 letras y números.", "That address is not valid. It is usually 32 to 44 letters and numbers."],
  vacia: ["Escribe una cantidad mayor que cero.", "Enter an amount greater than zero."],
  cero: ["La cantidad tiene que ser mayor que cero.", "The amount has to be greater than zero."],
  invalida: ["La cantidad no se entiende. Usa un número mayor que cero, con coma o con punto.", "The amount is not understood. Use a number greater than zero, with a comma or a dot."],
  decimales: ["Hay más decimales de los que admite esta unidad.", "There are more decimal places than this unit allows."],
  no_mint: ["Esa cuenta no es un mint. No hay estimación.", "That account is not a mint. There is no estimate."],
  no_curva: ["No hay una curva para esta dirección. Modalidad no soportada.", "There is no curve for this address. Mode not supported."],
  cerrada: ["La curva está cerrada. Modalidad no soportada.", "The curve is closed. Mode not supported."],
  no_sol: ["La moneda base no es SOL. Modalidad no soportada.", "The base currency is not SOL. Mode not supported."],
  sin_protocolo: ["No se pudo leer la comisión del protocolo. No hay estimación y no se pone cero en su lugar.", "The protocol fee could not be read. There is no estimate, and zero is not used in its place."],
  comision_ilegible: ["La comisión leída no se puede usar. No hay estimación y no se pone cero en su lugar.", "The fee that was read cannot be used. There is no estimate, and zero is not used in its place."],
  no_alcanza: ["La cantidad estimada no cabe en la cantidad real. No se recorta y no hay estimación.", "The estimated amount does not fit in the real amount. It is not cut down, and there is no estimate."],
  limite: ["El servicio limitó la consulta. No se inventa ninguna cifra. Puedes volver a estimar.", "The service limited the query. No figure is invented. You can estimate again."],
  tiempo: ["El servicio no respondió a tiempo. No se inventa ninguna cifra. Puedes volver a estimar.", "The service did not answer in time. No figure is invented. You can estimate again."],
  red: ["El servicio no respondió. No se inventa ninguna cifra. Puedes volver a estimar.", "The service did not answer. No figure is invented. You can estimate again."],
  leyendo: ["Leyendo datos públicos. No se firma nada.", "Reading public data. Nothing is signed."],
};

function line(es, en) {
  return { es, en };
}

function show(lines) {
  const out = document.querySelector("#resultado");
  if (!out) return;
  out.replaceChildren();
  const title = document.createElement("h2");
  title.append(span("Estimación", "Estimate"));
  out.append(title);
  for (const item of lines) {
    const p = document.createElement("p");
    p.append(span(item.es, item.en));
    out.append(p);
  }
  out.tabIndex = -1;
  out.focus();
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

function fail(code) {
  const pair = TEXT[code] ?? TEXT.red;
  show([line(pair[0], pair[1])]);
}

function hosts(reads) {
  const found = [];
  for (const row of reads ?? []) {
    try {
      const host = new URL(row.endpoint).host;
      if (!found.includes(host)) found.push(host);
    } catch {
      /* una fuente ilegible no se inventa */
    }
  }
  return found;
}

function successLines(state, direction, parsed, fees, math) {
  const decimals = direction === "base" ? state.mintDecoded.decimals : SOL_DECIMALS;
  const outRaw = direction === "base" ? math.tokensOut : math.net;
  const parts = componentFees(direction === "base" ? parsed.units : math.grossQuote, fees.protocolBps, fees.creatorBps);
  const name = state.metadata?.name ? state.metadata.name : "";
  const lines = [
    line("Estimación educativa. No es una recomendación ni una orden; el resultado real puede ser distinto.", "Educational estimate. It is not a recommendation or an order; the real result can differ."),
    line("Un solo paso de la curva. No se suman dos pasos.", "One curve step only. Two steps are not added together."),
    line(`Dirección analizada: ${state.mint}`, `Address analyzed: ${state.mint}`),
  ];
  if (name) {
    lines.push(line(`Nombre leído: ${name}. Es un texto de la cuenta, no un aval.`, `Name read: ${name}. It is account text, not an endorsement.`));
  } else {
    lines.push(line("Nombre: no disponible. No se rellena.", "Name: unavailable. It is not filled in."));
  }
  if (state.metadata?.uri) {
    lines.push(line(`Enlace de metadatos, no se abre: ${state.metadata.uri}`, `Metadata link, not opened: ${state.metadata.uri}`));
  }
  lines.push(line("Moneda base: SOL.", "Base currency: SOL."));
  lines.push(line(
    `Cantidad estimada: ${formatUnits(outRaw, decimals)} (${outRaw.toString()} unidades mínimas).`,
    `Estimated amount: ${formatUnits(outRaw, decimals)} (${outRaw.toString()} minimal units).`,
  ));
  lines.push(line(
    `Comisión del protocolo: ${parts.protocol.toString()} unidades mínimas de la moneda base (${fees.protocolBps.toString()} diezmilésimas).`,
    `Protocol fee: ${parts.protocol.toString()} minimal units of the base currency (${fees.protocolBps.toString()} basis points).`,
  ));
  if (fees.creatorOmitted) {
    lines.push(line("Comisión de creación: no disponible. La estimación no la suma y no la pone a cero.", "Creation fee: unavailable. The estimate does not add it and does not set it to zero."));
  } else {
    lines.push(line(
      `Comisión de creación: ${(parts.creator ?? 0n).toString()} unidades mínimas (${fees.creatorBps.toString()} diezmilésimas).`,
      `Creation fee: ${(parts.creator ?? 0n).toString()} minimal units (${fees.creatorBps.toString()} basis points).`,
    ));
  }
  lines.push(line(
    `Comisión usada en la estimación: ${parts.used.toString()} unidades mínimas. Es el truncado de la suma, hacia cero.`,
    `Fee used in the estimate: ${parts.used.toString()} minimal units. It is the sum, truncated toward zero.`,
  ));
  lines.push(line(
    `Impacto en la curva: ${math.impactBps.toString()} diezmilésimas. Es el cambio relativo de la cantidad virtual de la moneda base. No es un valor en euros.`,
    `Curve impact: ${math.impactBps.toString()} basis points. It is the relative change in the virtual base amount. It is not a euro value.`,
  ));
  lines.push(line(
    `Las dos fórmulas difieren en ${math.diff.toString()} unidad mínima. El tope admitido es 1.`,
    `The two formulas differ by ${math.diff.toString()} minimal unit. The allowed gap is 1.`,
  ));
  lines.push(line(
    state.slot === null ? "Slot: no disponible. No se sustituye por cero." : `Slot: ${state.slot}.`,
    state.slot === null ? "Slot: unavailable. It is not replaced with zero." : `Slot: ${state.slot}.`,
  ));
  lines.push(line(`Hora UTC: ${state.fetchedAt}.`, `UTC time: ${state.fetchedAt}.`));
  const source = hosts(state.reads);
  lines.push(line(
    source.length > 0 ? `Fuente de la lectura correcta: ${source.join(", ")}.` : "Fuente: no disponible.",
    source.length > 0 ? `Source of the successful read: ${source.join(", ")}.` : "Source: unavailable.",
  ));
  return lines;
}

async function estimate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement) || form.dataset.busy === "1") return;
  const button = form.querySelector("button");
  const address = form.querySelector("#direccion-token");
  const amount = form.querySelector("#cantidad");
  const direction = form.querySelector("input[name='sentido']:checked");
  if (!(address instanceof HTMLInputElement) || !(amount instanceof HTMLInputElement) || !(direction instanceof HTMLInputElement)) return;
  form.dataset.busy = "1";
  if (button instanceof HTMLButtonElement) button.disabled = true;
  show([line(TEXT.leyendo[0], TEXT.leyendo[1])]);
  try {
    const sense = direction.value === "token" ? "token" : "base";
    if (!address.value.trim()) {
      fail("direccion");
      return;
    }
    let parsed = null;
    if (sense === "base") {
      parsed = parseAmount(amount.value, SOL_DECIMALS);
      if (!parsed.ok) {
        fail(parsed.code);
        return;
      }
    }
    const state = await readCurveState(address.value);
    if (!state.ok) {
      fail(state.code);
      return;
    }
    if (!state.curve) {
      fail("no_curva");
      return;
    }
    if (state.curve.complete) {
      fail("cerrada");
      return;
    }
    if (!state.curve.quoteSol) {
      const quote = state.curve.quoteMint ?? "";
      show([
        line(TEXT.no_sol[0], TEXT.no_sol[1]),
        line(`Moneda base leída: ${quote}.`, `Base currency read: ${quote}.`),
      ]);
      return;
    }
    const fees = feeBpsForEstimate(state.fees);
    if (!fees.ok) {
      fail(fees.code);
      return;
    }
    if (sense === "token") {
      parsed = parseAmount(amount.value, state.mintDecoded.decimals);
      if (!parsed.ok) {
        fail(parsed.code);
        return;
      }
    }
    const math = sense === "base"
      ? estimateBaseToToken(state.curve, parsed.units, fees.totalBps)
      : estimateTokenToBase(state.curve, parsed.units, fees.totalBps);
    if (math.status !== "ok") {
      fail(math.status === "no_alcanza" ? "no_alcanza" : "red");
      return;
    }
    show(successLines(state, sense, parsed, fees, math));
  } catch {
    fail("red");
  } finally {
    form.dataset.busy = "";
    if (button instanceof HTMLButtonElement) button.disabled = false;
  }
}

const form = document.querySelector("#consulta");
if (form instanceof HTMLFormElement) form.addEventListener("submit", (event) => void estimate(event));
