import catalog from "./catalog.json" with { type: "json" };
import templates from "./templates.json" with { type: "json" };
import { FOOTER, PNG_COMMENT, brandFor } from "./lib/copy.mjs";
import { clearDraft, clipDraftText, loadDraft, saveDraft } from "./lib/draft.mjs";
import { analyze, exportAllowed } from "./lib/filter.mjs";
import { DEFAULT_TOKEN, LOGO_MAX_BYTES, TOKEN_MAX, clipToken, createLogoGate, isStubxToken, readLogoPng } from "./lib/logo.mjs";
import { decodePng, injectComment } from "./lib/png.mjs";
import { renderCard } from "./lib/render.mjs";
import { FILE_NAME, REVOKE_MS, canShareFiles, isIOS, saveMode } from "./lib/save.mjs";

const titleInput = document.getElementById("titulo");
const bodyInput = document.getElementById("cuerpo");
const tokenInput = document.getElementById("token");
const canvas = document.getElementById("vista");
const download = document.getElementById("descargar");
const share = document.getElementById("compartir");
const clearButton = document.getElementById("borrar");
const saveNotice = document.getElementById("aviso-guardar");
const ios = isIOS(navigator);
const shareProbe = new File([new Uint8Array(8)], FILE_NAME, { type: "image/png" });
const shareFiles = canShareFiles(navigator, shareProbe);
share.hidden = !shareFiles;
let ready = null;
let readyFor = 0;
let drawCount = 0;
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
const logoFormatNotice = document.getElementById("aviso-logo-formato");
const logoWeightNotice = document.getElementById("aviso-logo-peso");
const logoSizeNotice = document.getElementById("aviso-logo-medida");
const logoScaleNotice = document.getElementById("aviso-logo-reducir");
const mascotNotice = document.getElementById("aviso-mascota");
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
const logoGate = createLogoGate();
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
  const stubxName = isStubxToken(tokenName());
  mascotNotice.hidden = stubxName;
  if (customLogo) {
    const own = document.createElement("button");
    own.type = "button";
    own.textContent = code === "en" ? "Your logo" : "Tu logo";
    own.setAttribute("aria-pressed", "true");
    avatarBox.append(own);
  }
  if (stubxName) {
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
  const name = tokenName();
  const stubxName = isStubxToken(name);
  const avatar = stubxName ? avatarItem() : null;
  const origins = customLogo || !avatar ? [bg?.aiOrigin].filter(Boolean) : [bg?.aiOrigin, avatar?.aiOrigin].filter(Boolean);
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
  userLive.textContent = [name, titleInput.value, bodyInput.value, brandFor(code, name), FOOTER[code], card.label].filter(Boolean).join(". ");
  persist();
  prepare();
}

// La imagen se prepara antes del toque: iOS solo deja compartir o abrir una pestaña
// si se hace en el mismo gesto, sin esperas largas.
function prepare() {
  const id = ++drawCount;
  ready = null;
  if (download.disabled) return;
  exportedBlob().then((blob) => {
    if (id === drawCount) {
      ready = blob;
      readyFor = id;
    }
  }).catch(() => {});
}

async function currentBlob() {
  if (ready && readyFor === drawCount) return ready;
  return exportedBlob();
}

function showSaveNotice() {
  saveNotice.hidden = false;
}

function openImage(blob) {
  const url = URL.createObjectURL(blob);
  // Con noopener window.open devuelve null; no se usa para decidir nada.
  window.open(url, "_blank", "noopener");
  showSaveNotice();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
}

function downloadFile(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studio.png";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
}

async function shareFile(blob) {
  const file = new File([blob], FILE_NAME, { type: "image/png" });
  try {
    await navigator.share({ files: [file] });
  } catch (error) {
    if (error && error.name === "AbortError") return;
    openImage(blob);
  }
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
  paintChoices();
  schedule();
});
function hideLogoErrors() {
  logoNotice.hidden = true;
  logoFormatNotice.hidden = true;
  logoWeightNotice.hidden = true;
  logoSizeNotice.hidden = true;
  logoScaleNotice.hidden = true;
}

function showLogoError(message) {
  hideLogoErrors();
  if (message === "logo-bytes") logoWeightNotice.hidden = false;
  else if (message === "logo-size") logoSizeNotice.hidden = false;
  else if (message === "logo-scale") logoScaleNotice.hidden = false;
  else if (message === "logo-format") logoFormatNotice.hidden = false;
  else logoNotice.hidden = false;
}

function readBlob(blob, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal?.aborted) {
      abort();
      return;
    }
    const onAbort = () => abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    blob.arrayBuffer().then(
      (buffer) => {
        signal?.removeEventListener("abort", onAbort);
        if (signal?.aborted) abort();
        else resolve(buffer);
      },
      (error) => {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

logoInput.addEventListener("change", () => {
  const file = logoInput.files?.[0];
  if (!file) return;
  if (file.size > LOGO_MAX_BYTES) {
    logoGate.cancel();
    customLogo = null;
    logoInput.value = "";
    showLogoError("logo-bytes");
    paintChoices();
    schedule();
    return;
  }
  const load = logoGate.begin();
  readBlob(file, load.signal).then((buffer) => readLogoPng(new Uint8Array(buffer))).then((image) => {
    if (!load.stillCurrent()) return;
    customLogo = image;
    hideLogoErrors();
    paintChoices();
    schedule();
  }).catch((error) => {
    if (!load.stillCurrent() || error?.name === "AbortError") return;
    customLogo = null;
    logoInput.value = "";
    showLogoError(error?.message);
    paintChoices();
    schedule();
  });
});
logoClear.addEventListener("click", () => {
  logoGate.cancel();
  customLogo = null;
  logoInput.value = "";
  hideLogoErrors();
  paintChoices();
  schedule();
});
download.addEventListener("click", async () => {
  const blob = await currentBlob();
  if (!blob) return;
  const mode = saveMode({ ios, share: shareFiles });
  if (mode === "share") return shareFile(blob);
  if (mode === "open") return openImage(blob);
  downloadFile(blob);
});
share.addEventListener("click", async () => {
  const blob = await currentBlob();
  if (!blob || !shareFiles) return;
  await shareFile(blob);
});
clearButton.addEventListener("click", () => {
  clearDraft(localStorage);
  dirty = false;
  customLogo = null;
  logoGate.cancel();
  logoInput.value = "";
  hideLogoErrors();
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
