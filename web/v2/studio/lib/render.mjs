import { BRAND, FOOTER, PNG_COMMENT, WATERMARK, aiLabel } from "./copy.mjs";
import { FONT_H, bitAt, glyphOf, measureText, wrapText } from "./font.mjs";
import { encodePng } from "./png.mjs";

export const BRAND_BG = Object.freeze([16, 36, 63, 255]);
export const BRAND_FG = Object.freeze([244, 247, 251, 255]);
export const FOOTER_BG = Object.freeze([7, 20, 34, 255]);
export const FOOTER_FG = Object.freeze([244, 247, 251, 255]);
export const WATERMARK_ALPHA = 0.15;
export const PNG_TEXT = PNG_COMMENT;

export function brandFontSize(height) {
  return Math.max(FONT_H, Math.ceil(height * 0.025));
}

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

function paintPixel(rgba, width, height, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = (y * width + x) * 4;
  if (alpha >= 1) {
    rgba[i] = color[0];
    rgba[i + 1] = color[1];
    rgba[i + 2] = color[2];
    rgba[i + 3] = 255;
    return;
  }
  for (let c = 0; c < 3; c += 1) {
    rgba[i + c] = Math.round((rgba[i + c] ?? 0) * (1 - alpha) + (color[c] ?? 0) * alpha);
  }
  rgba[i + 3] = 255;
}

function drawGlyph(rgba, width, height, ch, x, y, fontSize, color, alpha, role, glyphs) {
  const glyph = glyphOf(ch);
  const scale = fontSize / FONT_H;
  const advance = glyph.w * scale + scale;
  if (glyph.empty) return advance;
  const boxW = glyph.w * scale;
  if (x + boxW < 0 || y + fontSize < 0 || x >= width || y >= height) {
    if (role !== "watermark") {
      glyphs.push({ ch: glyphOf(ch).empty ? " " : [...ch.toLocaleUpperCase("es-ES")][0], x, y, size: fontSize, w: boxW, h: fontSize, role, color, missing: glyph.missing });
    }
    return advance;
  }
  for (let row = 0; row < FONT_H; row += 1) {
    for (let col = 0; col < glyph.w; col += 1) {
      if (!bitAt(glyph.rows, col, row)) continue;
      const x0 = Math.floor(x + col * scale);
      const x1 = Math.max(x0 + 1, Math.floor(x + (col + 1) * scale));
      const y0 = Math.floor(y + row * scale);
      const y1 = Math.max(y0 + 1, Math.floor(y + (row + 1) * scale));
      for (let py = y0; py < y1; py += 1) {
        for (let px = x0; px < x1; px += 1) paintPixel(rgba, width, height, px, py, color, alpha);
      }
    }
  }
  if (role !== "watermark") {
    glyphs.push({
      ch: [...ch.toLocaleUpperCase("es-ES")][0] ?? ch,
      x,
      y,
      size: fontSize,
      w: boxW,
      h: fontSize,
      role,
      color,
      missing: glyph.missing,
    });
  }
  return advance;
}

function drawString(rgba, width, height, text, x, y, fontSize, color, alpha, role, glyphs) {
  let cursor = x;
  for (const ch of String(text)) {
    cursor += drawGlyph(rgba, width, height, ch, cursor, y, fontSize, color, alpha, role, glyphs);
  }
  return cursor;
}

function drawLines(rgba, width, height, lines, x, y, fontSize, color, role, glyphs) {
  const step = fontSize * 1.2;
  lines.forEach((line, index) => {
    drawString(rgba, width, height, line, x, y + index * step, fontSize, color, 1, role, glyphs);
  });
}

function fitBlock(text, zone, maxSize, minSize) {
  const value = String(text ?? "");
  if (!value.trim() || zone.h <= 0 || zone.w <= 0) return { lines: [], size: minSize, fits: !value.trim() };
  let size = maxSize;
  while (size > minSize) {
    const lines = wrapText(value, zone.w, size);
    if (lines.length * size * 1.2 <= zone.h) return { lines, size, fits: true };
    size -= 1;
  }
  const lines = wrapText(value, zone.w, minSize);
  const maxLines = Math.max(0, Math.floor(zone.h / (minSize * 1.2)));
  return { lines: lines.slice(0, maxLines), size: minSize, fits: lines.length <= maxLines };
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
      rgba[di] = image.rgba[si] ?? 0;
      rgba[di + 1] = image.rgba[si + 1] ?? 0;
      rgba[di + 2] = image.rgba[si + 2] ?? 0;
      rgba[di + 3] = 255;
    }
  }
}

