import { readFileSync } from "node:fs";
import path from "node:path";
import { DISCLAIMER, DISCLAIMER_EN, DRAFT_LINE, OFFLINE_LINE, UNKNOWN_LINE } from "../copy.js";
import { loadGlossary, loadMission } from "../mission/load.js";
import type { CardSummary, GlossaryEntry, Localized, Mission, MissionStep } from "../mission/types.js";
import { changelogHeadings, listTestFiles, loadBoard } from "../tablero/collect.js";
import type { BoardFile, TaskRecord, TaskStatus } from "../tablero/collect.js";
import { escapeHtml, renderMarkdown, splitBilingualMarkdown } from "../text.js";

export type PageName = "index" | "verify" | "lab" | "tablero";

const STATUS_LABEL: Record<string, Localized> = {
  verificado: { es: "verificado", en: "verified" },
  inferido: { es: "inferido", en: "inferred" },
  no_disponible: { es: "no disponible", en: "unavailable" },
  no_aplica: { es: "no aplica", en: "not applicable" },
  desconocido: { es: "desconocido", en: "unknown" },
};

const TASK_STATUS: Record<TaskStatus, Localized> = {
  propuesta: { es: "Propuesta", en: "Proposal" },
  en_curso: { es: "En curso", en: "In progress" },
  en_revision: { es: "En revisión", en: "In review" },
  publicada: { es: "Publicada", en: "Published" },
};

const FIELD_LABEL: Record<string, Localized> = {
  name: { es: "Nombre on-chain", en: "On-chain name" },
  mint: { es: "Dirección del mint", en: "Mint address" },
  inRegistry: { es: "En el registro curado", en: "In the curated registry" },
  statement: { es: "Lectura de autenticidad", en: "Authenticity statement" },
  mintAuthority: { es: "Autoridad de emisión", en: "Mint authority" },
  freezeAuthority: { es: "Autoridad de congelación", en: "Freeze authority" },
  metadata: { es: "Metadatos", en: "Metadata" },
  holders: { es: "Muestra de holders", en: "Holder sample" },
  impersonation: { es: "Señal de suplantación", en: "Impersonation signal" },
  curvePresent: { es: "Cuenta de curva", en: "Curve account" },
  curveProgress: { es: "Avance de la curva clásica", en: "Classic curve progress" },
};

const META_LABEL: Record<CardSummary["metadataReading"], Localized> = {
  no_mutables_en_fuentes: { es: "No mutables en las fuentes leídas", en: "Not mutable in the sources read" },
  mutables: { es: "Mutables", en: "Mutable" },
  desconocido: { es: "Desconocido", en: "Unknown" },
};

function both(text: Localized, tag = "span"): string {
  return `<${tag} class="lang es" lang="es">${escapeHtml(text.es)}</${tag}><${tag} class="lang en" lang="en">${escapeHtml(text.en)}</${tag}>`;
}

function statusText(status: string): Localized {
  return STATUS_LABEL[status] ?? STATUS_LABEL.desconocido ?? { es: "desconocido", en: "unknown" };
}

function fact(status: string, value: Localized | null): Localized {
  if (status !== "verificado" && status !== "inferido") {
    return statusText(status);
  }
  const mark = statusText(status);
  if (!value || value.es.length === 0) {
    return mark;
  }
  return { es: `${value.es} · ${mark.es}`, en: `${value.en} · ${mark.en}` };
}

function yn(value: boolean): Localized {
  return value ? { es: "sí", en: "yes" } : { es: "no", en: "no" };
}

export function safeHref(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value.startsWith("https://github.com/stubxai/stubx-agent/")) {
    return value;
  }
  if (/^[a-z0-9./_-]+$/i.test(value) && !value.includes("..")) {
    return value;
  }
  return null;
}

