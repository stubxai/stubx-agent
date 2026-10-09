import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Localized } from "../mission/types.js";

export type TaskStatus = "propuesta" | "en_curso" | "en_revision" | "publicada";

export type Evidence = {
  label: Localized;
  href?: string;
  path?: string;
  note: Localized;
};

export type HistoryEntry = {
  on: string;
  change: Localized;
};

export type TaskRecord = {
  id: string;
  version: string;
  title: Localized;
  status: TaskStatus;
  webPublished: boolean;
  scope: Localized;
  owner: string;
  reviewer: string;
  reviewedOn: string | null;
  block: Localized | null;
  evidence: Evidence[];
  history: HistoryEntry[];
};

export type RecordedRun = {
  subject: string;
  observedOn: string;
  conclusion: string;
  url: string;
  names: string[];
  limit: Localized;
};

export type BoardFile = {
  version: string;
  updated: string;
  editor: string;
  note: Localized;
  ci: {
    workflow: string;
    node: string;
    actionsUrl: string;
    whatItRuns: Localized;
    limit: Localized;
    recordedRuns: RecordedRun[];
  };
  tasks: TaskRecord[];
};

const STATUSES = new Set<TaskStatus>(["propuesta", "en_curso", "en_revision", "publicada"]);

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function localized(value: unknown): Localized | null {
  const row = record(value);
  const es = text(row?.es);
  const en = text(row?.en);
  return es && en ? { es, en } : null;
}

export function loadBoard(repoRoot: string): BoardFile {
  const raw = JSON.parse(readFileSync(path.join(repoRoot, "lab/tablero/registros.json"), "utf8")) as unknown;
  const row = record(raw);
  const note = localized(row?.note);
  const ci = record(row?.ci);
  const whatItRuns = localized(ci?.whatItRuns);
  const limit = localized(ci?.limit);
  if (!row || !text(row.version) || !text(row.updated) || !text(row.editor) || !note || !ci || !whatItRuns || !limit) {
    throw new Error("registros.json está incompleto.");
  }
  if (!text(ci.workflow) || !text(ci.node) || !text(ci.actionsUrl) || !Array.isArray(ci.recordedRuns) || !Array.isArray(row.tasks)) {
    throw new Error("registros.json no trae la CI o las tareas.");
  }
  const recordedRuns: RecordedRun[] = [];
  for (const item of ci.recordedRuns) {
    const run = record(item);
    const runLimit = localized(run?.limit);
    if (!run || !text(run.subject) || !text(run.observedOn) || !text(run.conclusion) || !text(run.url) || !Array.isArray(run.names) || !runLimit) {
      throw new Error("Una ejecución registrada está incompleta.");
    }
    recordedRuns.push({
      subject: text(run.subject) ?? "",
      observedOn: text(run.observedOn) ?? "",
      conclusion: text(run.conclusion) ?? "",
      url: text(run.url) ?? "",
      names: run.names.filter((name): name is string => typeof name === "string"),
      limit: runLimit,
    });
  }
  const tasks: TaskRecord[] = [];
  for (const item of row.tasks) {
    const task = record(item);
    const title = localized(task?.title);
    const scope = localized(task?.scope);
    const status = text(task?.status);
    if (!task || !text(task.id) || !text(task.version) || !title || !scope || !status || !STATUSES.has(status as TaskStatus)) {
      throw new Error("Una tarea del tablero está incompleta.");
    }
    if (typeof task.webPublished !== "boolean" || !text(task.owner) || !text(task.reviewer)) {
      throw new Error(`La tarea ${text(task.id)} no tiene responsable o publicación.`);
    }
    if (!Array.isArray(task.evidence) || !Array.isArray(task.history)) {
      throw new Error(`La tarea ${text(task.id)} no tiene evidencias o historial.`);
    }
    const evidence: Evidence[] = [];
    for (const piece of task.evidence) {
      const body = record(piece);
      const label = localized(body?.label);
      const evidenceNote = localized(body?.note);
      if (!body || !label || !evidenceNote) {
        throw new Error(`Falta una evidencia en ${text(task.id)}.`);
      }
      evidence.push({
        label,
        note: evidenceNote,
        ...(text(body.href) ? { href: text(body.href) ?? undefined } : {}),
        ...(text(body.path) ? { path: text(body.path) ?? undefined } : {}),
      });
    }
    const history: HistoryEntry[] = [];
    for (const piece of task.history) {
      const body = record(piece);
      const change = localized(body?.change);
      if (!body || !text(body.on) || !change) {
        throw new Error(`Falta un cambio de historial en ${text(task.id)}.`);
      }
      history.push({ on: text(body.on) ?? "", change });
    }
    tasks.push({
      id: text(task.id) ?? "",
      version: text(task.version) ?? "",
      title,
      status: status as TaskStatus,
      webPublished: task.webPublished,
      scope,
      owner: text(task.owner) ?? "",
      reviewer: text(task.reviewer) ?? "",
      reviewedOn: text(task.reviewedOn),
      block: localized(task.block),
      evidence,
      history,
    });
  }
  return {
    version: text(row.version) ?? "",
    updated: text(row.updated) ?? "",
    editor: text(row.editor) ?? "",
    note,
    ci: {
      workflow: text(ci.workflow) ?? "",
      node: text(ci.node) ?? "",
      actionsUrl: text(ci.actionsUrl) ?? "",
      whatItRuns,
      limit,
      recordedRuns,
    },
    tasks,
  };
}

export function changelogHeadings(markdown: string): string[] {
  return markdown.split(/\r?\n/).flatMap((line) => (line.startsWith("## ") ? [line.slice(3).trim()] : []));
}

export function listTestFiles(repoRoot: string): string[] {
  const roots = ["test", "verify/test", "lab/test"];
  const found: string[] = [];
  const walk = (dir: string, rel: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const nextRel = `${rel}/${entry.name}`;
      const next = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(next, nextRel);
      } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
        found.push(nextRel);
      }
    }
  };
  for (const rel of roots) {
    walk(path.join(repoRoot, rel), rel);
  }
  return found.sort();
}
