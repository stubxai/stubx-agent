import { encodeBase58 } from "./base58.js";
import { readBool, readU16, readU32 } from "./bytes.js";
import { readBorshString, cleanText } from "./mint.js";
import { METADATA_PROGRAM } from "./programs.js";

export type MetaplexMetadata = {
  updateAuthority: string;
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  mutable: boolean | null;
};

export function decodeMetaplex(owner: string, data: Uint8Array, expectedMint: string): MetaplexMetadata | null {
  if (owner !== METADATA_PROGRAM || data.length < 1 + 32 + 32 + 4) {
    return null;
  }
  const key = data[0];
  if (key !== 4) {
    return null;
  }
  const updateAuthority = encodeBase58(data.subarray(1, 33));
  const mint = encodeBase58(data.subarray(33, 65));
  if (mint !== expectedMint) {
    return null;
  }
  let offset = 65;
  const name = readBorshString(data, offset);
  if (!name) {
    return null;
  }
  offset = name.next;
  const symbol = readBorshString(data, offset);
  if (!symbol) {
    return null;
  }
  offset = symbol.next;
  const uri = readBorshString(data, offset);
  if (!uri) {
    return null;
  }
  offset = uri.next;
  const sellerFee = readU16(data, offset);
  if (sellerFee === null) {
    return {
      updateAuthority,
      mint,
      name: cleanText(name.text),
      symbol: cleanText(symbol.text),
      uri: cleanText(uri.text),
      mutable: null,
    };
  }
  offset += 2;
  if (offset >= data.length) {
    return {
      updateAuthority,
      mint,
      name: cleanText(name.text),
      symbol: cleanText(symbol.text),
      uri: cleanText(uri.text),
      mutable: null,
    };
  }
  const creatorsOption = data[offset];
  offset += 1;
  if (creatorsOption === 1) {
    const count = readU32(data, offset);
    if (count === null) {
      return null;
    }
    offset += 4 + count * 34;
  } else if (creatorsOption !== 0) {
    return null;
  }
  if (offset + 2 > data.length) {
    return {
      updateAuthority,
      mint,
      name: cleanText(name.text),
      symbol: cleanText(symbol.text),
      uri: cleanText(uri.text),
      mutable: null,
    };
  }
  const primary = readBool(data, offset);
  const mutable = readBool(data, offset + 1);
  if (primary === null) {
    return null;
  }
  return {
    updateAuthority,
    mint,
    name: cleanText(name.text),
    symbol: cleanText(symbol.text),
    uri: cleanText(uri.text),
    mutable,
  };
}

export type JsonMetadata = {
  name: string | null;
  symbol: string | null;
  image: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  description: string | null;
};

export function readJsonMetadata(value: unknown): JsonMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const extensions = row.extensions && typeof row.extensions === "object" && !Array.isArray(row.extensions)
    ? (row.extensions as Record<string, unknown>)
    : {};
  return {
    name: asText(row.name),
    symbol: asText(row.symbol),
    image: asText(row.image) ?? asText(row.image_url),
    website: asText(row.website) ?? asText(row.external_url) ?? asText(extensions.website),
    twitter: asText(row.twitter) ?? asText(extensions.twitter),
    telegram: asText(row.telegram) ?? asText(extensions.telegram),
    description: asText(row.description),
  };
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim();
  return text.length > 0 ? text : null;
}
