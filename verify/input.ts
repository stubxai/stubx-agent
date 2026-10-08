import { decodePubkey } from "./base58.js";

export type MintCheck = { ok: true; mint: string } | { ok: false; message: string };

export function validateMint(input: string): MintCheck {
  if (input.length === 0) {
    return { ok: false, message: "Falta el mint." };
  }
  if (input.length > 50) {
    return { ok: false, message: "La entrada es demasiado larga. Se espera un mint en base58, no un texto ni una URL." };
  }
  if (/[:/\s]/.test(input)) {
    return { ok: false, message: "Se espera un mint en base58. No se aceptan URLs ni rutas." };
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
    return { ok: false, message: "El mint no tiene formato base58 de una dirección de Solana." };
  }
  if (!decodePubkey(input)) {
    return { ok: false, message: "El mint no decodifica a 32 bytes." };
  }
  return { ok: true, mint: input };
}
