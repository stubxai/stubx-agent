import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { repoRootFromMeta } from "../paths.js";
import { loadCards, loadFuentes, loadGlossary, loadMission } from "../mission/load.js";
import { validateMission } from "../mission/validate.js";
import { renderCss } from "./css.js";
import { bundleMission } from "./bundle.js";
import { renderPages } from "./render.js";
import type { BuiltPage } from "./render.js";

export function buildOutputs(repoRoot: string): BuiltPage[] {
  const fuentes = loadFuentes(repoRoot);
  const cards = loadCards(repoRoot, fuentes);
  const mission = loadMission(repoRoot);
  const glossary = loadGlossary(repoRoot);
  const issues = validateMission(mission, glossary, cards);
  if (issues.length > 0) {
    throw new Error(issues.join("\n"));
  }
  const enginePath = path.join(repoRoot, "dist/lab/mission/engine.js");
  const uiPath = path.join(repoRoot, "lab/client/ui.js");
  const byMint: Record<string, (typeof cards)[number]> = {};
  for (const card of cards) {
    byMint[card.mint] = card;
  }
  const missionJs = bundleMission(readFileSync(enginePath, "utf8"), readFileSync(uiPath, "utf8"), {
    mission,
    cards: byMint,
    glossary: glossary.entries,
    cardDate: mission.cardDate,
  });
  return [
    { rel: "site-drafts/assets/site.css", body: renderCss() },
    { rel: "site-drafts/assets/mission.js", body: missionJs },
    ...renderPages(repoRoot, cards),
  ];
}

export function pagesDiffer(repoRoot: string, pages: readonly BuiltPage[]): string[] {
  const diffs: string[] = [];
  for (const page of pages) {
    const file = path.join(repoRoot, page.rel);
    let current = "";
    try {
      current = readFileSync(file, "utf8");
    } catch {
      diffs.push(page.rel);
      continue;
    }
    if (current !== page.body) {
      diffs.push(page.rel);
    }
  }
  return diffs;
}

function writePages(repoRoot: string, pages: readonly BuiltPage[]): void {
  for (const page of pages) {
    const file = path.join(repoRoot, page.rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, page.body);
  }
}

function main(): void {
  const repoRoot = repoRootFromMeta(import.meta.url);
  const pages = buildOutputs(repoRoot);
  const check = process.argv.includes("--check");
  if (check) {
    const diffs = pagesDiffer(repoRoot, pages);
    if (diffs.length > 0) {
      process.stderr.write(`Borradores desactualizados:\n${diffs.join("\n")}\n`);
      process.exitCode = 1;
    }
    return;
  }
  writePages(repoRoot, pages);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main();
}
