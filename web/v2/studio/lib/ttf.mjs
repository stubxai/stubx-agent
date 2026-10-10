/** Lector TrueType mínimo (código MIT). Solo contornos, sin red. */

function tagName(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function findTable(view, tag) {
  const count = view.getUint16(4);
  for (let i = 0; i < count; i += 1) {
    const offset = 12 + i * 16;
    if (tagName(view, offset) === tag) {
      return { offset: view.getUint32(offset + 8), length: view.getUint32(offset + 12) };
    }
  }
  return null;
}

function parseCmap(view, table) {
  const count = view.getUint16(table.offset + 2);
  const subs = [];
  for (let i = 0; i < count; i += 1) {
    const offset = table.offset + 4 + i * 8;
    subs.push({
      platform: view.getUint16(offset),
      encoding: view.getUint16(offset + 2),
      offset: table.offset + view.getUint32(offset + 4),
    });
  }
  const rank = (sub) => {
    const format = view.getUint16(sub.offset);
    if (format !== 4 && format !== 12) return 0;
    if (sub.platform === 3 && (sub.encoding === 1 || sub.encoding === 10)) return 5;
    if (sub.platform === 0) return 4;
    return 2;
  };
  subs.sort((a, b) => rank(b) - rank(a));
  const chosen = subs.find((sub) => rank(sub) > 0);
  if (!chosen) return () => 0;
  const format = view.getUint16(chosen.offset);
  if (format === 12) return cmap12(view, chosen.offset);
  if (format === 4) return cmap4(view, chosen.offset);
  return () => 0;
}

function cmap4(view, offset) {
  const segCount = view.getUint16(offset + 6) / 2;
  let cursor = offset + 14;
  const endCode = [];
  for (let i = 0; i < segCount; i += 1) endCode.push(view.getUint16(cursor + i * 2));
  cursor += segCount * 2 + 2;
  const startCode = [];
  for (let i = 0; i < segCount; i += 1) startCode.push(view.getUint16(cursor + i * 2));
  cursor += segCount * 2;
  const idDelta = [];
  for (let i = 0; i < segCount; i += 1) idDelta.push(view.getInt16(cursor + i * 2));
  cursor += segCount * 2;
  const idRangeOffset = [];
  for (let i = 0; i < segCount; i += 1) idRangeOffset.push(view.getUint16(cursor + i * 2));
  const rangeBase = cursor;
  return (code) => {
    let seg = 0;
    while (seg < segCount && endCode[seg] < code) seg += 1;
    if (seg >= segCount || startCode[seg] > code) return 0;
    if (idRangeOffset[seg] === 0) return (code + idDelta[seg]) & 0xffff;
    const glyphOffset = rangeBase + seg * 2 + idRangeOffset[seg] + (code - startCode[seg]) * 2;
    const glyph = view.getUint16(glyphOffset);
    if (glyph === 0) return 0;
    return (glyph + idDelta[seg]) & 0xffff;
  };
}

function cmap12(view, offset) {
  const groups = view.getUint32(offset + 12);
  const items = [];
  let cursor = offset + 16;
  for (let i = 0; i < groups; i += 1) {
    items.push({
      start: view.getUint32(cursor),
      end: view.getUint32(cursor + 4),
      glyph: view.getUint32(cursor + 8),
    });
    cursor += 12;
  }
  return (code) => {
    let lo = 0;
    let hi = items.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const group = items[mid];
      if (code < group.start) hi = mid - 1;
      else if (code > group.end) lo = mid + 1;
      else return group.glyph + (code - group.start);
    }
    return 0;
  };
}

