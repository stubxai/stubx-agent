import { encodeBase58 } from "./base58.js";
import { percentTruncated, readBool, readU64 } from "./bytes.js";
import {
  CLASSIC_INITIAL_REAL_TOKEN_RESERVES,
  CLASSIC_TOKEN_TOTAL_SUPPLY,
  DEFAULT_PUBKEY,
  PUMP_DISCRIMINATOR,
  PUMP_PROGRAM,
  WSOL_MINT,
} from "./programs.js";

export type BondingCurve = {
  virtualTokenReserves: bigint;
  virtualQuoteReserves: bigint;
  realTokenReserves: bigint;
  realQuoteReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
  creator: string | null;
  quoteMint: string | null;
  quoteMintNote: string;
  quoteUnitNote: string;
  progressPercent: string | null;
  progressNote: string;
  trailingBytes: number;
};

export function decodeBondingCurve(owner: string, data: Uint8Array): BondingCurve | null {
  if (owner !== PUMP_PROGRAM || data.length < 8 + 40 + 1) {
    return null;
  }
  for (let i = 0; i < PUMP_DISCRIMINATOR.length; i += 1) {
    if (data[i] !== PUMP_DISCRIMINATOR[i]) {
      return null;
    }
  }
  const virtualTokenReserves = readU64(data, 8);
  const virtualQuoteReserves = readU64(data, 16);
  const realTokenReserves = readU64(data, 24);
  const realQuoteReserves = readU64(data, 32);
  const tokenTotalSupply = readU64(data, 40);
  const complete = readBool(data, 48);
  if (
    virtualTokenReserves === null ||
    virtualQuoteReserves === null ||
    realTokenReserves === null ||
    realQuoteReserves === null ||
    tokenTotalSupply === null ||
    complete === null
  ) {
    return null;
  }
  let cursor = 49;
  let creator: string | null = null;
  if (data.length >= cursor + 32) {
    creator = encodeBase58(data.subarray(cursor, cursor + 32));
    cursor += 32;
  }
  if (data.length >= cursor + 2) {
    cursor += 2;
  } else if (data.length > cursor) {
    cursor = data.length;
  }
  let quoteMint: string | null = null;
  if (data.length >= cursor + 32) {
    quoteMint = encodeBase58(data.subarray(cursor, cursor + 32));
    cursor += 32;
  }
  const knownTail = 8 + 1 + 1 + 8 + 8 + 1 + 8 + 8 + 8;
  if (data.length >= cursor + knownTail) {
    cursor += knownTail;
  }
  const classic =
    tokenTotalSupply === CLASSIC_TOKEN_TOTAL_SUPPLY && realTokenReserves <= CLASSIC_INITIAL_REAL_TOKEN_RESERVES;
  const progressPercent = classic
    ? percentTruncated(CLASSIC_INITIAL_REAL_TOKEN_RESERVES - realTokenReserves, CLASSIC_INITIAL_REAL_TOKEN_RESERVES, 2)
    : null;
  const quoteIsSol = quoteMint === null || quoteMint === WSOL_MINT || quoteMint === DEFAULT_PUBKEY;
  const quoteMintNote =
    quoteMint === null
      ? "La cuenta no incluye quote_mint. En curvas antiguas la quote es SOL."
      : quoteMint === DEFAULT_PUBKEY
        ? "32 bytes a cero: pubkey por defecto. El IDL público de Pump.fun usa ese valor cuando la quote es SOL, no un mint SPL."
        : quoteMint === WSOL_MINT
          ? "El campo quote_mint es el mint de wSOL."
          : "Pubkey leída del campo quote_mint.";
  return {
    virtualTokenReserves,
    virtualQuoteReserves,
    realTokenReserves,
    realQuoteReserves,
    tokenTotalSupply,
    complete,
    creator,
    quoteMint,
    quoteMintNote,
    quoteUnitNote: quoteIsSol
      ? "Unidades mínimas de la cantidad quote. En la curva clásica de Pump.fun, y cuando quote_mint es la pubkey por defecto, esa cantidad son lamports."
      : "Unidades mínimas del mint quote indicado.",
    progressPercent,
    progressNote: classic
      ? "Porcentaje inferido con la cantidad real inicial pública de la curva clásica (793100000000000). Truncado a 2 decimales hacia cero."
      : "La fórmula de la curva clásica no encaja con el suministro o la cantidad real de esta cuenta. No se estima el avance.",
    trailingBytes: Math.max(0, data.length - cursor),
  };
}
