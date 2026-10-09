import blocklist from "../blocklist.json" with { type: "json" };

const HOMO = new Map(
  [
    ["а", "a"], ["е", "e"], ["о", "o"], ["р", "p"], ["с", "c"], ["у", "y"], ["х", "x"], ["і", "i"], ["ѕ", "s"], ["ј", "j"], ["һ", "h"],
    ["А", "a"], ["Е", "e"], ["О", "o"], ["Р", "p"], ["С", "c"], ["Х", "x"], ["У", "y"], ["К", "k"], ["М", "m"], ["Т", "t"], ["Н", "h"], ["В", "b"],
    ["α", "a"], ["ε", "e"], ["ο", "o"], ["ρ", "p"], ["τ", "t"], ["υ", "u"], ["χ", "x"], ["ι", "i"], ["κ", "k"], ["ν", "v"],
    ["Α", "a"], ["Β", "b"], ["Ε", "e"], ["Ζ", "z"], ["Η", "h"], ["Ι", "i"], ["Κ", "k"], ["Μ", "m"], ["Ν", "n"], ["Ο", "o"], ["Ρ", "p"], ["Τ", "t"], ["Υ", "y"], ["Χ", "x"],
  ].map(([from, to]) => [from, to]),
);

const SMALL = new Map(
  [
    ["ᴀ", "a"], ["ʙ", "b"], ["ᴄ", "c"], ["ᴅ", "d"], ["ᴇ", "e"], ["ꜰ", "f"], ["ɢ", "g"], ["ʜ", "h"], ["ɪ", "i"], ["ᴊ", "j"],
    ["ᴋ", "k"], ["ʟ", "l"], ["ᴍ", "m"], ["ɴ", "n"], ["ᴏ", "o"], ["ᴘ", "p"], ["ʀ", "r"], ["ꜱ", "s"], ["ᴛ", "t"], ["ᴜ", "u"],
    ["ᴠ", "v"], ["ᴡ", "w"], ["ʏ", "y"], ["ᴢ", "z"], ["×", "x"], ["✕", "x"], ["✖", "x"],
  ].map(([from, to]) => [from, to]),
);

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_SET = new Set(BASE58);
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(value, bits) {
  return (value >>> bits) | (value << (32 - bits));
}

export function sha256Hex(text) {
  const bytes = new TextEncoder().encode(String(text));
  const total = ((bytes.length + 9 + 63) >> 6) << 6;
  const data = new Uint8Array(total);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  const bits = bytes.length * 8;
  view.setUint32(total - 8, Math.floor(bits / 0x100000000));
  view.setUint32(total - 4, bits >>> 0);
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);
  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((part) => part.toString(16).padStart(8, "0")).join("");
}

function foldHomoglyphs(text) {
  let out = "";
  for (const ch of text) out += HOMO.get(ch) ?? ch;
  return out;
}

function foldSmall(text) {
  let out = "";
  for (const ch of text) out += SMALL.get(ch) ?? ch;
  return out;
}

function stripMarks(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

function prepare(text) {
  const nfkc = String(text ?? "").normalize("NFKC");
  const noZw = nfkc.replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, "");
  const folded = stripMarks(foldHomoglyphs(foldSmall(noZw).toLowerCase()));
  return { original: noZw, folded };
}

function leet(text, one) {
  return text
    .replaceAll("0", "o")
    .replaceAll("3", "e")
    .replaceAll("4", "a")
    .replaceAll("5", "s")
    .replaceAll("7", "t")
    .replaceAll("@", "a")
    .replaceAll("$", "s")
    .replaceAll("1", one);
}

function compact(text) {
  return text.replace(/[^\p{L}\p{N}]+/gu, "");
}

function wordsOf(text) {
  return text.split(/[^a-z]+/).filter(Boolean);
}

function joinLooseLetters(words) {
  const out = [];
  let run = "";
  for (const word of words) {
    if (word.length === 1) {
      run += word;
      continue;
    }
    if (run) {
      out.push(run);
      run = "";
    }
    out.push(word);
  }
  if (run) out.push(run);
  return out;
}

function termKey(term) {
  return compact(stripMarks(foldHomoglyphs(foldSmall(String(term).normalize("NFKC")).toLowerCase())));
}

function maskExceptions(text) {
  return text.replace(/unofficial/g, " ").replace(/no(?:[^\p{L}\p{N}]+)?oficial/gu, " ");
}