function parseSimple(view, offset) {
  const contours = view.getInt16(offset);
  let cursor = offset + 10;
  const ends = [];
  for (let i = 0; i < contours; i += 1) {
    ends.push(view.getUint16(cursor));
    cursor += 2;
  }
  const count = (ends[contours - 1] ?? -1) + 1;
  if (count <= 0) return [];
  const instruction = view.getUint16(cursor);
  cursor += 2 + instruction;
  const flags = [];
  while (flags.length < count) {
    const flag = view.getUint8(cursor);
    cursor += 1;
    flags.push(flag);
    if (flag & 8) {
      const repeat = view.getUint8(cursor);
      cursor += 1;
      for (let i = 0; i < repeat; i += 1) flags.push(flag);
    }
  }
  const xs = new Array(count);
  let x = 0;
  for (let i = 0; i < count; i += 1) {
    const flag = flags[i] ?? 0;
    if (flag & 2) {
      const delta = view.getUint8(cursor);
      cursor += 1;
      x += flag & 16 ? delta : -delta;
    } else if ((flag & 16) === 0) {
      x += view.getInt16(cursor);
      cursor += 2;
    }
    xs[i] = x;
  }
  const ys = new Array(count);
  let y = 0;
  for (let i = 0; i < count; i += 1) {
    const flag = flags[i] ?? 0;
    if (flag & 4) {
      const delta = view.getUint8(cursor);
      cursor += 1;
      y += flag & 32 ? delta : -delta;
    } else if ((flag & 32) === 0) {
      y += view.getInt16(cursor);
      cursor += 2;
    }
    ys[i] = y;
  }
  const out = [];
  let start = 0;
  for (const end of ends) {
    const points = [];
    for (let i = start; i <= end; i += 1) points.push({ x: xs[i], y: ys[i], on: ((flags[i] ?? 0) & 1) !== 0 });
    out.push(points);
    start = end + 1;
  }
  return out;
}

function transformPoints(contours, a, b, c, d, e, f) {
  return contours.map((contour) => contour.map((point) => ({
    x: a * point.x + b * point.y + e,
    y: c * point.x + d * point.y + f,
    on: point.on,
  })));
}

export function parseFont(bytes) {
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const view = new DataView(copy);
  const glyf = findTable(view, "glyf");
  const loca = findTable(view, "loca");
  const cmap = findTable(view, "cmap");
  const hhea = findTable(view, "hhea");
  const hmtx = findTable(view, "hmtx");
  const head = findTable(view, "head");
  const maxp = findTable(view, "maxp");
  if (!glyf || !loca || !cmap || !hhea || !hmtx || !head || !maxp) throw new Error("fuente incompleta");
  const unitsPerEm = view.getUint16(head.offset + 18);
  const indexToLocFormat = view.getInt16(head.offset + 50);
  const numGlyphs = view.getUint16(maxp.offset + 4);
  const ascender = view.getInt16(hhea.offset + 4);
  const descender = view.getInt16(hhea.offset + 6);
  const numberOfHMetrics = view.getUint16(hhea.offset + 34);
  const mapCode = parseCmap(view, cmap);
  const glyphOffset = (index) => {
    if (indexToLocFormat === 0) return view.getUint16(loca.offset + index * 2) * 2;
    return view.getUint32(loca.offset + index * 4);
  };
  const advanceOf = (index) => {
    if (numberOfHMetrics <= 0) return unitsPerEm;
    if (index < numberOfHMetrics) return view.getUint16(hmtx.offset + index * 4);
    return view.getUint16(hmtx.offset + (numberOfHMetrics - 1) * 4);
  };
  const cache = new Map();
  function contoursOf(index, depth) {
    if (cache.has(index)) return cache.get(index);
    if (depth > 8 || index < 0 || index >= numGlyphs) return [];
    const start = glyphOffset(index);
    const end = glyphOffset(index + 1);
    if (end <= start) {
      cache.set(index, []);
      return [];
    }
    const offset = glyf.offset + start;
    const count = view.getInt16(offset);
    const contours = count < 0 ? compositeContours(offset, depth) : parseSimple(view, offset);
    cache.set(index, contours);
    return contours;
  }
  function compositeContours(offset, depth) {
    let cursor = offset + 10;
    const out = [];
    let more = true;
    while (more) {
      const flags = view.getUint16(cursor);
      cursor += 2;
      const index = view.getUint16(cursor);
      cursor += 2;
      let arg1 = 0;
      let arg2 = 0;
      if (flags & 1) {
        arg1 = view.getInt16(cursor);
        arg2 = view.getInt16(cursor + 2);
        cursor += 4;
      } else {
        arg1 = view.getInt8(cursor);
        arg2 = view.getInt8(cursor + 1);
        cursor += 2;
      }
      let a = 1;
      let b = 0;
      let c = 0;
      let d = 1;
      if (flags & 8) {
        a = d = view.getInt16(cursor) / 16384;
        cursor += 2;
      } else if (flags & 64) {
        a = view.getInt16(cursor) / 16384;
        d = view.getInt16(cursor + 2) / 16384;
        cursor += 4;
      } else if (flags & 128) {
        a = view.getInt16(cursor) / 16384;
        b = view.getInt16(cursor + 2) / 16384;
        c = view.getInt16(cursor + 4) / 16384;
        d = view.getInt16(cursor + 6) / 16384;
        cursor += 8;
      }
      let e = 0;
      let f = 0;
      if (flags & 2) {
        e = arg1;
        f = arg2;
      } else {
        const parent = out.flat();
        const child = contoursOf(index, depth + 1).flat();
        const p1 = parent[arg1];
        const p2 = child[arg2];
        if (p1 && p2) {
          e = p1.x - p2.x;
          f = p1.y - p2.y;
        }
      }
      out.push(...transformPoints(contoursOf(index, depth + 1), a, b, c, d, e, f));
      more = (flags & 32) !== 0;
    }
    return out;
  }
  function glyphOf(index) {
    return { advance: advanceOf(index), contours: contoursOf(index, 0), missing: index === 0 };
  }
  return {
    unitsPerEm,
    ascender,
    descender,
    glyphOf,
    glyphFor: (ch) => glyphOf(mapCode(ch.codePointAt(0) ?? 0) || 0),
  };
}

