import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  AuthorityFact,
  CardRole,
  CardSummary,
  FieldStatus,
  GlossaryFile,
  Localized,
  Mission,
  MissionStep,
} from "./types.js";

const STATUSES = new Set<FieldStatus>(["verificado", "inferido", "no_disponible", "no_aplica", "desconocido"]);

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function flag(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function statusOf(value: unknown): FieldStatus {
  return typeof value === "string" && STATUSES.has(value as FieldStatus) ? (value as FieldStatus) : "desconocido";
}

function readField(value: unknown): { value: unknown; status: FieldStatus; note: string | null } {
  const row = record(value);
  if (!row) {
    return { value: null, status: "desconocido", note: null };
  }
  return { value: "value" in row ? row.value : null, status: statusOf(row.status), note: text(row.note) };
}

function authority(value: unknown): AuthorityFact {
  const field = readField(value);
  if (field.status !== "verificado" && field.status !== "inferido") {
    return { state: "desconocido", status: field.status };
  }
  const body = record(field.value);
  const state = text(body?.state);
  if (state === "activa" || state === "revocada" || state === "no_decodificable") {
    return { state, status: field.status };
  }
  return { state: "desconocido", status: "desconocido" };
}

export function shownFact(status: string, value: string | null): string {
  if (status === "no_disponible") {
    return "no_disponible";
  }
  if (status === "no_aplica") {
    return "no_aplica";
  }
  if (status !== "verificado" && status !== "inferido") {
    return "desconocido";
  }
  if (value === null || value === "") {
    return "desconocido";
  }
  return value;
}

export function summarizeReport(raw: unknown, role: CardRole, roleNote: Localized): CardSummary {
  const row = record(raw);
  if (!row || text(row.tool) !== "stubx-verify" || !text(row.mint)) {
    throw new Error("La ficha no es un informe de STUBX Verify.");
  }
  const identity = record(row.identity);
  const permissions = record(row.permissions);
  const distribution = record(row.distribution);
  const market = record(row.market);
  const authenticity = record(row.authenticity);
  const findings = Array.isArray(row.findings) ? row.findings : [];
  const findingRows = findings.flatMap((item) => {
    const found = record(item);
    const id = text(found?.id);
    const level = text(found?.level);
    const title = text(found?.title);
    return id && level && title ? [{ id, level, title }] : [];
  });
  const metadata = findingRows.find((item) => item.id === "metadata-mutability");
  const authenticityFinding = findingRows.find((item) => item.id === "authenticity");
  let metadataReading: CardSummary["metadataReading"] = "desconocido";
  if (metadata?.level === "ok") {
    metadataReading = "no_mutables_en_fuentes";
  } else if (metadata && (metadata.level === "atención" || metadata.level === "riesgo")) {
    metadataReading = "mutables";
  }
  const nameField = readField(identity?.onChainName);
  const registryField = readField(authenticity?.inRegistry);
  const holders = readField(distribution?.sample);
  const present = readField(market?.present);
  const progress = readField(market?.progressPercent);
  const statement = readField(authenticity?.statement);
  const signalsField = readField(authenticity?.signals);
  const signals = Array.isArray(signalsField.value)
    ? signalsField.value.filter((item): item is string => typeof item === "string")
    : [];
  const impersonation =
    authenticityFinding === undefined ? null : authenticityFinding.level === "riesgo";
  return {
    mint: text(row.mint) ?? "",
    role,
    roleNote,
    id: text(row.id),
    createdAt: text(row.createdAt),
    partial: flag(row.partial),
    referenceSlot: typeof row.referenceSlot === "number" ? row.referenceSlot : null,
    name: nameField.status === "verificado" || nameField.status === "inferido" ? text(nameField.value) : null,
    nameStatus: nameField.status,
    symbol: text(readField(identity?.onChainSymbol).value),
    inRegistry: flag(registryField.value),
    inRegistryStatus: registryField.status,
    mintAuthority: authority(permissions?.mintAuthority),
    freezeAuthority: authority(permissions?.freezeAuthority),
    metadataReading,
    metadataLevel: metadata?.level ?? null,
    holdersStatus: holders.status,
    holdersNote: holders.note,
    impersonation,
    authenticityLevel: authenticityFinding?.level ?? null,
    signals,
    statement: text(statement.value),
    statementStatus: statement.status,
    curvePresent: flag(present.value),
    curvePresentStatus: present.status,
    curveProgress: text(progress.value),
    curveProgressStatus: progress.status,
    curveProgressNote: progress.note,
    curveModuleNote: readField(market?.module).note,
    rulesVersion: text(row.rulesVersion),
  };
}

export type FuenteCard = {
  mint: string;
  role: CardRole;
  roleNote: Localized;
};

export type Fuentes = {
  date: string;
  directory: string;
  readme: string;
  cards: FuenteCard[];
};

export function loadJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

export function loadFuentes(repoRoot: string): Fuentes {
  const raw = record(loadJson(path.join(repoRoot, "lab/mission/fuentes.json")));
  if (!raw || !Array.isArray(raw.cards) || text(raw.date) === null || text(raw.directory) === null) {
    throw new Error("fuentes.json no tiene la forma esperada.");
  }
  const cards: FuenteCard[] = [];
  for (const item of raw.cards) {
    const row = record(item);
    const note = record(row?.roleNote);
    const role = text(row?.role);
    if (!row || !text(row.mint) || (role !== "registro" && role !== "clon" && role !== "contraste")) {
      throw new Error("Una ficha de fuentes.json está incompleta.");
    }
    if (!text(note?.es) || !text(note?.en)) {
      throw new Error("Falta el rótulo bilingüe de una ficha.");
    }
    cards.push({
      mint: text(row.mint) ?? "",
      role,
      roleNote: { es: text(note?.es) ?? "", en: text(note?.en) ?? "" },
    });
  }
  return {
    date: text(raw.date) ?? "",
    directory: text(raw.directory) ?? "",
    readme: text(raw.readme) ?? "",
    cards,
  };
}

export function loadCards(repoRoot: string, fuentes: Fuentes): CardSummary[] {
  return fuentes.cards.map((card) => {
    const file = path.join(repoRoot, fuentes.directory, `${card.mint}.json`);
    const summary = summarizeReport(loadJson(file), card.role, card.roleNote);
    if (summary.mint !== card.mint) {
      throw new Error(`La ficha ${file} no corresponde al mint esperado.`);
    }
    return summary;
  });
}

function localized(value: unknown): Localized | null {
  const row = record(value);
  const es = text(row?.es);
  const en = text(row?.en);
  return es && en ? { es, en } : null;
}

function isStep(value: unknown): MissionStep | null {
  const row = record(value);
  const prompt = localized(row?.prompt);
  const guide = localized(row?.guide);
  const whyRight = localized(row?.whyRight);
  const id = text(row?.id);
  const kind = text(row?.kind);
  const correct = text(row?.correct);
  if (!row || !id || (kind !== "check" && kind !== "comprehension") || !prompt || !guide || !whyRight || !correct) {
    return null;
  }
  if (!Array.isArray(row.glossary) || !Array.isArray(row.cards) || !Array.isArray(row.fields) || !Array.isArray(row.options)) {
    return null;
  }
  const whyWrongRaw = record(row.whyWrong);
  if (!whyWrongRaw) {
    return null;
  }
  const whyWrong: Record<string, Localized> = {};
  for (const [key, item] of Object.entries(whyWrongRaw)) {
    const line = localized(item);
    if (!line) {
      return null;
    }
    whyWrong[key] = line;
  }
  const options = [];
  for (const item of row.options) {
    const option = record(item);
    const label = localized(option?.label);
    const optionId = text(option?.id);
    if (!option || !optionId || !label) {
      return null;
    }
    options.push({
      id: optionId,
      label,
      ...(text(option.mint) ? { mint: text(option.mint) ?? undefined } : {}),
    });
  }
  return {
    id,
    kind,
    glossary: row.glossary.filter((item): item is string => typeof item === "string"),
    cards: row.cards.filter((item): item is string => typeof item === "string"),
    fields: row.fields.filter((item): item is string => typeof item === "string"),
    prompt,
    guide,
    options,
    correct,
    whyRight,
    whyWrong,
  };
}

export function loadMission(repoRoot: string): Mission {
  const raw = record(loadJson(path.join(repoRoot, "lab/mission/mision-01.json")));
  const title = localized(raw?.title);
  const intro = localized(raw?.intro);
  const closing = localized(raw?.closing);
  if (!raw || !text(raw.id) || !text(raw.version) || !text(raw.updated) || !text(raw.cardDate) || !title || !intro || !closing) {
    throw new Error("mision-01.json está incompleta.");
  }
  if (!Array.isArray(raw.steps)) {
    throw new Error("La misión no tiene pasos.");
  }
  const steps: MissionStep[] = [];
  for (const item of raw.steps) {
    const step = isStep(item);
    if (!step) {
      throw new Error("Un paso de la misión está incompleto.");
    }
    steps.push(step);
  }
  return {
    id: text(raw.id) ?? "",
    version: text(raw.version) ?? "",
    updated: text(raw.updated) ?? "",
    cardDate: text(raw.cardDate) ?? "",
    title,
    intro,
    closing,
    steps,
  };
}

export function loadGlossary(repoRoot: string): GlossaryFile {
  const raw = record(loadJson(path.join(repoRoot, "lab/library/glossary.json")));
  if (!raw || !text(raw.version) || !text(raw.updated) || raw.sourceLanguage !== "es" || !Array.isArray(raw.entries)) {
    throw new Error("glossary.json está incompleto.");
  }
  const entries = [];
  for (const item of raw.entries) {
    const row = record(item);
    const term = localized(row?.term);
    const means = localized(row?.means);
    const example = localized(row?.example);
    const doesNotConclude = localized(row?.doesNotConclude);
    if (!row || !text(row.id) || !term || !means || !example || !doesNotConclude) {
      throw new Error("Una entrada del glosario está incompleta.");
    }
    entries.push({
      id: text(row.id) ?? "",
      term,
      means,
      example,
      doesNotConclude,
    });
  }
  return { version: text(raw.version) ?? "", updated: text(raw.updated) ?? "", sourceLanguage: "es", entries };
}
