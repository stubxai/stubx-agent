import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

function marker(parts: readonly string[]): string {
  return parts.join("");
}

export const SIGN_SEND_MARKERS: readonly string[] = [
  marker(["sign", "Transaction"]),
  marker(["send", "Transaction"]),
  marker(["send", "Raw", "Transaction"]),
  marker(["partial", "Sign"]),
  marker(["sign", "Message"]),
  marker(["sign", "All", "Transactions"]),
  marker(["secret", "Key"]),
  marker(["from", "Secret", "Key"]),
  marker(["seed", "Phrase"]),
  marker(["Key", "pair"]),
  marker(["nacl.", "sign"]),
  marker(["@solana/", "web3.js"]),
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"]);

export type ScanFinding = {
  file: string;
  marker: string;
  line: number;
};

export function scanText(file: string, text: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    for (const item of SIGN_SEND_MARKERS) {
      if (line.includes(item)) {
        findings.push({ file, marker: item, line: i + 1 });
      }
    }
  }
  return findings;
}

export function scanVerifyTree(root: string): ScanFinding[] {
  return walk(path.join(root, "verify"));
}

function walk(dirPath: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return findings;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink() || entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "test" || entry.name === "examples") {
        continue;
      }
      findings.push(...walk(full));
      continue;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }
    const info = statSync(full);
    if (!info.isFile()) {
      continue;
    }
    findings.push(...scanText(full, readFileSync(full, "utf8")));
  }
  return findings;
}
