import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runKillSwitchDrill } from "./drill.js";
import { defaultKillSwitchPath, readKillSwitch } from "./kill-switch.js";
import {
  ANCHOR_DIR,
  DAILY_NOTE,
  LOG_FILE,
  anchorName,
  buildAnchorText,
  buildPublicLogEntry,
  normalizeCommit,
  parseLogText,
  serializeEntry,
  verifyAnchors,
  verifyLogText,
} from "./public-log.js";
import type { DailyDetail, DrillSnapshot, KillSwitchSnapshot, LogVerification, LogsTree, PublicLogEntry } from "./public-log.js";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function defaultLogsDir(root: string): string {
  return path.join(root, "logs");
}

/** Reads logs/ into memory. Symlinks, nested folders and big files are rejected. */
export function readLogsTree(dir: string): { tree: Map<string, Buffer>; problems: string[] } {
  const tree = new Map<string, Buffer>();
  const problems: string[] = [];
  if (!existsSync(dir)) {
    return { tree, problems };
  }
  const walk = (current: string, rel: string, depth: number) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        problems.push(`enlace simbólico no admitido: ${relPath}`);
      } else if (entry.isDirectory()) {
        if (depth > 0 || entry.name !== ANCHOR_DIR) {
          problems.push(`carpeta no admitida: ${relPath}`);
        } else {
          walk(full, relPath, depth + 1);
        }
      } else if (entry.isFile()) {
        if (lstatSync(full).size > MAX_FILE_BYTES) {
          problems.push(`archivo demasiado grande: ${relPath}`);
        } else {
          tree.set(relPath, readFileSync(full));
        }
      } else {
        problems.push(`tipo de archivo no admitido: ${relPath}`);
      }
    }
  };
  walk(dir, "", 0);
  return { tree, problems };
}

export type TreeVerification = LogVerification & { anchors: number; stamps: number; missingStamps: string[] };

export function verifyLogsTree(tree: LogsTree): TreeVerification {
  const logText = tree.get(LOG_FILE)?.toString("utf8") ?? "";
  const base = verifyLogText(logText);
  const anchors = new Map<string, string>();
  const missingStamps: string[] = [];
  let stamps = 0;
  for (const [p, data] of tree) {
    if (p.startsWith(`${ANCHOR_DIR}/`) && p.endsWith(".txt")) {
      anchors.set(p.slice(ANCHOR_DIR.length + 1), data.toString("utf8"));
      if (!tree.has(`${p}.ots`)) {
        missingStamps.push(p);
      }
    } else if (p.endsWith(".ots")) {
      stamps += 1;
    } else if (p !== LOG_FILE) {
      base.problems.push(`archivo no admitido en logs/: ${p}`);
    }
  }
  const problems = [...base.problems, ...verifyAnchors(logText, anchors)];
  return { ...base, ok: problems.length === 0, problems, anchors: anchors.size, stamps, missingStamps };
}

export type DailyOptions = {
  root: string;
  logsDir?: string;
  killSwitchPath?: string;
  now?: () => string;
  commit?: string | null;
  evidence?: string | null;
};

export type DailyResult =
  | { ok: true; entry: PublicLogEntry; anchor: string }
  | { ok: false; problems: string[] };

function killSwitchSnapshot(filePath: string): KillSwitchSnapshot {
  const read = readKillSwitch(filePath);
  return read.ok ? { readable: true, engaged: read.state.engaged } : { readable: false, engaged: null };
}

/**
 * Appends one real daily entry. The drill only runs if the kill-switch is
 * readable and off; otherwise the entry records that it did not run.
 * Refuses to append to a log that does not verify.
 */
export function appendDailyEntry(options: DailyOptions): DailyResult {
  const now = options.now ?? (() => new Date().toISOString());
  const logsDir = options.logsDir ?? defaultLogsDir(options.root);
  const { tree, problems: readProblems } = readLogsTree(logsDir);
  const current = verifyLogsTree(tree);
  if (readProblems.length > 0 || !current.ok) {
    return { ok: false, problems: [...readProblems, ...current.problems] };
  }
  const commit = normalizeCommit(options.commit ?? null);
  const killSwitch = killSwitchSnapshot(options.killSwitchPath ?? defaultKillSwitchPath(options.root));
  let drill: DrillSnapshot = { ran: false, ok: null, steps: 0, passed: 0 };
  if (killSwitch.readable && killSwitch.engaged === false) {
    const report = runKillSwitchDrill({ root: options.root, commit, now });
    drill = {
      ran: true,
      ok: report.ok,
      steps: report.steps.length,
      passed: report.steps.filter((s) => s.pass).length,
    };
  }
  const detail: DailyDetail = { mode: "prototipo", commit, killSwitch, drill, note: DAILY_NOTE };
  const logText = tree.get(LOG_FILE)?.toString("utf8") ?? "";
  const parsed = parseLogText(logText);
  const prev = parsed.entries[parsed.entries.length - 1] ?? null;
  const ts = now();
  const entry = buildPublicLogEntry({
    seq: parsed.entries.length + 1,
    ts: prev && ts < prev.ts ? prev.ts : ts,
    detail,
    evidence: options.evidence ?? null,
    prevHash: prev ? prev.hash : null,
  });
  const line = serializeEntry(entry);
  const lines = [...parsed.lines, line];
  const nextText = `${lines.join("\n")}\n`;
  const check = verifyLogText(nextText);
  if (!check.ok) {
    return { ok: false, problems: check.problems };
  }
  const anchor = anchorName(entry);
  mkdirSync(path.join(logsDir, ANCHOR_DIR), { recursive: true });
  writeFileSync(path.join(logsDir, LOG_FILE), nextText);
  writeFileSync(path.join(logsDir, ANCHOR_DIR, anchor), buildAnchorText(lines, entry));
  return { ok: true, entry, anchor: `${ANCHOR_DIR}/${anchor}` };
}
