export function readU16(data: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 2 > data.length) {
    return null;
  }
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

export function readU32(data: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > data.length) {
    return null;
  }
  return (
    (data[offset] ?? 0) |
    ((data[offset + 1] ?? 0) << 8) |
    ((data[offset + 2] ?? 0) << 16) |
    ((data[offset + 3] ?? 0) << 24)
  ) >>> 0;
}

export function readU64(data: Uint8Array, offset: number): bigint | null {
  if (offset < 0 || offset + 8 > data.length) {
    return null;
  }
  let n = 0n;
  for (let i = 0; i < 8; i += 1) {
    n |= BigInt(data[offset + i] ?? 0) << (8n * BigInt(i));
  }
  return n;
}

export function readBool(data: Uint8Array, offset: number): boolean | null {
  if (offset < 0 || offset >= data.length) {
    return null;
  }
  const value = data[offset];
  if (value !== 0 && value !== 1) {
    return null;
  }
  return value === 1;
}

export function formatUnits(amount: bigint, decimals: number): string {
  if (decimals < 0 || decimals > 18) {
    return amount.toString();
  }
  const negative = amount < 0n;
  const value = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  const fracText = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const text = fracText.length > 0 ? `${whole.toString()}.${fracText}` : whole.toString();
  return negative ? `-${text}` : text;
}

/** Misma cifra que el Cuaderno: grupos de tres con BigInt, sin redondeo y sin el sufijo «tokens». */
export function formatUnitsLocale(amount: bigint, decimals: number, lang: "es" | "en"): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    return amount.toString();
  }
  const negative = amount < 0n;
  const value = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = decimals === 0 ? "" : (value % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const grouped = groupThousands(whole, lang === "en" ? "," : ".");
  const text = fraction ? `${grouped}${lang === "en" ? "." : ","}${fraction}` : grouped;
  return negative ? `-${text}` : text;
}

function groupThousands(whole: bigint, separator: string): string {
  const digits = whole.toString();
  let out = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      out += separator;
    }
    out += digits[i] ?? "";
  }
  return out;
}

/** Truncado hacia cero, no redondeo. `decimals` son cifras tras la coma del porcentaje. */
export function percentTruncated(part: bigint, whole: bigint, decimals = 4): string | null {
  if (whole <= 0n || part < 0n) {
    return null;
  }
  const scale = 10n ** BigInt(decimals);
  const scaled = (part * 100n * scale) / whole;
  const wholePart = scaled / scale;
  const frac = scaled % scale;
  if (decimals === 0) {
    return wholePart.toString();
  }
  return `${wholePart.toString()}.${frac.toString().padStart(decimals, "0")}`;
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}
