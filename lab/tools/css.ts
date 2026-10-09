import { PALETTE } from "../theme.js";

export function renderCss(): string {
  const p = PALETTE;
  return `:root {
  color-scheme: dark;
  --bg: ${p.bg};
  --bg-elev: ${p.bgElev};
  --text: ${p.text};
  --muted: ${p.muted};
  --accent: ${p.accent};
  --accent-ink: ${p.accentInk};
  --line: ${p.line};
  --ok: ${p.ok};
  --attention: ${p.attention};
  --risk: ${p.risk};
  --space: 1rem;
  --measure: 72rem;
}
*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); color: var(--text); }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif;
  font-size: 1.0625rem;
  line-height: 1.55;
  background: var(--bg);
  color: var(--text);
}
a { color: var(--text); }
a:hover { color: var(--accent); }
:focus { outline: none; }
:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}
@media (forced-colors: active) {
  :focus-visible { outline: 3px solid Highlight; }
}
.skip {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  transform: translateY(-160%);
  background: var(--accent);
  color: var(--accent-ink);
  padding: 0.55rem 0.8rem;
  z-index: 5;
  text-decoration: none;
}
.skip:focus { transform: none; }
.wrap { max-width: var(--measure); margin: 0 auto; padding: 1.25rem; }
header.site {
  border-bottom: 4px solid var(--accent);
  background: var(--bg-elev);
}
.brand { margin: 0; font-size: 1rem; letter-spacing: 0.04em; }
.brand strong { font-size: 1.35rem; letter-spacing: 0; }
.draft {
  margin: 0.35rem 0 0;
  color: var(--muted);
}
nav.site ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0.8rem 0 0;
  margin: 0;
}
nav.site a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--line);
  text-decoration: none;
  background: var(--bg);
}
nav.site a[aria-current="page"] {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
}
.langs { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.8rem; }
.langs button, button, summary {
  font: inherit;
  color: var(--accent-ink);
  background: var(--accent);
  border: 0;
  min-height: 44px;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
}
button.secondary, .langs button[aria-pressed="false"] {
  color: var(--text);
  background: transparent;
  border: 1px solid var(--line);
}
.aviso, .nota {
  border-left: 4px solid var(--accent);
  background: var(--bg-elev);
  padding: 0.9rem 1rem;
  margin: 1rem 0;
}
.aviso p, .nota p { margin: 0.35rem 0; }
h1 { font-size: 1.8rem; line-height: 1.25; margin: 0.5rem 0 0.8rem; }
h2 { font-size: 1.35rem; line-height: 1.3; }
h3 { font-size: 1.1rem; }
.guia {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: start;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  padding: 0.8rem;
  margin: 0.8rem 0;
}
.marca { width: 2.5rem; height: 2.5rem; }
.fichas, .tareas { display: grid; gap: 0.8rem; }
.ficha, .tarea, .glosario article, .guia-texto {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  padding: 0.9rem 1rem;
}
.rol, .muted, footer { color: var(--muted); }
dl { margin: 0.4rem 0; }
dt { font-weight: 650; margin-top: 0.55rem; }
dd { margin: 0.15rem 0 0; }
code, .mint {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
  word-break: break-all;
}
.opciones { display: grid; gap: 0.5rem; margin: 0.8rem 0; }
.opciones button { text-align: left; color: var(--text); background: var(--bg); border: 1px solid var(--line); }
.opciones button[aria-pressed="true"] { border-color: var(--accent); }
.pasos { display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; padding: 0; margin: 0.5rem 0 1rem; }
.pasos button[aria-current="step"] { background: var(--accent); color: var(--accent-ink); }
.estado { font-weight: 650; }
.tabla-scroll { overflow-x: auto; border: 1px solid var(--line); }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.55rem 0.7rem; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--text); }
caption { text-align: left; padding: 0.6rem 0.7rem; font-weight: 650; }
footer.site { border-top: 1px solid var(--line); margin-top: 2rem; padding-top: 1rem; }
dialog {
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--line);
  max-width: 40rem;
  width: calc(100% - 2rem);
  padding: 1rem;
}
dialog::backdrop { background: rgba(0, 0, 0, 0.72); }
html[data-lang="es"] .lang.en { display: none; }
html[data-lang="en"] .lang.es { display: none; }
html.js .estatica { display: none; }
#mision-app:empty { display: none; }
.feedback { border: 1px solid var(--line); padding: 0.8rem; margin: 0.8rem 0; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
@media (max-width: 40rem) {
  h1 { font-size: 1.45rem; }
  .wrap { padding: 0.9rem; }
}
`;
}
