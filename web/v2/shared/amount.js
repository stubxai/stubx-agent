/**
 * Cantidad legible a partir de unidades mínimas y los decimales del mint.
 * El valor en bruto se queda para el detalle. No es un precio.
 */

export function formatAmount(raw, decimals, lang) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) return null;
  let value;
  try {
    value = BigInt(raw);
  } catch {
    return null;
  }
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const scale = 10n ** BigInt(decimals);
  const whole = abs / scale;
  let fraction = (abs % scale).toString().padStart(decimals, "0");
  fraction = fraction.replace(/0+$/, "");
  const locale = lang === "en" ? "en-GB" : "es-ES";
  let text = whole.toLocaleString(locale);
  if (fraction) {
    text += `${locale === "es-ES" ? "," : "."}${fraction}`;
  }
  if (negative) text = `-${text}`;
  return `${text} tokens`;
}