function pushHit(hits, seen, kind, term) {
  const id = `${kind}:${term}`;
  if (seen.has(id)) return;
  seen.add(id);
  hits.push({ kind, term });
}

function isSplitter(ch) {
  return /[\s/\-·•∙⋅–—]/.test(ch);
}

function hasBase58Address(text) {
  let piece = "";
  let parts = [];
  let found = false;
  const consider = (chunks) => {
    if (found || chunks.length === 0) return;
    for (const chunk of chunks) {
      if (chunk.length >= 32 && chunk.length <= 44) found = true;
    }
    const joined = chunks.join("");
    if (joined.length < 32 || joined.length > 44 || chunks.length === 1) return;
    if (chunks.every((chunk) => chunk.length >= 4)) {
      found = true;
      return;
    }
    const singles = chunks.filter((chunk) => chunk.length === 1).length;
    if (singles >= chunks.length * 0.8 && /[1-9]/.test(joined)) found = true;
  };
  const flushPiece = () => {
    if (!piece) return;
    parts.push(piece);
    piece = "";
  };
  const flushChain = () => {
    flushPiece();
    consider(parts);
    parts = [];
  };
  for (const ch of text) {
    if (BASE58_SET.has(ch)) piece += ch;
    else if (isSplitter(ch)) flushPiece();
    else flushChain();
  }
  flushChain();
  return found;
}

export function analyze(text, list = blocklist) {
  const hits = [];
  const seen = new Set();
  const { original, folded } = prepare(text);
  const emojiSource = original.replace(/\uFE0F/g, "");
  for (const sequence of list.emojiSequences ?? []) {
    if (sequence && emojiSource.includes(sequence)) pushHit(hits, seen, "emoji", sequence);
  }
  for (const emoji of list.emojis ?? []) {
    if (emoji && emojiSource.includes(emoji)) pushHit(hits, seen, "emoji", emoji);
  }

  if (hasBase58Address(original)) pushHit(hits, seen, "base58", "direccion");
  const flat = original.replace(/[\s/\-·•∙⋅–—]+/g, "");
  if (/0x[0-9a-fA-F]{40}/.test(flat)) pushHit(hits, seen, "base58", "direccion");

  const urlText = folded.replace(/\s+/g, "");
  const urlSquash = compact(folded);
  if (/https?:\/\//.test(urlText) || /www\./.test(urlText)) pushHit(hits, seen, "url", "url");
  for (const domain of list.domains ?? []) {
    const needle = String(domain).toLowerCase().replace(/\s+/g, "");
    const squashed = compact(needle);
    if ((needle && urlText.includes(needle)) || (squashed && urlSquash.includes(squashed))) pushHit(hits, seen, "url", domain);
  }
  if (/[a-z0-9-]+\.(?:com|net|org|io|xyz|fun|me)\b/.test(urlText)) pushHit(hits, seen, "url", "url");

  const handleNames = new Set((list.handles ?? []).map((handle) => termKey(handle)));
  for (const handle of list.handles ?? []) {
    const name = termKey(handle);
    if (!name) continue;
    const re = new RegExp(`@\\s*${name}(?![a-z0-9])`, "i");
    if (re.test(folded)) pushHit(hits, seen, "handle", `@${handle}`);
  }

  const short = new Set((list.shortWords ?? []).map((word) => termKey(word)));
  const names = new Set(list.nameHashes ?? []);
  const variants = [folded, leet(folded, "i"), leet(folded, "l")];
  for (const variant of variants) {
    for (const word of joinLooseLetters(wordsOf(variant))) {
      if (short.has(word)) pushHit(hits, seen, "short", word);
      if (handleNames.has(word)) pushHit(hits, seen, "handle", word);
      if (names.has(sha256Hex(word))) pushHit(hits, seen, "name", "nombre");
    }
  }

  const compactForms = [...new Set(variants.map((variant) => compact(maskExceptions(variant))))];
  for (const term of list.terms ?? []) {
    const key = termKey(term);
    if (!key || short.has(key)) continue;
    if (compactForms.some((form) => form.includes(key))) pushHit(hits, seen, "term", term);
  }

  return { blocked: hits.length > 0, hits };
}

export function exportAllowed(title, body, list = blocklist) {
  return !analyze(title, list).blocked && !analyze(body, list).blocked;
}

export { blocklist };
