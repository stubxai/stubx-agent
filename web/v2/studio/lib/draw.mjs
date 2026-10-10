/** Dibujo de titulares OFL sobre el lienzo. Código MIT. */

import { glyphPolylines, measureFont, parseFont } from "./ttf.mjs";

const cache = new Map();

export async function loadFace(file) {
  if (cache.has(file)) return cache.get(file);
  const pending = readAsset(file).then((bytes) => parseFont(bytes));
  cache.set(file, pending);
  return pending;
}

async function readAsset(file) {
  const url = new URL(`../assets/${file}`, import.meta.url);
  if (globalThis.process?.versions?.node) {
    const { readFile } = await import("node:fs/promises");
    return new Uint8Array(await readFile(url));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(file);
  return new Uint8Array(await response.arrayBuffer());
}

export function wrapFace(font, text, maxWidth, size) {
  const lines = [];
  for (const paragraph of String(text ?? "").split(/\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let line = "";
    const pushWord = (word) => {
      if (measureFont(font, word, size) <= maxWidth) {
        line = word;
        return;
      }
      let chunk = "";
      for (const ch of word) {
        const next = chunk + ch;
        if (measureFont(font, next, size) <= maxWidth) chunk = next;
        else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (measureFont(font, next, size) <= maxWidth) line = next;
      else {
        if (line) lines.push(line);
        pushWord(word);
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function lineBox(font, size) {
  const ascent = Math.max(0, (font.ascender / font.unitsPerEm) * size);
  const descent = Math.max(0, Math.abs(font.descender / font.unitsPerEm) * size);
  return { ascent, descent, step: ascent + descent + size * 0.12 };
}

export function fitFace(font, text, zone, maxSize, minSize) {
  const value = String(text ?? "");
  if (!value.trim() || zone.h <= 0 || zone.w <= 0) return { lines: [], size: minSize, fits: !value.trim() };
  let size = Math.ceil(maxSize);
  const floor = Math.max(8, Math.floor(minSize));
  while (size > floor) {
    const lines = wrapFace(font, value, zone.w, size);
    if (lines.length * lineBox(font, size).step <= zone.h) return { lines, size, fits: true };
    size -= 1;
  }
  const lines = wrapFace(font, value, zone.w, floor);
  const maxLines = Math.max(0, Math.floor(zone.h / lineBox(font, floor).step));
  return { lines: lines.slice(0, maxLines), size: floor, fits: lines.length <= maxLines };
}

function raster(lines, width, height) {
  const mask = new Uint8Array(width * height);
  const edges = [];
  for (const line of lines) {
    for (let i = 0; i < line.length; i += 1) {
      const a = line[i];
      const b = line[(i + 1) % line.length];
      if (a.y === b.y) continue;
      const down = b.y > a.y;
      edges.push({
        y0: down ? a.y : b.y,
        y1: down ? b.y : a.y,
        x: down ? a.x : b.x,
        dx: (b.x - a.x) / (b.y - a.y),
        wind: down ? 1 : -1,
      });
    }
  }
  for (let y = 0; y < height; y += 1) {
    const scan = y + 0.5;
    const hits = [];
    for (const edge of edges) {
      if (scan < edge.y0 || scan >= edge.y1) continue;
      hits.push({ x: edge.x + (scan - edge.y0) * edge.dx, wind: edge.wind });
    }
    if (hits.length === 0) continue;
    hits.sort((a, b) => a.x - b.x);
    let wind = 0;
    let from = 0;
    for (const hit of hits) {
      if (wind !== 0) {
        const x0 = Math.max(0, Math.ceil(from));
        const x1 = Math.min(width, Math.floor(hit.x));
        for (let x = x0; x < x1; x += 1) mask[y * width + x] = 255;
      }
      wind += hit.wind;
      from = hit.x;
    }
  }
  return mask;
}

function dilate(mask, width, height, radius) {
  const r = Math.ceil(radius);
  if (r <= 0) return mask;
  const out = new Uint8Array(mask.length);
  const r2 = radius * radius;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x] === 0) continue;
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(height - 1, y + r);
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      for (let yy = y0; yy <= y1; yy += 1) {
        const dy = yy - y;
        for (let xx = x0; xx <= x1; xx += 1) {
          const dx = xx - x;
          if (dx * dx + dy * dy <= r2) out[yy * width + xx] = 255;
        }
      }
    }
  }
  return out;
}

function blur(mask, width, height, radius) {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  const win = r * 2 + 1;
  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = -r; x <= r; x += 1) sum += mask[y * width + Math.min(width - 1, Math.max(0, x))] ?? 0;
    for (let x = 0; x < width; x += 1) {
      tmp[y * width + x] = Math.round(sum / win);
      const leave = x - r;
      const enter = x + r + 1;
      sum -= mask[y * width + Math.min(width - 1, Math.max(0, leave))] ?? 0;
      sum += mask[y * width + Math.min(width - 1, Math.max(0, enter))] ?? 0;
    }
  }
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -r; y <= r; y += 1) sum += tmp[Math.min(height - 1, Math.max(0, y)) * width + x] ?? 0;
    for (let y = 0; y < height; y += 1) {
      out[y * width + x] = Math.round(sum / win);
      const leave = y - r;
      const enter = y + r + 1;
      sum -= tmp[Math.min(height - 1, Math.max(0, leave)) * width + x] ?? 0;
      sum += tmp[Math.min(height - 1, Math.max(0, enter)) * width + x] ?? 0;
    }
  }
  return out;
}

