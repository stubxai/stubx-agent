import { extractCid } from "./http.js";
import type { CanonicalToken } from "./types.js";

export type ImpersonationInput = {
  mint: string;
  names: string[];
  symbols: string[];
  imageUris: string[];
  links: string[];
};

export type ImpersonationResult = {
  inRegistry: boolean;
  registryId: string | null;
  signals: string[];
  statement: string;
};

export function compareCanonical(input: ImpersonationInput, registry: readonly CanonicalToken[]): ImpersonationResult {
  const official = registry.find((token) => token.mint === input.mint);
  if (official) {
    const nameDrift = input.names.some((name) => normalizeToken(name) !== normalizeToken(official.name));
    const symbolDrift = input.symbols.some((symbol) => normalizeToken(symbol) !== normalizeToken(official.symbol));
    if ((input.names.length > 0 && nameDrift) || (input.symbols.length > 0 && symbolDrift)) {
      return {
        inRegistry: true,
        registryId: official.id,
        signals: ["mint en el registro", "nombre o símbolo distinto del curado"],
        statement:
          "El mint está en el registro curado, pero el nombre o el símbolo leídos no coinciden con los curados. Conviene comparar la fuente.",
      };
    }
    return {
      inRegistry: true,
      registryId: official.id,
      signals: ["mint en el registro"],
      statement: `El mint coincide con el registro curado (${official.id}). Que esté en el registro no es una auditoría.`,
    };
  }
  const signals: string[] = [];
  for (const token of registry) {
    const words = [token.name, token.symbol].map(normalizeToken).filter((item) => item.length > 0);
    for (const name of input.names) {
      if (containsWord(name, words)) {
        signals.push(`nombre «${name}» incluye ${token.name}/${token.symbol}`);
        break;
      }
    }
    for (const symbol of input.symbols) {
      if (containsWord(symbol, words)) {
        signals.push(`símbolo «${symbol}» incluye ${token.name}/${token.symbol}`);
        break;
      }
    }
    const cids = new Set(token.imageCids.map((cid) => cid.toLowerCase()));
    const images = new Set(token.imageUris.map(normalizeUrl));
    for (const image of input.imageUris) {
      const cid = extractCid(image);
      if ((cid && cids.has(cid.toLowerCase())) || images.has(normalizeUrl(image))) {
        signals.push("la imagen coincide con la del registro");
        break;
      }
    }
    const hosts = new Set(token.webHosts.map((host) => host.toLowerCase()));
    const links = new Set(token.links.map(normalizeUrl));
    for (const link of input.links) {
      const normalized = normalizeUrl(link);
      if (links.has(normalized) || hostMatches(link, hosts) || socialMatches(link, token.links)) {
        signals.push(`enlace «${link}» coincide con un enlace u host del registro`);
        break;
      }
    }
  }
  if (signals.length > 0) {
    return {
      inRegistry: false,
      registryId: null,
      signals,
      statement:
        "Posible suplantación: el nombre, el símbolo, la imagen o un enlace coinciden con un token del registro curado, pero el mint es otro. La coincidencia no atribuye intención.",
    };
  }
  return {
    inRegistry: false,
    registryId: null,
    signals: [],
    statement: "Este mint no está en el registro curado. Que no esté no significa que sea falso ni que sea una copia.",
  };
}

function normalizeToken(value: string): string {
  return value.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function containsWord(value: string, words: readonly string[]): boolean {
  const text = normalizeToken(value);
  return words.some((word) => {
    if (text === word) {
      return true;
    }
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}([^a-z0-9]|$)`, "i");
    return pattern.test(text);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    let host = url.hostname.toLowerCase();
    if (host === "twitter.com") {
      host = "x.com";
    }
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function hostMatches(value: string, hosts: ReadonlySet<string>): boolean {
  try {
    const url = new URL(value);
    let host = url.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return hosts.has(host);
  } catch {
    return false;
  }
}

function socialMatches(value: string, canonicalLinks: readonly string[]): boolean {
  const got = normalizeUrl(value);
  return canonicalLinks.some((link) => {
    const expected = normalizeUrl(link);
    if (!expected.startsWith("x.com/")) {
      return false;
    }
    return got === expected || got.startsWith(`${expected}/`);
  });
}
