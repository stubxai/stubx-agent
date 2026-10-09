/** PNG mínimo: RGB/RGBA, tEXt y el comentario obligatorio. */

const SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function concat(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function chunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const body = concat([typeBytes, data]);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(body));
  return out;
}

async function deflateBytes(data) {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflateBytes(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function textChunk(keyword, text) {
  const key = new TextEncoder().encode(keyword);
  const value = new TextEncoder().encode(text);
  const data = new Uint8Array(key.length + 1 + value.length);
  data.set(key, 0);
  data[key.length] = 0;
  data.set(value, key.length + 1);
  return chunk("tEXt", data);
}

export async function encodePng(rgba, width, height, comment) {
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), row + 1);
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const parts = [SIG, chunk("IHDR", ihdr)];
  if (comment) parts.push(textChunk("Comment", comment));
  parts.push(chunk("IDAT", await deflateBytes(raw)));
  parts.push(chunk("IEND", new Uint8Array()));
  return concat(parts);
}

export function parseChunks(png) {
  for (let i = 0; i < SIG.length; i += 1) {
    if (png[i] !== SIG[i]) throw new Error("PNG no válido");
  }
  const chunks = [];
  let offset = 8;
  while (offset + 8 <= png.length) {
    const length = new DataView(png.buffer, png.byteOffset + offset, 4).getUint32(0);
    const type = new TextDecoder().decode(png.subarray(offset + 4, offset + 8));
    const data = png.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}

export function readComments(png) {
  const comments = [];
  for (const item of parseChunks(png)) {
    if (item.type !== "tEXt") continue;
    const zero = item.data.indexOf(0);
    if (zero < 0) continue;
    const keyword = new TextDecoder().decode(item.data.subarray(0, zero));
    const text = new TextDecoder().decode(item.data.subarray(zero + 1));
    comments.push({ keyword, text });
  }
  return comments;
}

export function injectComment(png, text) {
  const chunks = parseChunks(png);
  const kept = chunks.filter((item) => {
    if (item.type !== "tEXt") return true;
    const zero = item.data.indexOf(0);
    const keyword = new TextDecoder().decode(item.data.subarray(0, Math.max(0, zero)));
    return keyword !== "Comment";
  });
  const parts = [SIG];
  let inserted = false;
  for (const item of kept) {
    if (item.type === "IEND" && !inserted) {
      parts.push(textChunk("Comment", text));
      inserted = true;
    }
    parts.push(chunk(item.type, item.data));
  }
  return concat(parts);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export async function decodePng(png) {
  const chunks = parseChunks(png);
  const ihdr = chunks.find((item) => item.type === "IHDR");
  if (!ihdr) throw new Error("PNG sin cabecera");
  const view = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength);
  const width = view.getUint32(0);
  const height = view.getUint32(4);
  const depth = ihdr.data[8];
  const color = ihdr.data[9];
  const interlace = ihdr.data[12];
  if (depth !== 8 || interlace !== 0 || (color !== 2 && color !== 6)) {
    throw new Error("PNG no soportado");
  }
  const channels = color === 6 ? 4 : 3;
  const idat = concat(chunks.filter((item) => item.type === "IDAT").map((item) => item.data));
  const raw = await inflateBytes(idat);
  const rgba = new Uint8ClampedArray(width * height * 4);
  const stride = width * channels;
  let prev = new Uint8Array(stride);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[offset];
    offset += 1;
    const row = new Uint8Array(stride);
    for (let i = 0; i < stride; i += 1) {
      const x = raw[offset + i] ?? 0;
      const left = i >= channels ? row[i - channels] : 0;
      const up = prev[i] ?? 0;
      const ul = i >= channels ? prev[i - channels] : 0;
      if (filter === 0) row[i] = x;
      else if (filter === 1) row[i] = (x + left) & 255;
      else if (filter === 2) row[i] = (x + up) & 255;
      else if (filter === 3) row[i] = (x + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) row[i] = (x + paeth(left, up, ul)) & 255;
      else throw new Error("filtro PNG desconocido");
    }
    offset += stride;
    prev = row;
    for (let x = 0; x < width; x += 1) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      rgba[dst] = row[src] ?? 0;
      rgba[dst + 1] = row[src + 1] ?? 0;
      rgba[dst + 2] = row[src + 2] ?? 0;
      rgba[dst + 3] = channels === 4 ? (row[src + 3] ?? 255) : 255;
    }
  }
  return { width, height, rgba };
}