function blit(rgba, width, height, mask, mw, mh, ox, oy, color, alpha, sample) {
  const step = sample;
  for (let y = 0; y < mh; y += step) {
    const dy = oy + Math.floor(y / step);
    if (dy < 0 || dy >= height) continue;
    for (let x = 0; x < mw; x += step) {
      const dx = ox + Math.floor(x / step);
      if (dx < 0 || dx >= width) continue;
      let cover = 0;
      let count = 0;
      for (let sy = 0; sy < step; sy += 1) {
        for (let sx = 0; sx < step; sx += 1) {
          const mx = x + sx;
          const my = y + sy;
          if (mx >= mw || my >= mh) continue;
          cover += mask[my * mw + mx] ?? 0;
          count += 1;
        }
      }
      const a = (cover / (count * 255)) * alpha;
      if (a <= 0.004) continue;
      const i = (dy * width + dx) * 4;
      const keep = 1 - a;
      rgba[i] = Math.round((rgba[i] ?? 0) * keep + color[0] * a);
      rgba[i + 1] = Math.round((rgba[i + 1] ?? 0) * keep + color[1] * a);
      rgba[i + 2] = Math.round((rgba[i + 2] ?? 0) * keep + color[2] * a);
      rgba[i + 3] = 255;
    }
  }
}

function shownChar(ch) {
  const upper = ch.toLocaleUpperCase("es-ES");
  return [...upper][0] ?? ch;
}

export function drawFace(rgba, width, height, font, lines, x, baseline, size, role, glyphs, style) {
  const sample = style.crisp ? 1 : 2;
  const { ascent, descent, step } = lineBox(font, size);
  lines.forEach((line, index) => {
    const y = baseline + index * step;
    const placed = [];
    let pen = x;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const ch of line) {
      const poly = glyphPolylines(font, ch, size);
      if (ch !== " ") {
        placed.push({ ch, pen, poly });
        for (const contour of poly.lines) {
          for (const point of contour) {
            minX = Math.min(minX, pen + point.x);
            maxX = Math.max(maxX, pen + point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          }
        }
      }
      pen += poly.advance;
    }
    for (const item of placed) {
      glyphs.push({
        ch: shownChar(item.ch),
        x: item.pen,
        y: y - ascent,
        size,
        w: item.poly.advance,
        h: ascent + descent,
        role,
        missing: item.poly.missing,
      });
    }
    if (!Number.isFinite(minX)) return;
    const pad = Math.ceil(size * Math.max(style.strokeWidth ?? 0, style.glowRadius ?? 0, style.shadow ?? 0) + 3);
    const ox = Math.floor(minX) - pad;
    const oyTop = Math.floor(y - maxY) - pad;
    const mw = Math.max(1, Math.ceil((maxX - minX) + pad * 2)) * sample;
    const mh = Math.max(1, Math.ceil((maxY - minY) + pad * 2)) * sample;
    const shifted = [];
    for (const item of placed) {
      for (const contour of item.poly.lines) {
        shifted.push(contour.map((point) => ({
          x: (item.pen + point.x - ox) * sample,
          y: (y - point.y - oyTop) * sample,
        })));
      }
    }
    const mask = raster(shifted, mw, mh);
    const fill = style.fill;
    const stroke = style.stroke;
    const glow = style.glow;
    if (glow) {
      const soft = blur(mask, mw, mh, (style.glowRadius ?? 0.2) * size * sample);
      blit(rgba, width, height, soft, mw, mh, ox, oyTop, glow, style.glowAlpha ?? 0.9, sample);
      if (style.glow2) blit(rgba, width, height, soft, mw, mh, ox - Math.round(size * 0.03), oyTop, style.glow2, 0.55, sample);
    }
    if (style.shadow) {
      const shift = Math.max(1, Math.round(size * style.shadow));
      blit(rgba, width, height, mask, mw, mh, ox + shift, oyTop + shift, style.shadowColor ?? [8, 6, 12], style.shadowAlpha ?? 0.9, sample);
    }
    if (stroke && (style.strokeWidth ?? 0) > 0) {
      const thick = dilate(mask, mw, mh, style.strokeWidth * size * sample);
      blit(rgba, width, height, thick, mw, mh, ox, oyTop, stroke, style.alpha ?? 1, sample);
    }
    blit(rgba, width, height, mask, mw, mh, ox, oyTop, fill, style.alpha ?? 1, sample);
  });
}

export function letterInk(font, ch, size) {
  const poly = glyphPolylines(font, ch, size);
  let top = 0;
  let bottom = 0;
  for (const line of poly.lines) {
    for (const point of line) {
      top = Math.max(top, point.y);
      bottom = Math.min(bottom, point.y);
    }
  }
  return top - bottom;
}

export function capInk(font, size) {
  return letterInk(font, "H", size);
}
