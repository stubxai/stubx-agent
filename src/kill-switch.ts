import path from "node:path";
import { isRecord, readStrictJson, sameKeys } from "./json-file.js";
import type { KillSwitchState } from "./types.js";

const MAX_BYTES = 4096;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type KillSwitchRead =
  | { ok: true; state: KillSwitchState }
  | { ok: false; reason: "unreadable" | "invalid" };

export function defaultKillSwitchPath(root: string): string {
  return path.join(root, "state", "killswitch.json");
}

function isIsoUtc(value: string): boolean {
  if (!ISO_UTC.test(value)) {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
}

export function readKillSwitch(filePath: string): KillSwitchRead {
  const read = readStrictJson(filePath, MAX_BYTES);
  if (!read.ok) {
    return { ok: false, reason: read.reason };
  }
  const value = read.value;
  if (!isRecord(value) || !sameKeys(value, ["version", "engaged", "since", "reason", "scope"])) {
    return { ok: false, reason: "invalid" };
  }
  if (value.version !== 1 || value.scope !== "ops-social" || typeof value.engaged !== "boolean") {
    return { ok: false, reason: "invalid" };
  }
  if (value.engaged) {
    if (typeof value.since !== "string" || !isIsoUtc(value.since)) {
      return { ok: false, reason: "invalid" };
    }
    if (typeof value.reason !== "string" || value.reason.trim().length === 0) {
      return { ok: false, reason: "invalid" };
    }
    return {
      ok: true,
      state: {
        version: 1,
        engaged: true,
        since: value.since,
        reason: value.reason,
        scope: "ops-social",
      },
    };
  }
  if (value.since !== null || value.reason !== null) {
    return { ok: false, reason: "invalid" };
  }
  return {
    ok: true,
    state: {
      version: 1,
      engaged: false,
      since: null,
      reason: null,
      scope: "ops-social",
    },
  };
}
