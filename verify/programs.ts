import { decodePubkey, encodeBase58 } from "./base58.js";
import { findProgramAddress } from "./pda.js";

export const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const METADATA_PROGRAM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
export const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const ATA_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const DEFAULT_PUBKEY = "11111111111111111111111111111111";

export const MINT_BASE_LEN = 82;
export const ACCOUNT_BASE_LEN = 165;
export const PUMP_DISCRIMINATOR = Uint8Array.from([23, 183, 248, 55, 96, 216, 172, 96]);

/** Reserva real inicial de la curva clásica de Pump.fun (6 decimales). Documentada, no leída de la cuenta. */
export const CLASSIC_INITIAL_REAL_TOKEN_RESERVES = 793_100_000_000_000n;
export const CLASSIC_TOKEN_TOTAL_SUPPLY = 1_000_000_000_000_000n;

function mustPubkey(value: string): Uint8Array {
  const bytes = decodePubkey(value);
  if (!bytes) {
    throw new Error(`Dirección de programa no decodifica: ${value}`);
  }
  return bytes;
}

export function metadataPda(mint: string): string {
  const mintBytes = mustPubkey(mint);
  const program = mustPubkey(METADATA_PROGRAM);
  const { address } = findProgramAddress(
    [new TextEncoder().encode("metadata"), program, mintBytes],
    program,
  );
  return encodeBase58(address);
}

export function bondingCurvePda(mint: string): string {
  const mintBytes = mustPubkey(mint);
  const program = mustPubkey(PUMP_PROGRAM);
  const { address } = findProgramAddress(
    [new TextEncoder().encode("bonding-curve"), mintBytes],
    program,
  );
  return encodeBase58(address);
}

export function associatedTokenAddress(owner: string, mint: string, tokenProgram: string): string | null {
  const ownerBytes = decodePubkey(owner);
  const mintBytes = decodePubkey(mint);
  const tokenProgramBytes = decodePubkey(tokenProgram);
  const ataProgram = decodePubkey(ATA_PROGRAM);
  if (!ownerBytes || !mintBytes || !tokenProgramBytes || !ataProgram) {
    return null;
  }
  const { address } = findProgramAddress([ownerBytes, tokenProgramBytes, mintBytes], ataProgram);
  return encodeBase58(address);
}
