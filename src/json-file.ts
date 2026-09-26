import { lstatSync, readFileSync } from "node:fs";

export type ReadJsonResult =
  | { ok: true; raw: string; value: unknown }
  | { ok: false; reason: "unreadable" | "invalid" };

export function readStrictJson(filePath: string, maxBytes: number): ReadJsonResult {
  let info;
  try {
    info = lstatSync(filePath);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (info.isSymbolicLink() || !info.isFile() || info.size > maxBytes) {
    return { ok: false, reason: "unreadable" };
  }
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (raw.length > maxBytes) {
    return { ok: false, reason: "unreadable" };
  }
  try {
    return { ok: true, raw, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sameKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const got = Object.keys(value);
  if (got.length !== expected.length) {
    return false;
  }
  const allowed = new Set(expected);
  if (allowed.size !== expected.length) {
    return false;
  }
  return got.every((key) => allowed.has(key));
}
