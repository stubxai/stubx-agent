import catalog from "./catalog.json" with { type: "json" };
import templates from "./templates.json" with { type: "json" };
import { BRAND, FOOTER, PNG_COMMENT } from "./lib/copy.mjs";
import { clearDraft, clipDraftText, loadDraft, saveDraft } from "./lib/draft.mjs";
import { analyze, exportAllowed } from "./lib/filter.mjs";
import { DEFAULT_TOKEN, TOKEN_MAX, clipToken, readLogoPng } from "./lib/logo.mjs";
import { decodePng, injectComment } from "./lib/png.mjs";
import { renderCard } from "./lib/render.mjs";

const titleInput = document.getElementById("titulo");
const bodyInput = document.getElementById("cuerpo");
const tokenInput = document.getElementById("token");
const canvas = document.getElementById("vista");
const download = document.getElementById("descargar");
const share = document.getElementById("compartir");
const clearButton = document.getElementById("borrar");
const blockNotice = document.getElementById("aviso-bloqueo");
const fitNotice = document.getElementById("aviso-cabe");
const detail = document.getElementById("aviso-detalle");
const loadNotice = document.getElementById("aviso-carga");
const titleCount = document.getElementById("contador-titulo");
const bodyCount = document.getElementById("contador-cuerpo");
const tokenCount = document.getElementById("contador-token");
const logoInput = document.getElementById("logo");
const logoClear = document.getElementById("quitar-logo");
const logoNotice = document.getElementById("aviso-logo");
const logoState = document.getElementById("logo-estado");
const userLive = document.getElementById("vista-usuario");
const bgBox = document.getElementById("opcion-fondo");
const avatarBox = document.getElementById("avatares");

const backgrounds = catalog.items.filter((item) => item.tipo === "fondo" && item.permitido);
const avatars = catalog.items.filter((item) => item.tipo === "avatar" && item.permitido);
const images = new Map();
let templateId = "aprendizaje";
let formatId = "square";
let backgroundId = backgrounds[0]?.id ?? "";
let avatarId = avatars[0]?.id ?? "";
let customLogo = null;
let dirty = false;
let timer = 0;
let latest = null;

function lang() {
  return document.documentElement.lang === "en" ? "en" : "es";
}

function template() {
  return templates.templates.find((item) => item.id === templateId) ?? templates.templates[0];
}

function format() {
  return templates.formats.find((item) => item.id === formatId) ?? templates.formats[0];
}

function background() {
  return backgrounds.find((item) => item.id === backgroundId) ?? backgrounds[0];
}

function avatarItem() {
  return avatars.find((item) => item.id === avatarId) ?? null;
}

function limits() {
  return template().limits ?? templates.limits;
}

function applyTemplate(id, code, keepText) {
  templateId = id;
  const item = template();
  const max = limits();
  titleInput.maxLength = max.title;
  bodyInput.maxLength = max.body;
  if (!keepText) {
    titleInput.value = item.title[code];
    bodyInput.value = item.body[code];
    dirty = false;
  }
  document.querySelectorAll("[data-template]").forEach((button) => {
    button.setAttribute("aria-pressed", button.getAttribute("data-template") === id ? "true" : "false");
  });
}

function paintChoices() {
  const code = lang();
  bgBox.replaceChildren();
  for (const item of backgrounds) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.nombre[code];
    button.setAttribute("aria-pressed", item.id === backgroundId ? "true" : "false");
    button.addEventListener("click", () => {
      backgroundId = item.id;
      paintChoices();
      schedule();
    });
    bgBox.append(button);
  }
  avatarBox.replaceChildren();
  if (customLogo) {
    const own = document.createElement("button");
    own.type = "button";
    own.textContent = code === "en" ? "Your logo" : "Tu logo";
    own.setAttribute("aria-pressed", "true");
    avatarBox.append(own);
  }
  const none = document.createElement("button");
  none.type = "button";
  none.textContent = code === "en" ? "No character" : "Sin personaje";
  none.setAttribute("aria-pressed", !customLogo && !avatarId ? "true" : "false");
  none.addEventListener("click", () => {
    avatarId = "";
    customLogo = null;
    logoInput.value = "";
    paintChoices();
    schedule();
  });
  avatarBox.append(none);
  for (const item of avatars) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.nombre[code];
    button.setAttribute("aria-pressed", !customLogo && item.id === avatarId ? "true" : "false");
    button.addEventListener("click", () => {
      avatarId = item.id;
      customLogo = null;
      logoInput.value = "";
      paintChoices();
      schedule();
    });
    avatarBox.append(button);
  }
  logoState.textContent = customLogo ? (code === "en" ? "Logo ready in this browser." : "Logo listo en este navegador.") : "";
}

function hitLabel(hit, code) {
  if (hit.kind === "base58") return code === "en" ? "address" : "dirección";
  if (hit.kind === "url") return code === "en" ? "link" : "enlace";
  if (hit.kind === "handle") return hit.term;
  return hit.term;
}

function tokenName() {
  return clipToken(tokenInput.value);
}

function persist() {
  saveDraft(localStorage, {
    templateId,
    formatId,
    backgroundId,
    avatarId,
    token: tokenName(),
    title: titleInput.value,
    body: bodyInput.value,
    dirty,
  });
}

