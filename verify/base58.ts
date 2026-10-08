const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const INDEX = new Array<number>(128).fill(-1);
for (let i = 0; i < ALPHABET.length; i += 1) {
  INDEX[ALPHABET.charCodeAt(i)] = i;
}

export function decodeBase58(source: string): Uint8Array | null {
  if (source.length === 0) {
    return new Uint8Array();
  }
  let zeroes = 0;
  let i = 0;
  while (i < source.length && source[i] === "1") {
    zeroes += 1;
    i += 1;
  }
  const size = Math.ceil((source.length * Math.log(58)) / Math.log(256)) + 1;
  const b256 = new Uint8Array(size);
  for (; i < source.length; i += 1) {
    const ch = source.charCodeAt(i);
    const value = ch < 128 ? INDEX[ch] : -1;
    if (value === undefined || value < 0) {
      return null;
    }
    let carry = value;
    for (let j = size - 1; j >= 0; j -= 1) {
      carry += 58 * (b256[j] ?? 0);
      b256[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    if (carry !== 0) {
      return null;
    }
  }
  let start = 0;
  while (start < b256.length && b256[start] === 0) {
    start += 1;
  }
  const out = new Uint8Array(zeroes + (b256.length - start));
  out.set(b256.subarray(start), zeroes);
  return out;
}

export function encodeBase58(bytes: Uint8Array): string {
  let zeroes = 0;
  while (zeroes < bytes.length && bytes[zeroes] === 0) {
    zeroes += 1;
  }
  const size = Math.ceil((bytes.length * Math.log(256)) / Math.log(58)) + 1;
  const b58 = new Uint8Array(size);
  for (let i = zeroes; i < bytes.length; i += 1) {
    let carry = bytes[i] ?? 0;
    for (let j = size - 1; j >= 0; j -= 1) {
      carry += 256 * (b58[j] ?? 0);
      b58[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
  }
  let start = 0;
  while (start < b58.length && b58[start] === 0) {
    start += 1;
  }
  let out = "1".repeat(zeroes);
  for (let i = start; i < b58.length; i += 1) {
    out += ALPHABET[b58[i] ?? 0] ?? "";
  }
  return out;
}

export function decodePubkey(value: string): Uint8Array | null {
  const bytes = decodeBase58(value);
  if (!bytes || bytes.length !== 32) {
    return null;
  }
  return bytes;
}

export function isZeroPubkey(bytes: Uint8Array): boolean {
  if (bytes.length !== 32) {
    return false;
  }
  for (const byte of bytes) {
    if (byte !== 0) {
      return false;
    }
  }
  return true;
}
