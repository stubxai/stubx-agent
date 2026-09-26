import { lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function marker(parts: readonly string[]): string {
  return parts.join("");
}

/** Contiguous spellings are assembled at runtime so this file does not contain them. */
export const FORBIDDEN_MARKERS: readonly string[] = [
  marker(["Key", "pair"]),
  marker(["sign", "Transaction"]),
  marker(["send", "Transaction"]),
  marker(["send", "Raw", "Transaction"]),
  marker(["secret", "Key"]),
  marker(["from", "Secret", "Key"]),
  marker(["seed", "Phrase"]),
  marker(["seed", " phrase"]),
  marker(["bs", "58"]),
  marker(["@solana/", "web3.js"]),
  marker(["mainnet-", "beta"]),
  marker(["api.", "mainnet"]),
  marker(["sign", "Message"]),
  marker(["partial", "Sign"]),
  marker(["nacl.", "sign"]),
];

export const FORBIDDEN_PACKAGES: readonly string[] = [
  marker(["@solana/", "web3.js"]),
  marker(["@solana/", "spl-token"]),
  marker(["bs", "58"]),
  marker(["tweet", "nacl"]),
  marker(["bip", "39"]),
  marker(["ed25519-", "hd-key"]),
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"]);

export type Finding = {
  file: string;
  marker: string;
  line: number;
};

export function scanText(file: string, text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    for (const item of FORBIDDEN_MARKERS) {
      if (line.includes(item)) {
        findings.push({ file, marker: item, line: i + 1 });
      }
    }
  }
  return findings;
}

export function scanFile(filePath: string): Finding[] {
  let info;
  try {
    info = lstatSync(filePath);
  } catch {
    return [];
  }
  if (info.isSymbolicLink() || !info.isFile()) {
    return [];
  }
  return scanText(filePath, readFileSync(filePath, "utf8"));
}

export function scanTree(dirPath: string): Finding[] {
  const findings: Finding[] = [];
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return findings;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      findings.push(...scanTree(full));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }
    findings.push(...scanFile(full));
  }
  return findings;
}

export type PackageJsonShape = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export function dependencyFindings(pkg: PackageJsonShape): string[] {
  const names = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];
  const hits: string[] = [];
  for (const name of names) {
    for (const banned of FORBIDDEN_PACKAGES) {
      if (name === banned || name.includes(banned)) {
        hits.push(name);
      }
    }
  }
  return hits;
}