export function measureFont(font, text, size) {
  const scale = size / font.unitsPerEm;
  let width = 0;
  for (const ch of String(text)) width += font.glyphFor(ch).advance * scale;
  return width;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true };
}

function contourSegments(points) {
  if (points.length === 0) return [];
  const ring = points.slice();
  if (!ring[0].on) {
    const last = ring[ring.length - 1];
    if (last?.on) ring.unshift(ring.pop());
    else ring.unshift(midpoint(ring[0], last));
  }
  const segments = [];
  const start = ring[0];
  let cursor = start;
  for (let i = 1; i <= ring.length; i += 1) {
    const next = ring[i % ring.length];
    if (next.on) {
      segments.push({ type: "L", x0: cursor.x, y0: cursor.y, x: next.x, y: next.y });
      cursor = next;
      continue;
    }
    const after = ring[(i + 1) % ring.length];
    const end = after.on ? after : midpoint(next, after);
    segments.push({ type: "Q", x0: cursor.x, y0: cursor.y, cx: next.x, cy: next.y, x: end.x, y: end.y });
    cursor = end;
    if (after.on) i += 1;
  }
  return segments;
}

function pushFlat(out, x0, y0, cx, cy, x1, y1, depth) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = cx - mx;
  const dy = cy - my;
  if (depth > 6 || dx * dx + dy * dy < 0.8) {
    out.push({ x: x1, y: y1 });
    return;
  }
  const c1x = (x0 + cx) / 2;
  const c1y = (y0 + cy) / 2;
  const c2x = (cx + x1) / 2;
  const c2y = (cy + y1) / 2;
  const midX = (c1x + c2x) / 2;
  const midY = (c1y + c2y) / 2;
  pushFlat(out, x0, y0, c1x, c1y, midX, midY, depth + 1);
  pushFlat(out, midX, midY, c2x, c2y, x1, y1, depth + 1);
}

export function glyphPolylines(font, ch, size) {
  const glyph = font.glyphFor(ch);
  const scale = size / font.unitsPerEm;
  const lines = [];
  for (const contour of glyph.contours) {
    const poly = [];
    let moved = false;
    for (const segment of contourSegments(contour)) {
      if (!moved) {
        poly.push({ x: segment.x0 * scale, y: segment.y0 * scale });
        moved = true;
      }
      if (segment.type === "L") poly.push({ x: segment.x * scale, y: segment.y * scale });
      else pushFlat(poly, segment.x0 * scale, segment.y0 * scale, segment.cx * scale, segment.cy * scale, segment.x * scale, segment.y * scale, 0);
    }
    if (poly.length > 2) lines.push(poly);
  }
  return { advance: glyph.advance * scale, missing: glyph.missing, lines };
}
