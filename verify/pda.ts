import { sha256 } from "./sha256.js";

const P = (1n << 255n) - 19n;
const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  let size = 0;
  for (const part of parts) {
    size += part.length;
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function mod(a: bigint): bigint {
  const r = a % P;
  return r >= 0n ? r : r + P;
}

function modPow(base: bigint, exp: bigint): bigint {
  let result = 1n;
  let b = mod(base);
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      result = mod(result * b);
    }
    b = mod(b * b);
    e >>= 1n;
  }
  return result;
}

const D = mod(-121665n * modPow(121666n, P - 2n));

/** True when the 32 bytes are a canonical compressed ed25519 point. */
export function isOnCurve(bytes: Uint8Array): boolean {
  if (bytes.length !== 32) {
    return false;
  }
  let y = 0n;
  for (let i = 0; i < 32; i += 1) {
    y |= BigInt(bytes[i] ?? 0) << (8n * BigInt(i));
  }
  y &= (1n << 255n) - 1n;
  if (y >= P) {
    return false;
  }
  const y2 = mod(y * y);
  const u = mod(y2 - 1n);
  const v = mod(D * y2 + 1n);
  if (v === 0n) {
    return false;
  }
  const x2 = mod(u * modPow(v, P - 2n));
  if (x2 === 0n) {
    return true;
  }
  return modPow(x2, (P - 1n) / 2n) === 1n;
}

export function findProgramAddress(seeds: readonly Uint8Array[], programId: Uint8Array): { address: Uint8Array; bump: number } {
  if (programId.length !== 32) {
    throw new Error("El programa tiene que ser de 32 bytes.");
  }
  if (seeds.length > 16) {
    throw new Error("Demasiadas semillas para una PDA.");
  }
  for (const seed of seeds) {
    if (seed.length > 32) {
      throw new Error("Semilla de más de 32 bytes.");
    }
  }
  for (let bump = 255; bump >= 0; bump -= 1) {
    const address = sha256(concatBytes([...seeds, Uint8Array.of(bump), programId, PDA_MARKER]));
    if (!isOnCurve(address)) {
      return { address, bump };
    }
  }
  throw new Error("No hay una PDA fuera de la curva.");
}
