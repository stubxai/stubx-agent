import blocklist from "../blocklist.json" with { type: "json" };

const HOMO = new Map(
  [
    ["а", "a"], ["е", "e"], ["о", "o"], ["р", "p"], ["с", "c"], ["у", "y"], ["х", "x"], ["і", "i"], ["ѕ", "s"], ["ј", "j"], ["һ", "h"],
    ["г", "r"], ["в", "b"], ["к", "k"], ["м", "m"], ["н", "h"], ["п", "n"], ["т", "t"], ["и", "u"], ["ё", "e"], ["ԁ", "d"], ["ԛ", "q"], ["ԝ", "w"],
    ["А", "a"], ["Е", "e"], ["О", "o"], ["Р", "p"], ["С", "c"], ["Х", "x"], ["У", "y"], ["К", "k"], ["М", "m"], ["Т", "t"], ["Н", "h"], ["В", "b"],
    ["Г", "r"], ["П", "n"], ["И", "u"], ["Ё", "e"], ["І", "i"], ["Ј", "j"], ["Ѕ", "s"],
    ["α", "a"], ["ε", "e"], ["ο", "o"], ["ρ", "p"], ["τ", "t"], ["υ", "u"], ["χ", "x"], ["ι", "i"], ["κ", "k"], ["ν", "v"],
    ["β", "b"], ["γ", "y"], ["η", "n"], ["ζ", "z"], ["μ", "u"], ["π", "n"], ["ω", "w"],
    ["Α", "a"], ["Β", "b"], ["Ε", "e"], ["Ζ", "z"], ["Η", "h"], ["Ι", "i"], ["Κ", "k"], ["Μ", "m"], ["Ν", "n"], ["Ο", "o"], ["Ρ", "p"], ["Τ", "t"], ["Υ", "y"], ["Χ", "x"],
    ["Γ", "y"], ["Π", "n"], ["Ω", "w"],
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
  const noZw = nfkc.replace(/[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\u2800\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF9-\uFFFB]/g, "");
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
  return /\s/u.test(ch) || "/._,|+·•∙⋅–—-".includes(ch);
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
    if (singles >= chunks.length * 0.8 && /[1-9]/.test(joined)) {
      found = true;
      return;
    }
    const mixed = /[A-Z]/.test(joined) && /[a-z]/.test(joined);
    if (mixed && /[1-9]/.test(joined) && chunks.some((chunk) => chunk.length >= 8)) found = true;
  };
  const flushPiece = () => {
    if (!piece) return;
    if (piece !== "y" && piece !== "Y") parts.push(piece);
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

function flattenSeparators(text) {
  let out = "";
  let piece = "";
  const flush = () => {
    if (piece && piece !== "y" && piece !== "Y") out += piece;
    piece = "";
  };
  for (const ch of text) {
    if (isSplitter(ch)) flush();
    else piece += ch;
  }
  flush();
  return out;
}

function hasEvmAddress(flat) {
  if (/0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/i.test(flat)) return true;
  return /(?:^|[^0-9a-fA-F])[0-9a-fA-F]{40}(?![0-9a-fA-F])/.test(flat);
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
  if (hasEvmAddress(flattenSeparators(original))) pushHit(hits, seen, "base58", "direccion");

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
  const variants = [folded, leet(folded, "i"), leet(folded, "l")];
  for (const variant of variants) {
    for (const word of joinLooseLetters(wordsOf(variant))) {
      if (short.has(word)) pushHit(hits, seen, "short", word);
      if (handleNames.has(word)) pushHit(hits, seen, "handle", word);
    }
  }

  const compactForms = [...new Set(variants.map((variant) => compact(maskExceptions(variant))))];
  if (/\d+x/.test(compact(maskExceptions(folded)))) pushHit(hits, seen, "term", "Nx");
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