function drawWatermark(rgba, width, height, color) {
  const mask = new Uint8ClampedArray(width * height * 4);
  const fontSize = Math.max(FONT_H, Math.round(height * 0.02));
  const text = WATERMARK.toLocaleUpperCase("es-ES");
  const textW = measureText(text, fontSize);
  const stepX = textW + fontSize;
  const stepY = fontSize * 3.2;
  const angle = -Math.PI / 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      let cursor = 0;
      for (const ch of text) {
        const glyph = glyphOf(ch);
        const advance = glyph.w * (fontSize / FONT_H) + fontSize / FONT_H;
        const gx = x + cursor * cos;
        const gy = y + cursor * sin;
        if (gx < width && gy < height && gx + advance > 0 && gy + fontSize > 0) {
          drawGlyph(mask, width, height, ch, gx, gy, fontSize, [255, 255, 255], 1, "watermark", []);
        }
        cursor += advance;
      }
    }
  }
  for (let i = 0; i < rgba.length; i += 4) {
    if ((mask[i] ?? 0) === 0) continue;
    for (let c = 0; c < 3; c += 1) {
      rgba[i + c] = Math.round((rgba[i + c] ?? 0) * (1 - WATERMARK_ALPHA) + (color[c] ?? 0) * WATERMARK_ALPHA);
    }
  }
}

export async function renderCard(options) {
  const width = options.width;
  const height = options.height;
  const lang = options.lang === "en" ? "en" : "es";
  const rgba = new Uint8ClampedArray(width * height * 4);
  const fill = hexColor(options.fill ?? "#0a090d");
  const ink = hexColor(options.ink ?? "#fff3f5");
  fillRect(rgba, width, height, 0, 0, width, height, fill);

  const size = brandFontSize(height);
  const pad = Math.round(width * 0.05);
  const inner = Math.max(8, width - pad * 2);
  const brandText = BRAND[lang];
  const footerText = FOOTER[lang];
  const label = aiLabel(options.origins ?? [], lang);
  const footerLines = wrapText(footerText, inner, size);
  const brandLines = wrapText(brandText, inner, size);
  const aiLines = label ? wrapText(label, inner, size) : [];
  const lineH = size * 1.2;
  const footerH = Math.ceil(footerLines.length * lineH + size * 0.8);
  const brandH = Math.ceil(brandLines.length * lineH + size * 0.6);
  const aiH = aiLines.length ? Math.ceil(aiLines.length * lineH + size * 0.45) : 0;
  const topBand = brandH;
  const footerTop = height - footerH;
  const brandTop = footerTop - brandH;
  const aiTop = brandTop - aiH;
  const contentBottom = aiTop;

  const zones = options.zones ?? {
    title: { x: 0.06, y: 0.05, w: 0.88, h: 0.2 },
    body: { x: 0.06, y: 0.26, w: 0.56, h: 0.34 },
    avatar: { x: 0.64, y: 0.26, w: 0.3, h: 0.34 },
  };
  const titleZone = zoneOf(zones.title, width, height, contentBottom, topBand);
  const bodyZone = zoneOf(zones.body, width, height, contentBottom, topBand);
  const avatarZone = zoneOf(zones.avatar, width, height, contentBottom, topBand);
  blit(rgba, width, height, avatarZone, options.avatar ?? null);

  const watermarkColor = luma(fill) > 0.45 ? [18, 10, 14] : [255, 243, 245];
  drawWatermark(rgba, width, height, watermarkColor);

  const minSize = size;
  const maxSize = Math.max(minSize, Math.ceil(height * 0.04));
  const titleFit = fitBlock(options.title ?? "", titleZone, maxSize, minSize);
  const bodyFit = fitBlock(options.body ?? "", bodyZone, maxSize, minSize);
  const glyphs = [];
  drawLines(rgba, width, height, titleFit.lines, titleZone.x, titleZone.y, titleFit.size, ink, "title", glyphs);
  drawLines(rgba, width, height, bodyFit.lines, bodyZone.x, bodyZone.y, bodyFit.size, ink, "body", glyphs);

  fillRect(rgba, width, height, 0, 0, width, topBand, BRAND_BG);
  fillRect(rgba, width, height, 0, aiTop, width, aiH, FOOTER_BG);
  fillRect(rgba, width, height, 0, brandTop, width, brandH, BRAND_BG);
  fillRect(rgba, width, height, 0, footerTop, width, footerH, FOOTER_BG);
  drawLines(rgba, width, height, brandLines, pad, size * 0.25, size, BRAND_FG, "brandTop", glyphs);
  if (aiLines.length) drawLines(rgba, width, height, aiLines, pad, aiTop + size * 0.2, size, FOOTER_FG, "ai", glyphs);
  drawLines(rgba, width, height, brandLines, pad, brandTop + size * 0.25, size, BRAND_FG, "brand", glyphs);
  drawLines(rgba, width, height, footerLines, pad, footerTop + size * 0.3, size, FOOTER_FG, "footer", glyphs);

  const png = await encodePng(rgba, width, height, PNG_COMMENT);
  return {
    rgba,
    png,
    width,
    height,
    lang,
    texts: [brandText, footerText, WATERMARK, label, options.title ?? "", options.body ?? ""].filter((item) => item !== ""),
    glyphs,
    fits: titleFit.fits && bodyFit.fits,
    brandFontSize: size,
    brandTop,
    footerTop,
    aiTop,
    topBand,
    contentBottom,
    watermarkAlpha: WATERMARK_ALPHA,
    watermarkColor,
    fill,
    ink,
    label,
  };
}
