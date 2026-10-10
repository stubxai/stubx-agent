import { PNG_COMMENT } from "./lib/copy.mjs";
import { injectComment } from "./lib/png.mjs";
import { renderCard } from "./lib/render.mjs";

const avatars = new Map();
let generation = 0;
let pending = null;
let pumping = false;

function alive(gen) {
  return gen === generation;
}

function resolveAvatar(options) {
  const key = options.avatarKey || "";
  if (options.avatar && key) avatars.set(key, options.avatar);
  if (options.avatar) return options.avatar;
  if (key && avatars.has(key)) return avatars.get(key);
  return null;
}

function bitmapOf(card) {
  const board = new OffscreenCanvas(card.width, card.height);
  const ctx = board.getContext("2d");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(card.rgba), card.width, card.height), 0, 0);
  return board.transferToImageBitmap();
}

async function pngBlob(card) {
  const board = new OffscreenCanvas(card.width, card.height);
  const ctx = board.getContext("2d");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(card.rgba), card.width, card.height), 0, 0);
  const blob = await board.convertToBlob({ type: "image/png" });
  if (!blob) return null;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return new Blob([injectComment(bytes, PNG_COMMENT)], { type: "image/png" });
}

async function run(gen, data) {
  const avatar = resolveAvatar(data.options || {});
  const card = await renderCard({
    ...data.options,
    avatar,
    png: false,
    preview: data.kind === "preview",
    cooperative: true,
    slice: true,
    alive: () => alive(gen),
  });
  if (!alive(gen)) return;
  if (data.kind === "png") {
    const blob = await pngBlob(card);
    if (!alive(gen) || !blob) return;
    self.postMessage({
      id: data.id,
      kind: "png",
      blob,
      fits: card.fits,
      noticeText: card.noticeText,
      label: card.label,
      width: card.width,
      height: card.height,
    });
    return;
  }
  const bitmap = bitmapOf(card);
  if (!alive(gen)) {
    bitmap.close?.();
    return;
  }
  self.postMessage({
    id: data.id,
    kind: "preview",
    bitmap,
    fits: card.fits,
    noticeText: card.noticeText,
    label: card.label,
    width: card.width,
    height: card.height,
  }, [bitmap]);
}

async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (pending) {
      const task = pending;
      pending = null;
      try {
        await run(task.gen, task.data);
      } catch (error) {
        if (error?.name === "AbortError" || task.gen !== generation) continue;
        self.postMessage({ id: task.data.id, kind: task.data.kind, error: String(error?.message || error) });
      }
    }
  } finally {
    pumping = false;
    if (pending) pump();
  }
}

self.onmessage = (event) => {
  generation += 1;
  const data = event.data || {};
  if (data.kind === "cancel") {
    pending = null;
    return;
  }
  pending = { gen: generation, data };
  pump();
};
