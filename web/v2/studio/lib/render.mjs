import { NOTICE_MIN_PX, PNG_COMMENT, WATERMARK, WATERMARK_ALPHA, aiLabel, noticeFloor, noticeFor } from "./copy.mjs";
import { clipToken } from "./logo.mjs";
import { paintBackground } from "./backgrounds.mjs";
import { capInk, drawFace, fitFace, lineBox, loadFace, wrapFace } from "./draw.mjs";
import { measureFont } from "./ttf.mjs";
import { BODY_FONT, NOTICE_FONT, headlineById } from "./headlines.mjs";
import { encodePng } from "./png.mjs";

export const BRAND_BG = Object.freeze([16, 36, 63, 255]);
export const BRAND_FG = Object.freeze([244, 247, 251, 255]);
export const FOOTER_BG = Object.freeze([7, 20, 34, 255]);
export const FOOTER_FG = Object.freeze([244, 247, 251, 255]);
export { WATERMARK_ALPHA };
export const PNG_TEXT = PNG_COMMENT;
const WM_TEXT = "NO OFICIAL";

export function contrastHex(a, b) {
  const lin = (hex) => {
    const n = Number.parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((channel) => {
      const s = channel / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
  };
  const hi = Math.max(lin(a), lin(b));
  const lo = Math.min(lin(a), lin(b));
  return (hi + 0.05) / (lo + 0.05);
}

function luma(color) {
  const lin = (channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(color[0] ?? 0) + 0.7152 * lin(color[1] ?? 0) + 0.0722 * lin(color[2] ?? 0);
}

function hexColor(hex) {
  const n = Number.parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function fillRect(rgba, width, height, x, y, w, h, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(width, Math.ceil(x + w));
  const y1 = Math.min(height, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      const i = (yy * width + xx) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = 255;
    }
  }
}

function zoneOf(spec, width, height, limitBottom, limitTop = 0) {
  const x = spec.x * width;
  const w = spec.w * width;
  let y = spec.y * height;
  let h = spec.h * height;
  if (y < limitTop) {
    h -= limitTop - y;
    y = limitTop;
  }
  if (h < 0) h = 0;
  if (y >= limitBottom) return { x, y: limitBottom, w, h: 0 };
  if (y + h > limitBottom) h = limitBottom - y;
  return { x, y, w, h };
}

function blit(rgba, width, height, zone, image) {
  if (!image || zone.w < 2 || zone.h < 2) return;
  const scale = Math.min(zone.w / image.width, zone.h / image.height);
  const w = Math.max(1, Math.floor(image.width * scale));
  const h = Math.max(1, Math.floor(image.height * scale));
  const x = Math.floor(zone.x + (zone.w - w) / 2);
  const y = Math.floor(zone.y + (zone.h - h) / 2);
  for (let yy = 0; yy < h; yy += 1) {
    const sy = Math.min(image.height - 1, Math.floor((yy * image.height) / h));
    for (let xx = 0; xx < w; xx += 1) {
      const sx = Math.min(image.width - 1, Math.floor((xx * image.width) / w));
      const dx = x + xx;
      const dy = y + yy;
      if (dx < 0 || dy < 0 || dx >= width || dy >= height) continue;
      const si = (sy * image.width + sx) * 4;
      const di = (dy * width + dx) * 4;
      const alpha = (image.rgba[si + 3] ?? 255) / 255;
      if (alpha <= 0) continue;
      if (alpha >= 1) {
        rgba[di] = image.rgba[si] ?? 0;
        rgba[di + 1] = image.rgba[si + 1] ?? 0;
        rgba[di + 2] = image.rgba[si + 2] ?? 0;
        rgba[di + 3] = 255;
        continue;
      }
      for (let c = 0; c < 3; c += 1) {
        rgba[di + c] = Math.round((rgba[di + c] ?? 0) * (1 - alpha) + (image.rgba[si + c] ?? 0) * alpha);
      }
      rgba[di + 3] = 255;
    }
  }
}

function emForCap(font, minInk) {
  let size = Math.ceil(minInk);
  while (size < minInk * 4 && capInk(font, size) < minInk) size += 1;
  return size;
}

function titleStyle(id, ink) {
  const dark = luma(ink) < 0.45;
  const paper = [255, 255, 255];
  const night = [12, 8, 16];
  if (id === "comic") {
    return dark
      ? { fill: [20, 6, 12], stroke: [255, 225, 74], strokeWidth: 0.11 }
      : { fill: [255, 225, 74], stroke: night, strokeWidth: 0.11 };
  }
  if (id === "neon") {
    return {
      fill: paper,
      stroke: [18, 6, 32],
      strokeWidth: 0.045,
      glow: [40, 255, 210],
      glow2: [176, 120, 255],
      glowRadius: 0.16,
      glowAlpha: 0.85,
    };
  }
  if (id === "pixel") return { fill: dark ? ink : paper, shadow: 0.07, shadowAlpha: 1 };
  if (id === "bold") return { fill: dark ? ink : paper, shadow: 0.08, shadowAlpha: 0.85 };
  return dark
    ? { fill: night, stroke: paper, strokeWidth: 0.09 }
    : { fill: paper, stroke: night, strokeWidth: 0.09 };
}

function placeText(rgba, width, height, font, fit, zone, role, glyphs, style) {
  if (!fit.lines.length || zone.h < 4) return;
  const metrics = lineBox(font, fit.size);
  drawFace(rgba, width, height, font, fit.lines, zone.x, zone.y + metrics.ascent, fit.size, role, glyphs, style);
}

export async function renderCard(options) {
  const width = options.width;
  const height = options.height;
  const lang = options.lang === "en" ? "en" : "es";
  const rgba = new Uint8ClampedArray(width * height * 4);
  const fill = hexColor(options.fill ?? "#0a090d");
  const ink = hexColor(options.ink ?? "#fff3f5");
  fillRect(rgba, width, height, 0, 0, width, height, fill);
  if (options.backgroundId) paintBackground(rgba, width, height, options.backgroundId);

  const headline = headlineById(options.headline);
  const [noticeFont, bodyFont, titleFont] = await Promise.all([
    loadFace(NOTICE_FONT),
    loadFace(BODY_FONT),
    loadFace(headline.file),
  ]);
  const pad = Math.round(width * 0.04);
  const inner = Math.max(8, width - pad * 2);
  const tokenText = clipToken(options.token ?? "");
  const noticeText = noticeFor(lang, tokenText, width, height);
  const inkFloor = emForCap(noticeFont, NOTICE_MIN_PX);
  const floor = Math.max(noticeFloor(height), inkFloor);
  let noticeSize = floor;
  while (noticeSize < floor + 24 && measureFont(noticeFont, noticeText, noticeSize + 1) <= inner) noticeSize += 1;
  const shrinkTo = measureFont(noticeFont, noticeText, inkFloor) <= inner ? inkFloor : NOTICE_MIN_PX;
  while (noticeSize > shrinkTo && measureFont(noticeFont, noticeText, noticeSize) > inner) noticeSize -= 1;
  const noticeMetrics = lineBox(noticeFont, noticeSize);
  const noticeH = Math.ceil(noticeMetrics.ascent + noticeMetrics.descent + noticeSize * 0.35);
  const footerTop = height - noticeH;
  const label = aiLabel(options.origins ?? [], lang);
  const aiSize = label ? Math.max(12, Math.round(Math.min(width, height) * 0.02)) : 0;
  const aiLines = label ? wrapFace(bodyFont, label, inner, aiSize) : [];
  const aiStep = aiLines.length ? lineBox(bodyFont, aiSize).step : 0;
  const aiH = aiLines.length ? Math.ceil(aiLines.length * aiStep + aiSize * 0.35) : 0;
  const aiTop = footerTop - aiH;
  const contentBottom = aiTop;
  const titleClear = Math.ceil(height * 0.078);

  const zones = options.zones ?? {
    title: { x: 0.05, y: 0.08, w: 0.9, h: 0.3 },
    body: { x: 0.05, y: 0.4, w: 0.5, h: 0.38 },
    avatar: { x: 0.5, y: 0.36, w: 0.46, h: 0.52 },
  };
  const titleZone = zoneOf(zones.title, width, height, contentBottom, titleClear);
  const bodyZone = zoneOf(zones.body, width, height, contentBottom, 0);
  const avatarZone = zoneOf(zones.avatar, width, height, contentBottom, 0);
  const tokenBand = tokenText ? Math.ceil(Math.max(18, height * 0.045)) : 0;
  const imageZone = tokenBand > 0 && avatarZone.h > tokenBand + 4
    ? { x: avatarZone.x, y: avatarZone.y, w: avatarZone.w, h: avatarZone.h - tokenBand }
    : avatarZone;
  const tokenZone = imageZone.h < avatarZone.h
    ? { x: avatarZone.x, y: imageZone.y + imageZone.h, w: avatarZone.w, h: avatarZone.h - imageZone.h }
    : { x: avatarZone.x, y: avatarZone.y, w: avatarZone.w, h: 0 };
  blit(rgba, width, height, imageZone, options.avatar ?? null);

  const glyphs = [];
  const titleFit = fitFace(titleFont, options.title ?? "", titleZone, Math.max(floor, height * 0.16), Math.max(22, Math.round(height * 0.045)));
  const bodyFit = fitFace(bodyFont, options.body ?? "", bodyZone, Math.max(18, height * 0.04), Math.max(14, Math.round(height * 0.02)));
  const tokenFit = fitFace(bodyFont, tokenText, tokenZone, Math.max(14, Math.round(height * 0.028)), 12);
  const inkRgb = [ink[0], ink[1], ink[2]];
  placeText(rgba, width, height, titleFont, titleFit, titleZone, "title", glyphs, titleStyle(headline.id, inkRgb));
  placeText(rgba, width, height, bodyFont, bodyFit, bodyZone, "body", glyphs, { fill: inkRgb, shadow: 0.05, shadowAlpha: 0.75 });
  placeText(rgba, width, height, bodyFont, tokenFit, tokenZone, "token", glyphs, { fill: inkRgb });

  const wmSize = Math.max(13, Math.round(Math.min(width, height) * 0.026));
  const wmWidth = measureFont(bodyFont, WM_TEXT, wmSize);
  const wmMetrics = lineBox(bodyFont, wmSize);
  const wmX = Math.max(pad, width - pad - wmWidth);
  const wmBaseline = Math.round(height * 0.03) + wmMetrics.ascent;
  const wmColor = luma(fill) > 0.45 ? [18, 10, 14] : [255, 243, 245];
  drawFace(rgba, width, height, bodyFont, [WM_TEXT], wmX, wmBaseline, wmSize, "watermark", glyphs, {
    fill: wmColor,
    alpha: WATERMARK_ALPHA,
    crisp: true,
  });
  const watermarkBox = {
    x: Math.round(wmX),
    y: Math.round(wmBaseline - wmMetrics.ascent),
    w: Math.ceil(wmWidth),
    h: Math.ceil(wmMetrics.ascent + wmMetrics.descent),
  };

  if (aiLines.length) {
    const aiMetrics = lineBox(bodyFont, aiSize);
    drawFace(rgba, width, height, bodyFont, aiLines, pad, aiTop + aiMetrics.ascent, aiSize, "ai", glyphs, { fill: [244, 247, 251] });
  }

  fillRect(rgba, width, height, 0, footerTop, width, noticeH, FOOTER_BG);
  const noticeBaseline = footerTop + (noticeH - (noticeMetrics.ascent + noticeMetrics.descent)) / 2 + noticeMetrics.ascent;
  drawFace(rgba, width, height, noticeFont, [noticeText], pad, noticeBaseline, noticeSize, "notice", glyphs, {
    fill: [FOOTER_FG[0], FOOTER_FG[1], FOOTER_FG[2]],
  });

  const png = await encodePng(rgba, width, height, PNG_COMMENT);
  const noticeGlyphs = glyphs.filter((glyph) => glyph.role === "notice");
  const noticeLineCount = new Set(noticeGlyphs.map((glyph) => Math.round(glyph.y))).size;
  return {
    rgba,
    png,
    width,
    height,
    lang,
    texts: [noticeText, WATERMARK, label, options.title ?? "", options.body ?? "", tokenText].filter((item) => item !== ""),
    glyphs,
    fits: titleFit.fits && bodyFit.fits && tokenFit.fits,
    brandFontSize: noticeSize,
    noticeFontSize: noticeSize,
    noticeInk: capInk(noticeFont, noticeSize),
    noticeText,
    noticeLines: noticeLineCount,
    brandTop: footerTop,
    footerTop,
    noticeTop: footerTop,
    aiTop,
    topBand: 0,
    contentBottom,
    watermarkAlpha: WATERMARK_ALPHA,
    watermarkColor: wmColor,
    watermarkBox,
    headline: headline.id,
    fill,
    ink,
    label,
  };
}
