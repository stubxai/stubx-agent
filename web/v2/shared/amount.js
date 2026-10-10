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
  const digits = whole.toString();
  const separator = lang === "en" ? "," : ".";
  let text = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) text += separator;
    text += digits[i];
  }
  if (fraction) text += `${lang === "en" ? "." : ","}${fraction}`;
  if (negative) text = `-${text}`;
  return `${text} tokens`;
}
