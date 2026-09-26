import { FORBIDDEN_MARKERS } from "./forbidden-scan.js";
import type { LimitId } from "./types.js";

export type DraftReview =
  | { ok: true }
  | { ok: false; limitId: LimitId; code: LimitId }
  | { ok: false; limitId: null; code: "remote-reference" };

const ADDRESS = /(?<![1-9A-HJ-NP-Za-km-z])[1-9A-HJ-NP-Za-km-z]{32,44}(?![1-9A-HJ-NP-Za-km-z])/g;
const HEX_HASH = /(?<![0-9a-fA-F])[0-9a-fA-F]{64}(?![0-9a-fA-F])/g;

function letters(...codes: number[]): string {
  return String.fromCharCode(...codes);
}

function wordPattern(words: readonly string[]): RegExp {
  const body = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${body})(?=$|[^\\p{L}\\p{N}])`, "iu");
}

const SOLICIT_PATTERN = wordPattern([
  letters(98, 117, 121),
  letters(99, 111, 109, 112, 114, 97, 114),
]);

const OUTCOME_PATTERN = wordPattern([
  letters(112, 114, 105, 99, 101),
  letters(114, 101, 116, 117, 114, 110, 115),
  letters(105, 110, 118, 101, 115, 116, 109, 101, 110, 116),
  letters(112, 114, 101, 99, 105, 111),
  letters(105, 110, 118, 101, 114, 115, 105, 111, 110),
  letters(114, 101, 110, 116, 97, 98, 105, 108, 105, 100, 97, 100),
]);

const SOLICIT_TEXT = [
  /env[ií]a\s+sol\b/iu,
  /manda\s+sol\b/iu,
  /p[aá]same\s+sol\b/iu,
  /send\s+sol\b/iu,
  /\bairdrop\b/iu,
];

const OUTCOME_TEXT = [
  /garantiz/iu,
  /\bapy\b/iu,
  /\broi\b/iu,
  /x100/iu,
  /ganancias?\s+seguras?/iu,
  /sin\s+riesgo/iu,
  /\bprofit\b/iu,
];

const SECRET_TEXT = [
  /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/,
  /\bapi[_-]?key\s*[:=]/i,
  /\bsecret[_-]?key\b/i,
  /\bprivate[_-]?key\b/i,
  /\bmnemonic\b/i,
];

function limitForMarker(value: string): LimitId {
  const lower = value.toLowerCase();
  if (lower.includes("mainnet")) {
    return "no-mainnet";
  }
  if (lower.includes("send") && lower.includes("transaction")) {
    return "no-send";
  }
  if (lower.includes("sign") || lower.includes("keypair") || lower.includes("solana/")) {
    return "no-sign";
  }
  return "no-store-secrets";
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStrings(item, out);
    }
  }
}

export function stringsIn(value: unknown): string[] {
  const out: string[] = [];
  collectStrings(value, out);
  return out;
}

export function reviewText(text: string, knownMints: readonly string[]): DraftReview {
  for (const item of FORBIDDEN_MARKERS) {
    if (text.includes(item)) {
      const limitId = limitForMarker(item);
      return { ok: false, limitId, code: limitId };
    }
  }
  for (const pattern of SECRET_TEXT) {
    if (pattern.test(text)) {
      return { ok: false, limitId: "no-store-secrets", code: "no-store-secrets" };
    }
  }
  if (text.toLowerCase().includes("mainnet")) {
    return { ok: false, limitId: "no-mainnet", code: "no-mainnet" };
  }
  if (SOLICIT_PATTERN.test(text) || SOLICIT_TEXT.some((pattern) => pattern.test(text))) {
    return { ok: false, limitId: "no-solicit-funds", code: "no-solicit-funds" };
  }
  if (OUTCOME_PATTERN.test(text) || OUTCOME_TEXT.some((pattern) => pattern.test(text))) {
    return { ok: false, limitId: "no-outcome-promises", code: "no-outcome-promises" };
  }
  const addresses = text.match(new RegExp(ADDRESS.source, "g")) ?? [];
  for (const address of addresses) {
    if (!knownMints.includes(address)) {
      return { ok: false, limitId: "no-invented-addresses", code: "no-invented-addresses" };
    }
  }
  const hashes = text.match(new RegExp(HEX_HASH.source, "g")) ?? [];
  if (hashes.length > 0) {
    return { ok: false, limitId: "no-invented-addresses", code: "no-invented-addresses" };
  }
  if (text.includes("://")) {
    return { ok: false, limitId: null, code: "remote-reference" };
  }
  return { ok: true };
}

export function reviewPayload(payload: unknown, knownMints: readonly string[]): DraftReview {
  const text = stringsIn(payload).join("\n");
  if (text.length === 0) {
    return { ok: true };
  }
  return reviewText(text, knownMints);
}
