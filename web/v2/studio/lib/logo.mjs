/** Logo elegido en el navegador. No sale del dispositivo. */

import { INVISIBLE_CHARS } from "./filter.mjs";
import { decodePng, pngDimensions } from "./png.mjs";

export const DEFAULT_TOKEN = "STUBX";
export const TOKEN_MAX = 20;
export const LOGO_MAX_BYTES = 1_500_000;
export const LOGO_MAX_EDGE = 2048;
export const LOGO_DRAW_EDGE = 512;

export function clipToken(value) {
  return String(value ?? "").normalize("NFKC").replace(INVISIBLE_CHARS, "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, TOKEN_MAX);
}

export function isStubxToken(value) {
  return clipToken(value).toLowerCase() === "stubx";
}

export function fitLogo(image, edge) {
  const limit = Math.max(1, edge);
  if (image.width <= limit && image.height <= limit) return image;
  const scale = limit / Math.max(image.width, image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sy = Math.min(image.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(image.width - 1, Math.floor(x / scale));
      const si = (sy * image.width + sx) * 4;
      const di = (y * width + x) * 4;
      rgba[di] = image.rgba[si] ?? 0;
      rgba[di + 1] = image.rgba[si + 1] ?? 0;
      rgba[di + 2] = image.rgba[si + 2] ?? 0;
      rgba[di + 3] = image.rgba[si + 3] ?? 255;
    }
  }
  return { width, height, rgba };
}

export async function readLogoPng(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || bytes.length > LOGO_MAX_BYTES) {
    throw new Error("logo");
  }
  let width = 0;
  let height = 0;
  try {
    const declared = pngDimensions(bytes);
    width = declared.width;
    height = declared.height;
  } catch {
    throw new Error("logo");
  }
  if (width > LOGO_MAX_EDGE || height > LOGO_MAX_EDGE || width < 1 || height < 1) {
    throw new Error("logo-size");
  }
  const image = await decodePng(bytes);
  return fitLogo(image, LOGO_DRAW_EDGE);
}
