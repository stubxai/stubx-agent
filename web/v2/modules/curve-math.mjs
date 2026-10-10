/** Cálculo local de un solo paso. No llama a la red y no recorta en silencio. */

export function parseAmount(raw, decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    return { ok: false, code: "decimales" };
  }
  const text = String(raw ?? "").trim().replaceAll(" ", "");
  if (text.length === 0) return { ok: false, code: "vacia" };
  if (text.startsWith("-") || text.startsWith("+")) return { ok: false, code: "invalida" };
  if (text.includes(",") && text.includes(".")) return { ok: false, code: "invalida" };
  const norm = text.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(norm)) return { ok: false, code: "invalida" };
  const [whole, frac = ""] = norm.split(".");
  if (frac.length > decimals) return { ok: false, code: "decimales" };
  const padded = frac.padEnd(decimals, "0");
  const units = BigInt(whole) * 10n ** BigInt(decimals) + (padded.length > 0 ? BigInt(padded) : 0n);
  if (units <= 0n) return { ok: false, code: "cero" };
  return { ok: true, units };
}

export function formatUnits(amount, decimals) {
  const negative = amount < 0n;
  const value = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = (value % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const text = frac.length > 0 ? `${whole.toString()}.${frac}` : whole.toString();
  return negative ? `-${text}` : text;
}

function absDiff(left, right) {
  return left > right ? left - right : right - left;
}

function feeOf(gross, bps) {
  return (gross * bps) / 10000n;
}

/**
 * Entregas moneda base y estimas tokens.
 * fee = floor(bruto * bps / 10000); neto = bruto - fee;
 * salida = floor(neto * cantidadVirtualToken / (cantidadVirtualBase + neto)).
 */
export function estimateBaseToToken(curve, gross, feeBps) {
  if (gross <= 0n || feeBps < 0n || feeBps > 10000n) return { status: "invalida" };
  if (curve.virtualQuote <= 0n || curve.virtualToken <= 0n) return { status: "sin_curva" };
  const fee = feeOf(gross, feeBps);
  const net = gross - fee;
  const denom = curve.virtualQuote + net;
  const tokensOut = (net * curve.virtualToken) / denom;
  const independent = curve.virtualToken - (curve.virtualQuote * curve.virtualToken) / denom;
  const diff = absDiff(tokensOut, independent);
  if (diff > 1n) return { status: "no_cuadra", diff };
  if (tokensOut > curve.realToken) return { status: "no_alcanza" };
  return {
    status: "ok",
    fee,
    net,
    tokensOut,
    independent,
    diff,
    impactBps: (net * 10000n) / curve.virtualQuote,
  };
}

/** Entregas tokens y estimas moneda base. Un solo paso. */
export function estimateTokenToBase(curve, tokensIn, feeBps) {
  if (tokensIn <= 0n || feeBps < 0n || feeBps > 10000n) return { status: "invalida" };
  if (curve.virtualQuote <= 0n || curve.virtualToken <= 0n) return { status: "sin_curva" };
  const denom = curve.virtualToken + tokensIn;
  const grossQuote = (tokensIn * curve.virtualQuote) / denom;
  const independent = curve.virtualQuote - (curve.virtualToken * curve.virtualQuote) / denom;
  const diff = absDiff(grossQuote, independent);
  if (diff > 1n) return { status: "no_cuadra", diff };
  if (grossQuote > curve.realQuote) return { status: "no_alcanza" };
  const fee = feeOf(grossQuote, feeBps);
  return {
    status: "ok",
    fee,
    net: grossQuote - fee,
    grossQuote,
    independent,
    diff,
    impactBps: (grossQuote * 10000n) / curve.virtualQuote,
  };
}

/** La comisión ausente no se convierte en cero. Cero solo si la cuenta lo dice. */
export function feeBpsForEstimate(fees) {
  if (!fees || fees.protocol.status !== "leida") return { ok: false, code: "sin_protocolo" };
  const creatorKnown = fees.creator.status === "leida";
  if (fees.creator.status === "ilegible") return { ok: false, code: "comision_ilegible" };
  const creatorBps = creatorKnown ? fees.creator.bps : 0n;
  const total = fees.protocol.bps + creatorBps;
  if (total > 10000n) return { ok: false, code: "comision_ilegible" };
  return {
    ok: true,
    totalBps: total,
    protocolBps: fees.protocol.bps,
    creatorBps: creatorKnown ? fees.creator.bps : null,
    creatorOmitted: !creatorKnown,
  };
}

export function componentFees(gross, protocolBps, creatorBps) {
  return {
    protocol: feeOf(gross, protocolBps),
    creator: creatorBps === null ? null : feeOf(gross, creatorBps),
    used: feeOf(gross, protocolBps + (creatorBps ?? 0n)),
  };
}
