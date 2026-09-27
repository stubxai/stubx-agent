import { LOG_FILE, REPO_SLUG, parseLogText } from "./public-log.js";
import type { LogsTree } from "./public-log.js";
import { verifyLogsTree } from "./public-log-files.js";

/** Minimum number of distinct UTC days with workflow entries (see LOGS.md). */
export const REQUIRED_DAYS = 7;

const WORKFLOW_RUN = new RegExp(`^https://github\\.com/${REPO_SLUG.replace("/", "\\/")}/actions/runs/[1-9][0-9]{0,19}$`);

export const MANUAL_CHECKS = [
  "Comprobar en el historial de Git que esas entradas las hizo github-actions[bot] desde el workflow daily-log en main.",
  "Confirmar a mano al menos un sello de OpenTimestamps (ots verify u opentimestamps.org).",
  "Revisión, incluido el OK legal.",
] as const;

export type LogsStatus = {
  ok: boolean;
  problems: string[];
  box: "pending";
  entries: number;
  workflowEntries: number;
  days: string[];
  distinctDays: number;
  requiredDays: number;
  daysCriterionMet: boolean;
  stamps: number;
  manualChecks: readonly string[];
  note: string;
};

/**
 * Read-only summary of the automatic part of the PPM «Logs» criteria.
 * It never marks the box: `box` is always "pending". Counting only uses
 * entries whose `evidence` links to an Actions run of the official repo.
 */
export function logsStatus(tree: LogsTree): LogsStatus {
  const verification = verifyLogsTree(tree);
  const parsed = parseLogText(tree.get(LOG_FILE)?.toString("utf8") ?? "");
  const entries = verification.ok ? parsed.entries : [];
  const fromWorkflow = entries.filter((e) => typeof e.evidence === "string" && WORKFLOW_RUN.test(e.evidence));
  const days = [...new Set(fromWorkflow.map((e) => e.ts.slice(0, 10)))].sort();
  return {
    ok: verification.ok,
    problems: verification.problems,
    box: "pending",
    entries: verification.entries,
    workflowEntries: fromWorkflow.length,
    days,
    distinctDays: days.length,
    requiredDays: REQUIRED_DAYS,
    daysCriterionMet: verification.ok && days.length >= REQUIRED_DAYS,
    stamps: verification.stamps,
    manualChecks: MANUAL_CHECKS,
    note: "Este comando no marca la casilla «Logs»: solo cuenta días. El resto de condiciones se comprueba a mano (ver LOGS.md).",
  };
}
