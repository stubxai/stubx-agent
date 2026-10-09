import type { CardSummary, GlossaryFile, Mission } from "./types.js";
import { checkCount } from "./engine.js";

export type MissionIssue = string;

export function validateMission(mission: Mission, glossary: GlossaryFile, cards: readonly CardSummary[]): MissionIssue[] {
  const issues: MissionIssue[] = [];
  const ids = new Set<string>();
  const glossaryIds = new Set(glossary.entries.map((entry) => entry.id));
  const cardIds = new Set(cards.map((card) => card.mint));
  if (checkCount(mission) !== 5) {
    issues.push("La misión tiene que tener 5 comprobaciones.");
  }
  const comprehension = mission.steps.filter((step) => step.kind === "comprehension");
  if (comprehension.length !== 1 || mission.steps.at(-1)?.kind !== "comprehension") {
    issues.push("La comprensión tiene que ser el último paso, y solo uno.");
  }
  for (const step of mission.steps) {
    if (ids.has(step.id)) {
      issues.push(`Paso repetido: ${step.id}`);
    }
    ids.add(step.id);
    if (!step.options.some((option) => option.id === step.correct)) {
      issues.push(`La respuesta correcta de ${step.id} no está entre las opciones.`);
    }
    for (const option of step.options) {
      if (option.id === step.correct) {
        continue;
      }
      if (!step.whyWrong[option.id]) {
        issues.push(`Falta la explicación de la opción ${option.id} en ${step.id}.`);
      }
    }
    for (const term of step.glossary) {
      if (!glossaryIds.has(term)) {
        issues.push(`El paso ${step.id} enlaza un término que no existe: ${term}`);
      }
    }
    for (const mint of step.cards) {
      if (!cardIds.has(mint)) {
        issues.push(`El paso ${step.id} usa un mint que no está en las fichas: ${mint}`);
      }
    }
    if (step.kind === "comprehension" && step.cards.length !== 0) {
      issues.push("El caso nuevo no debe usar una ficha real.");
    }
  }
  const registry = cards.filter((card) => card.role === "registro");
  if (registry.length !== 1) {
    issues.push("Tiene que haber un solo mint de registro.");
  }
  const first = mission.steps[0];
  const official = registry[0];
  if (first && official) {
    const correct = first.options.find((option) => option.id === first.correct);
    if (correct?.mint !== official.mint) {
      issues.push("La primera comprobación tiene que señalar el mint del registro.");
    }
  }
  return issues;
}