function fieldValue(card: CardSummary, key: string): { value: Localized; note: string | null } {
  switch (key) {
    case "name":
      return { value: fact(card.nameStatus, card.name ? { es: card.name, en: card.name } : null), note: null };
    case "mint":
      return { value: { es: card.mint, en: card.mint }, note: null };
    case "inRegistry":
      return {
        value: fact(card.inRegistryStatus, card.inRegistry === null ? null : yn(card.inRegistry)),
        note: null,
      };
    case "statement":
      return {
        value: fact(card.statementStatus, card.statement ? { es: card.statement, en: card.statement } : null),
        note: null,
      };
    case "mintAuthority":
      return {
        value: fact(card.mintAuthority.status, { es: card.mintAuthority.state, en: card.mintAuthority.state }),
        note: null,
      };
    case "freezeAuthority":
      return {
        value: fact(card.freezeAuthority.status, { es: card.freezeAuthority.state, en: card.freezeAuthority.state }),
        note: null,
      };
    case "metadata":
      return { value: META_LABEL[card.metadataReading], note: null };
    case "holders":
      return { value: fact(card.holdersStatus, null), note: card.holdersNote };
    case "impersonation": {
      if (card.impersonation === null) {
        return { value: statusText("desconocido"), note: null };
      }
      const label = card.impersonation
        ? { es: "Posible suplantación", en: "Possible impersonation" }
        : { es: "Sin esa señal", en: "No such signal" };
      const level = card.authenticityLevel ? ` · ${card.authenticityLevel}` : "";
      return { value: { es: `${label.es}${level}`, en: `${label.en}${level}` }, note: null };
    }
    case "curvePresent":
      return {
        value: fact(card.curvePresentStatus, card.curvePresent === null ? null : yn(card.curvePresent)),
        note: card.curveModuleNote,
      };
    case "curveProgress":
      return {
        value: fact(
          card.curveProgressStatus,
          card.curveProgress ? { es: `${card.curveProgress} %`, en: `${card.curveProgress}%` } : null,
        ),
        note: card.curveProgressNote,
      };
    default:
      return { value: statusText("desconocido"), note: null };
  }
}

export function renderCard(card: CardSummary, fields: readonly string[]): string {
  return `<article class="ficha">${cardInner(card, fields)}</article>`;
}

function cardInner(card: CardSummary, fields: readonly string[]): string {
  const rows = fields
    .map((key) => {
      const label = FIELD_LABEL[key] ?? { es: key, en: key };
      const item = fieldValue(card, key);
      const note = item.note ? `<p class="muted">${escapeHtml(item.note)}</p>` : "";
      return `<dt>${both(label)}</dt><dd>${both(item.value)}${note}</dd>`;
    })
    .join("");
  return `<h3>${escapeHtml(card.name ?? card.mint)}</h3><p class="rol">${both(card.roleNote)}</p><p><code class="mint">${escapeHtml(card.mint)}</code></p><dl>${rows}</dl>`;
}

function asset(prefix: string, file: string): string {
  return `${prefix}assets/${file}`;
}

function pageHref(prefix: string, page: Exclude<PageName, never>): string {
  if (page === "index") {
    return prefix === "" ? "./index.html" : "../index.html";
  }
  return prefix === "" ? `${page}/index.html` : `../${page}/index.html`;
}

