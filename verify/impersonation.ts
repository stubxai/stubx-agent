import { extractCid } from "./cid.js";
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

const HOMOGLYPHS: Record<string, string> = {
  "\u0391": "A",
  "\u0392": "B",
  "\u0395": "E",
  "\u0396": "Z",
  "\u0397": "H",
  "\u0399": "I",
  "\u039A": "K",
  "\u039C": "M",
  "\u039D": "N",
  "\u039F": "O",
  "\u03A1": "P",
  "\u03A4": "T",
  "\u03A5": "Y",
  "\u03A3": "S",
  "\u03A7": "X",
  "\u03B1": "a",
  "\u03C3": "s",
  "\u03BF": "o",
  "\u03C4": "t",
  "\u0410": "A",
  "\u0412": "B",
  "\u0415": "E",
  "\u041A": "K",
  "\u041C": "M",
  "\u041D": "H",
  "\u041E": "O",
  "\u0420": "P",
  "\u0421": "S",
  "\u0422": "T",
  "\u0425": "X",
  "\u0430": "a",
  "\u0435": "e",
  "\u043E": "o",
  "\u0440": "p",
  "\u0441": "s",
  "\u0442": "t",
  "\u0445": "x",
  "\u0405": "S",
  "\u0455": "s",
  "\u0406": "I",
  "\u0456": "i",
  "5": "S",
  "8": "B",
  "\uA731": "S",
  "\u1D1B": "T",
  "\u1D1C": "U",
  "\u0299": "B",
  "\u054D": "U",
  "\u057D": "u",
  "\u13DA": "S",
  "\u13A2": "T",
  "\u13F4": "B",
};

export function normalizeToken(value: string): string {
  const folded = value.normalize("NFKC").replace(/[\p{Cc}\p{Cf}\uFFFD]/gu, "");
  let mapped = "";
  for (const char of folded) {
    mapped += HOMOGLYPHS[char] ?? char;
  }
  return mapped.toLowerCase().replace(/[\s.\-_'’]+/g, "");
}

function containsWord(value: string, words: readonly string[]): boolean {
  const text = normalizeToken(value);
  return words.some((word) => {
    const folded = normalizeToken(word);
    if (folded.length === 0) {
      return false;
    }
    return text.includes(folded);
  });
}

export function normalizeHost(hostname: string): string {
  let host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  host = host.replace(/^\.+|\.+$/g, "");
  if (host.startsWith("www.")) {
    host = host.slice(4);
  }
  return host;
}

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    const match = /^https?:\/\/([^/?#]+)/i.exec(value.trim());
    return match?.[1] ?? null;
  }
}

export function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    let host = normalizeHost(url.hostname);
    if (host === "twitter.com" || host.endsWith(".twitter.com") || host === "x.com" || host.endsWith(".x.com")) {
      host = "x.com";
    }
    const path = url.pathname.replace(/\/+$/, "").toLowerCase() || "/";
    return `${host}${path}`;
  } catch {
    const host = hostnameOf(value);
    if (!host) {
      return value.trim().toLowerCase();
    }
    return normalizeHost(host);
  }
}

function editDistance(left: string, right: string): number {
  if (Math.abs(left.length - right.length) > 2) {
    return 3;
  }
  const rows = left.length + 1;
  const cols = right.length + 1;
  const score: number[] = new Array(cols);
  for (let col = 0; col < cols; col += 1) {
    score[col] = col;
  }
  for (let row = 1; row < rows; row += 1) {
    let previous = score[0] ?? 0;
    score[0] = row;
    for (let col = 1; col < cols; col += 1) {
      const current = score[col] ?? 0;
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      const next = Math.min((score[col] ?? 0) + 1, (score[col - 1] ?? 0) + 1, previous + cost);
      previous = current;
      score[col] = next;
    }
  }
  return score[cols - 1] ?? 3;
}

function labelsContain(host: string, expected: string): boolean {
  const hostLabels = host.split(".").filter((label) => label.length > 0);
  const expectedLabels = expected.split(".").filter((label) => label.length > 0);
  if (expectedLabels.length === 0 || hostLabels.length < expectedLabels.length) {
    return false;
  }
  for (let start = 0; start <= hostLabels.length - expectedLabels.length; start += 1) {
    const same = expectedLabels.every((label, index) => hostLabels[start + index] === label);
    if (same) {
      return true;
    }
  }
  return false;
}

function hostClose(host: string, expected: string): boolean {
  if (host === expected || host.endsWith(`.${expected}`) || labelsContain(host, expected)) {
    return true;
  }
  const limit = Math.max(host.length, expected.length) >= 16 ? 2 : 1;
  return editDistance(host, expected) <= limit;
}

function hostMatches(value: string, hosts: ReadonlySet<string>): boolean {
  const raw = hostnameOf(value);
  if (!raw) {
    return false;
  }
  const host = normalizeHost(raw);
  for (const expected of hosts) {
    if (hostClose(host, normalizeHost(expected))) {
      return true;
    }
  }
  return false;
}

function socialHandle(normalized: string): string | null {
  if (!normalized.startsWith("x.com/")) {
    return null;
  }
  const handle = normalized.slice("x.com/".length).split("/")[0] ?? "";
  if (!/^[a-z0-9_]{1,32}$/.test(handle)) {
    return null;
  }
  return handle;
}

function socialMatches(value: string, canonicalLinks: readonly string[]): boolean {
  const got = socialHandle(normalizeUrl(value));
  if (!got) {
    return false;
  }
  return canonicalLinks.some((link) => {
    const expected = socialHandle(normalizeUrl(link));
    if (!expected) {
      return false;
    }
    return got === expected || got.startsWith(expected) || editDistance(got, expected) <= 1;
  });
}