async function draw() {
  const code = lang();
  const max = limits();
  titleCount.textContent = `${titleInput.value.length} / ${max.title}`;
  bodyCount.textContent = `${bodyInput.value.length} / ${max.body}`;
  tokenCount.textContent = `${tokenName().length} / ${TOKEN_MAX}`;
  const bg = background();
  const avatar = avatarItem();
  const origins = customLogo ? [bg?.aiOrigin].filter(Boolean) : [bg?.aiOrigin, avatar?.aiOrigin].filter(Boolean);
  const name = tokenName();
  const card = await renderCard({
    width: format().width,
    height: format().height,
    lang: code,
    title: titleInput.value,
    body: bodyInput.value,
    token: name,
    fill: bg?.fill ?? "#0a090d",
    ink: bg?.ink ?? "#fff3f5",
    origins,
    zones: templates.zones,
    avatar: customLogo ?? (avatar ? images.get(avatar.id) ?? null : null),
  });
  latest = card;
  canvas.width = card.width;
  canvas.height = card.height;
  canvas.getContext("2d").putImageData(new ImageData(card.rgba, card.width, card.height), 0, 0);
  const allowed = exportAllowed(titleInput.value, bodyInput.value, undefined, name);
  const hits = [...analyze(name).hits, ...analyze(titleInput.value).hits, ...analyze(bodyInput.value).hits];
  blockNotice.hidden = allowed;
  fitNotice.hidden = card.fits;
  detail.textContent = hits.slice(0, 5).map((hit) => hitLabel(hit, code)).join(", ");
  download.disabled = !allowed || !card.fits;
  share.disabled = download.disabled;
  userLive.textContent = [name, titleInput.value, bodyInput.value, BRAND[code], FOOTER[code], card.label].filter(Boolean).join(". ");
  persist();
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    draw().catch(() => {
      loadNotice.hidden = false;
      download.disabled = true;
    });
  }, 60);
}

async function loadImages() {
  await Promise.all(avatars.map(async (item) => {
    const response = await fetch(item.archivo);
    if (!response.ok) throw new Error(item.id);
    images.set(item.id, await decodePng(new Uint8Array(await response.arrayBuffer())));
  }));
}

async function exportedBlob() {
  if (!exportAllowed(titleInput.value, bodyInput.value, undefined, tokenName()) || !latest?.fits) return null;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const bytes = blob ? new Uint8Array(await blob.arrayBuffer()) : latest.png;
  return new Blob([injectComment(bytes, PNG_COMMENT)], { type: "image/png" });
}

document.querySelectorAll("[data-template]").forEach((button) => {
  button.addEventListener("click", () => {
    applyTemplate(button.getAttribute("data-template"), lang(), false);
    schedule();
  });
});
document.querySelectorAll("[data-format]").forEach((button) => {
  button.addEventListener("click", () => {
    formatId = button.getAttribute("data-format");
    document.querySelectorAll("[data-format]").forEach((item) => {
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
    schedule();
  });
});
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.getAttribute("data-tab");
    document.querySelectorAll("[data-tab]").forEach((item) => {
      const on = item === button;
      item.setAttribute("aria-selected", on ? "true" : "false");
      item.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.getAttribute("data-panel") !== name;
    });
  });
});
titleInput.addEventListener("input", () => {
  dirty = true;
  schedule();
});
bodyInput.addEventListener("input", () => {
  dirty = true;
  schedule();
});
tokenInput.maxLength = TOKEN_MAX;
tokenInput.addEventListener("input", () => {
  schedule();
});
logoInput.addEventListener("change", () => {
  const file = logoInput.files?.[0];
  if (!file) return;
  file.arrayBuffer().then((buffer) => readLogoPng(new Uint8Array(buffer))).then((image) => {
    customLogo = image;
    logoNotice.hidden = true;
    paintChoices();
    schedule();
  }).catch(() => {
    customLogo = null;
    logoInput.value = "";
    logoNotice.hidden = false;
    paintChoices();
    schedule();
  });
});
logoClear.addEventListener("click", () => {
  customLogo = null;
  logoInput.value = "";
  logoNotice.hidden = true;
  paintChoices();
  schedule();
});
download.addEventListener("click", async () => {
  const blob = await exportedBlob();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studio.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
share.addEventListener("click", async () => {
  const blob = await exportedBlob();
  if (!blob || !navigator.share) return;
  const file = new File([blob], "studio.png", { type: "image/png" });
  const payload = { files: [file] };
  if (navigator.canShare && !navigator.canShare(payload)) return;
  await navigator.share(payload);
});
clearButton.addEventListener("click", () => {
  clearDraft(localStorage);
  dirty = false;
  customLogo = null;
  logoInput.value = "";
  logoNotice.hidden = true;
  tokenInput.value = DEFAULT_TOKEN;
  applyTemplate(templateId, lang(), false);
  paintChoices();
  schedule();
});
document.addEventListener("stubx-lang", () => {
  if (!dirty) applyTemplate(templateId, lang(), false);
  paintChoices();
  schedule();
});

if (navigator.share) share.hidden = false;
const saved = loadDraft(localStorage);
if (saved) {
  templateId = saved.templateId || templateId;
  formatId = saved.formatId || formatId;
  backgroundId = saved.backgroundId || backgroundId;
  avatarId = saved.avatarId || "";
  dirty = Boolean(saved.dirty);
  applyTemplate(templateId, lang(), true);
  const max = limits();
  titleInput.value = clipDraftText(saved.title ?? titleInput.value, max.title);
  bodyInput.value = clipDraftText(saved.body ?? bodyInput.value, max.body);
  tokenInput.value = clipToken(saved.token === undefined ? DEFAULT_TOKEN : saved.token);
  document.querySelectorAll("[data-format]").forEach((button) => {
    button.setAttribute("aria-pressed", button.getAttribute("data-format") === formatId ? "true" : "false");
  });
} else {
  applyTemplate(templateId, lang(), lang() === "es");
}
paintChoices();
loadImages().then(schedule).catch(() => {
  loadNotice.hidden = false;
  schedule();
});