function shell(input: { title: string; description: string; prefix: string; current: PageName; main: string; mission?: boolean }): string {
  const nav: Array<{ id: Exclude<PageName, "index">; es: string; en: string }> = [
    { id: "verify", es: "Verify", en: "Verify" },
    { id: "lab", es: "Lab", en: "Lab" },
    { id: "tablero", es: "Tablero", en: "Board" },
  ];
  const links = nav
    .map((item) => {
      const current = item.id === input.current ? ` aria-current="page"` : "";
      return `<li><a href="${pageHref(input.prefix, item.id)}"${current}>${both({ es: item.es, en: item.en })}</a></li>`;
    })
    .join("");
  const mission = input.mission ? `\n<script src="${asset(input.prefix, "mission.js")}"></script>` : "";
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>${escapeHtml(input.title)}</title>
<meta name="description" content="${escapeHtml(input.description)}">
<link rel="stylesheet" href="${asset(input.prefix, "site.css")}">
<script src="${asset(input.prefix, "site.js")}"></script>
</head>
<body>
<a class="skip lang es" href="#contenido">Saltar al contenido</a>
<a class="skip lang en" href="#contenido">Skip to content</a>
<header class="site"><div class="wrap">
<p class="brand"><strong>STUBX</strong></p>
<p class="draft">${both(DRAFT_LINE)}</p>
<nav class="site" aria-label="Secciones / Sections"><ul>${links}</ul></nav>
<div class="langs" role="group" aria-label="Idioma / Language">
<button type="button" data-set-lang="es" lang="es">Español</button>
<button type="button" data-set-lang="en" lang="en">English</button>
</div>
</div></header>
<main id="contenido" class="wrap">
<div class="aviso" data-disclaimer="si">
<p>${escapeHtml(DISCLAIMER)}</p>
<p lang="en">${escapeHtml(DISCLAIMER_EN)}</p>
<p>${both(UNKNOWN_LINE)}</p>
<p>${both({ es: "Fichas fechadas el 2026-10-08 (UTC). No se actualizan solas.", en: "Cards dated 2026-10-08 (UTC). They do not update themselves." })}</p>
</div>
<p id="aviso-red" class="nota" hidden>${both(OFFLINE_LINE)}</p>
<p id="aviso-version" class="nota" hidden>${both({ es: "Hay otra copia de estas páginas. Recargar no borra el progreso local.", en: "Another copy of these pages is available. Reloading does not delete local progress." })} <button type="button" id="recargar">${both({ es: "Recargar", en: "Reload" })}</button></p>
${input.main}
</main>
<footer class="site"><div class="wrap">
<p>${both(OFFLINE_LINE)}</p>
<p>${both({ es: "Borrador 2026-10-09. Sin cuentas, sin firma y sin analítica.", en: "Draft 2026-10-09. No accounts, no signing, and no analytics." })}</p>
</div></footer>${mission}
</body>
</html>
`;
}

function staticStep(step: MissionStep, index: number, checks: number, cards: ReadonlyMap<string, CardSummary>): string {
  const heading =
    step.kind === "check"
      ? { es: `Comprobación ${index + 1} de ${checks}`, en: `Check ${index + 1} of ${checks}` }
      : { es: "Comprobación de comprensión", en: "Comprehension check" };
  const cardHtml = step.cards
    .map((mint) => {
      const card = cards.get(mint);
      return card ? renderCard(card, step.fields) : "";
    })
    .join("");
  const options = step.options
    .map((option) => `<li>${both(option.label)}</li>`)
    .join("");
  const wrong = Object.values(step.whyWrong)
    .map((line) => `<p>${both(line)}</p>`)
    .join("");
  return `<article class="paso"><h3>${both(heading)}</h3><p>${both(step.guide)}</p>${cardHtml}<h4>${both(step.prompt)}</h4><ul>${options}</ul><details><summary>${both({ es: "Explicación", en: "Explanation" })}</summary><p>${both(step.whyRight)}</p>${wrong}</details></article>`;
}

function glossaryArticle(entry: GlossaryEntry): string {
  return `<article id="termino-${escapeHtml(entry.id)}"><h3>${both(entry.term)}</h3><p>${both(entry.means)}</p><p>${both({ es: "Ejemplo. ", en: "Example. " })}${both(entry.example)}</p><p>${both({ es: "No permite concluir: ", en: "It does not let you conclude: " })}${both(entry.doesNotConclude)}</p></article>`;
}

function guideSection(repoRoot: string): string {
  const manifest = JSON.parse(readFileSync(path.join(repoRoot, "lab/library/guides.json"), "utf8")) as {
    guides: Array<{ id: string; file: string; title: Localized }>;
  };
  return manifest.guides
    .map((guide) => {
      const source = readFileSync(path.join(repoRoot, "lab/library/guides", guide.file), "utf8");
      const blocks = splitBilingualMarkdown(source);
      if (!blocks) {
        throw new Error(`La guía ${guide.id} no tiene español e inglés.`);
      }
      return `<article class="guia-texto" id="guia-${escapeHtml(guide.id)}"><h3>${both(guide.title)}</h3><div class="lang es" lang="es">${renderMarkdown(blocks.es)}</div><div class="lang en" lang="en">${renderMarkdown(blocks.en)}</div></article>`;
    })
    .join("");
}

function renderLab(repoRoot: string, cards: readonly CardSummary[], mission: Mission): string {
  const byMint = new Map(cards.map((card) => [card.mint, card]));
  const glossary = loadGlossary(repoRoot);
  const checks = mission.steps.filter((step) => step.kind === "check").length;
  const staticSteps = mission.steps.map((step, index) => staticStep(step, index, checks, byMint)).join("");
  const terms = glossary.entries.map((entry) => glossaryArticle(entry)).join("");
  const revision = JSON.parse(readFileSync(path.join(repoRoot, "lab/library/revision.json"), "utf8")) as { enStatus: string };
  const main = `<h1>${both(mission.title)}</h1>
<div class="guia"><svg class="marca" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="28" height="34" rx="3" fill="none" stroke="#ff2d6f" stroke-width="2"/><path d="M12 18h16M12 26h16M12 34h10" stroke="#f4f7fb" stroke-width="2"/></svg><div><p class="muted">${both({ es: "Guía", en: "Guide" })}</p><p>${both(mission.intro)}</p></div></div>
<div id="mision-app" data-mission="${escapeHtml(mission.id)}"></div>
<div class="estatica" id="mision-estatica"><p class="nota">${both({ es: "Sin JavaScript se pueden leer los pasos, las explicaciones y la biblioteca. El progreso local necesita el script de esta misma carpeta.", en: "Without JavaScript the steps, explanations, and library can still be read. Local progress needs the script in this same folder." })}</p>${staticSteps}</div>
<section id="biblioteca"><h2>${both({ es: "Biblioteca", en: "Library" })}</h2><p class="muted">${escapeHtml(revision.enStatus)}</p><div class="fichas">${terms}</div><h2>${both({ es: "Guías", en: "Guides" })}</h2><div class="fichas">${guideSection(repoRoot)}</div></section>
<dialog id="ayuda" aria-labelledby="ayuda-titulo"><h2 id="ayuda-titulo"></h2><div id="ayuda-cuerpo"></div><form method="dialog"><button type="submit" id="ayuda-cerrar">Cerrar</button></form></dialog>`;
  return shell({
    title: "STUBX Lab · misión 1 · borrador",
    description: "Misión educativa para distinguir un mint del registro de un clon, con fichas del 2026-10-08.",
    prefix: "../",
    current: "lab",
    main,
    mission: true,
  });
}

function renderVerify(cards: readonly CardSummary[], glossaryEntries: readonly GlossaryEntry[]): string {
  const fields = ["name", "mint", "inRegistry", "mintAuthority", "freezeAuthority", "metadata", "holders", "impersonation", "statement", "curvePresent", "curveProgress"];
  const articles = cards
    .map((card) => {
      const meta = `<p class="muted">${escapeHtml(card.createdAt ?? "")} · id ${escapeHtml(card.id ?? "")} · ${card.partial ? "parcial: sí" : "parcial: no"}</p>`;
      return `<article class="ficha" data-mint="${escapeHtml(card.mint)}">${meta}${cardInner(card, fields)}</article>`;
    })
    .join("");
  const help = glossaryEntries
    .filter((entry) =>
      ["direccion", "autoridad-emision", "autoridad-congelacion", "metadatos-mutables", "desconocido", "curva-pump", "suplantacion"].includes(entry.id),
    )
    .map((entry) => glossaryArticle(entry))
    .join("");
  const main = `<h1>${both({ es: "Verify · fichas del 2026-10-08", en: "Verify · cards from 2026-10-08" })}</h1>
<p>${both({ es: "Lectura estática de las fichas guardadas en el repositorio. Esta página no consulta la red, no descarga imágenes y no sustituye al comando verify.", en: "A static reading of the cards stored in the repository. This page does not query the network, does not download images, and does not replace the verify command." })}</p>
<p>${both({ es: "Las cinco fichas son parciales: la muestra de holders quedó en no disponible. Eso no rellena el dato ni anula los campos verificados.", en: "All five cards are partial: the holder sample stayed unavailable. That does not fill the fact in and does not cancel the verified fields." })}</p>
<div class="fichas">${articles}</div>
<section><h2>${both({ es: "Ayuda para leer la ficha", en: "Help for reading a card" })}</h2><div class="fichas">${help}</div></section>`;
  return shell({
    title: "STUBX Verify · borrador",
    description: "Fichas públicas de STUBX Verify del 2026-10-08, en una página estática.",
    prefix: "../",
    current: "verify",
    main,
  });
}

function taskArticle(task: TaskRecord): string {
  const status = TASK_STATUS[task.status];
  const evidence = task.evidence
    .map((item) => {
      const href = safeHref(item.href);
      const where = href
        ? `<a href="${escapeHtml(href)}">${both(item.label)}</a>`
        : `${both(item.label)}${item.path ? ` <code>${escapeHtml(item.path)}</code>` : ""}`;
      return `<li>${where} — ${both(item.note)}</li>`;
    })
    .join("");
  const history = task.history.map((item) => `<li><time datetime="${escapeHtml(item.on)}">${escapeHtml(item.on)}</time> — ${both(item.change)}</li>`).join("");
  const block = task.block ? `<p>${both({ es: "Bloqueo: ", en: "Block: " })}${both(task.block)}</p>` : "";
  const reviewed = task.reviewedOn ?? "—";
  return `<article class="tarea" id="tarea-${escapeHtml(task.id)}" data-status="${escapeHtml(task.status)}" data-web="${task.webPublished ? "si" : "no"}"><h3>${escapeHtml(task.id)} · ${both(task.title)}</h3><p class="estado">${both(status)} · ${both(task.webPublished ? { es: "En stubxai.com: sí", en: "On stubxai.com: yes" } : { es: "En stubxai.com: no", en: "On stubxai.com: no" })}</p><p>${both(task.scope)}</p><dl><dt>${both({ es: "Responsable", en: "Owner" })}</dt><dd>${escapeHtml(task.owner)}</dd><dt>${both({ es: "Revisión", en: "Review" })}</dt><dd>${escapeHtml(task.reviewer)}</dd><dt>${both({ es: "Fecha de revisión del registro", en: "Record review date" })}</dt><dd>${escapeHtml(reviewed)}</dd></dl>${block}<h4>${both({ es: "Evidencia", en: "Evidence" })}</h4>${evidence ? `<ul>${evidence}</ul>` : `<p>${both({ es: "Todavía no hay evidencia de implementación.", en: "There is no implementation evidence yet." })}</p>`}<h4>${both({ es: "Historial", en: "History" })}</h4><ul>${history}</ul></article>`;
}

function renderBoard(repoRoot: string, board: BoardFile): string {
  const changelog = changelogHeadings(readFileSync(path.join(repoRoot, "CHANGELOG.md"), "utf8"));
  const tests = listTestFiles(repoRoot);
  const rows = board.tasks
    .map((task) => {
      const status = TASK_STATUS[task.status];
      return `<tr><th scope="row"><a href="#tarea-${escapeHtml(task.id)}">${escapeHtml(task.id)}</a></th><td>${both(task.title)}</td><td>${both(status)}</td><td>${task.webPublished ? "sí" : "no"}</td></tr>`;
    })
    .join("");
  const runs = board.ci.recordedRuns
    .map((run) => {
      const href = safeHref(run.url);
      const link = href ? `<a href="${escapeHtml(href)}">${escapeHtml(run.subject)}</a>` : escapeHtml(run.subject);
      return `<li>${link} · ${escapeHtml(run.observedOn)} · ${escapeHtml(run.conclusion)} · ${escapeHtml(run.names.join(", "))}. ${both(run.limit)}</li>`;
    })
    .join("");
  const ciHref = safeHref(board.ci.actionsUrl);
  const main = `<h1>${both({ es: "Tablero de construcción", en: "Construction board" })}</h1>
<p>${both(board.note)}</p>
<p class="muted">${both({ es: `Registro ${board.version}, revisado el ${board.updated}. Editor: ${board.editor}`, en: `Record ${board.version}, reviewed on ${board.updated}. Editor: ${board.editor}` })}</p>
<div class="tabla-scroll" tabindex="0"><table><caption>${both({ es: "Tareas de este registro", en: "Tasks in this record" })}</caption><thead><tr><th scope="col">ID</th><th scope="col">${both({ es: "Tarea", en: "Task" })}</th><th scope="col">${both({ es: "Estado", en: "State" })}</th><th scope="col">stubxai.com</th></tr></thead><tbody>${rows}</tbody></table></div>
<p>${both({ es: "Propuesta es una idea. En curso o en revisión es trabajo en el repositorio. Publicada sería una función ya expuesta. Hoy ninguna tarea de este registro está en la web.", en: "Proposal means an idea. In progress or in review means work in the repository. Published would mean a function already exposed. Today no task in this record is on the website." })}</p>
<div class="tareas">${board.tasks.map((task) => taskArticle(task)).join("")}</div>
<section><h2>${both({ es: "Integración continua", en: "Continuous integration" })}</h2><p><code>${escapeHtml(board.ci.workflow)}</code> · Node ${escapeHtml(board.ci.node)}</p><p>${both(board.ci.whatItRuns)}</p><p>${both(board.ci.limit)}</p>${ciHref ? `<p><a href="${escapeHtml(ciHref)}">${both({ es: "Workflow en Actions", en: "Workflow on Actions" })}</a></p>` : ""}<ul>${runs}</ul></section>
<section><h2>${both({ es: "Pruebas en el repositorio", en: "Tests in the repository" })}</h2><ul>${tests.map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join("")}</ul></section>
<section><h2>${both({ es: "Hitos copiados de CHANGELOG.md", en: "Milestones copied from CHANGELOG.md" })}</h2><p class="muted">${both({ es: "Son encabezados del archivo, no compromisos de esta página.", en: "They are headings from the file, not commitments of this page." })}</p><ul>${changelog.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></section>`;
  return shell({
    title: "STUBX · tablero de construcción · borrador",
    description: "Tablero estático del trabajo de STUBX, generado desde el repositorio y no publicado.",
    prefix: "../",
    current: "tablero",
    main,
  });
}

function renderIndex(): string {
  const main = `<h1>${both({ es: "Borradores para la web", en: "Drafts for the website" })}</h1>
<p>${both({ es: "Tres páginas estáticas listas para copiar a stubxai.com cuando haya autorización. No sustituyen las páginas que ya existen.", en: "Three static pages ready to copy onto stubxai.com when there is authorization. They do not replace the pages that already exist." })}</p>
<ul>
<li><a href="./verify/index.html">/verify</a> — ${both({ es: "fichas del 2026-10-08", en: "cards from 2026-10-08" })}</li>
<li><a href="./lab/index.html">/lab</a> — ${both({ es: "misión 1", en: "mission 1" })}</li>
<li><a href="./tablero/index.html">/tablero</a> — ${both({ es: "tablero de construcción", en: "construction board" })}</li>
</ul>`;
  return shell({
    title: "STUBX · borradores sin publicar",
    description: "Índice local de los borradores de Verify, Lab y el tablero.",
    prefix: "",
    current: "index",
    main,
  });
}

export type BuiltPage = { rel: string; body: string };

export function renderPages(repoRoot: string, cards: readonly CardSummary[]): BuiltPage[] {
  const mission = loadMission(repoRoot);
  const glossary = loadGlossary(repoRoot);
  const board = loadBoard(repoRoot);
  return [
    { rel: "site-drafts/index.html", body: renderIndex() },
    { rel: "site-drafts/verify/index.html", body: renderVerify(cards, glossary.entries) },
    { rel: "site-drafts/lab/index.html", body: renderLab(repoRoot, cards, mission) },
    { rel: "site-drafts/tablero/index.html", body: renderBoard(repoRoot, board) },
  ];
}
