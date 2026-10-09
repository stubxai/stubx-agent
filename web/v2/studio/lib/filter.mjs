import blocklist from "../blocklist.json" with { type: "json" };

const HOMO = new Map(
  [
    ["а", "a"], ["е", "e"], ["о", "o"], ["р", "p"], ["с", "c"], ["у", "y"], ["х", "x"], ["і", "i"], ["ѕ", "s"], ["ј", "j"], ["һ", "h"],
    ["А", "a"], ["Е", "e"], ["О", "o"], ["Р", "p"], ["С", "c"], ["Х", "x"], ["У", "y"], ["К", "k"], ["М", "m"], ["Т", "t"], ["Н", "h"], ["В", "b"],
    ["α", "a"], ["ε", "e"], ["ο", "o"], ["ρ", "p"], ["τ", "t"], ["υ", "u"], ["χ", "x"], ["ι", "i"], ["κ", "k"], ["ν", "v"],
    ["Α", "a"], ["Β", "b"], ["Ε", "e"], ["Ζ", "z"], ["Η", "h"], ["Ι", "i"], ["Κ", "k"], ["Μ", "m"], ["Ν", "n"], ["Ο", "o"], ["Ρ", "p"], ["Τ", "t"], ["Υ", "y"], ["Χ", "x"],
  ].map(([from, to]) => [from, to]),
);

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_SET = new Set(BASE58);

function foldHomoglyphs(text) {
  let out = "";
  for (const ch of text) out += HOMO.get(ch) ?? ch;
  return out;
}

function stripMarks(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

function prepare(text) {
  const nfkc = String(text ?? "").normalize("NFKC");
  const noZw = nfkc.replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, "");
  const folded = stripMarks(foldHomoglyphs(noZw.toLowerCase()));
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
  return text.replace(/[\s.\-_\p{Extended_Pictographic}\uFE0F]/gu, "");
}

function wordsOf(text) {
  return text.split(/[^a-z]+/).filter(Boolean);
}

function termKey(term) {
  return compact(stripMarks(foldHomoglyphs(String(term).normalize("NFKC").toLowerCase())));
}

function pushHit(hits, seen, kind, term) {
  const id = `${kind}:${term}`;
  if (seen.has(id)) return;
  seen.add(id);
  hits.push({ kind, term });
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

  const base = original.replace(/\s+/g, "");
  let run = "";
  const isAddressRun = (value) => {
    if (value.length < 32) return false;
    const digits = (value.match(/[1-9]/g) ?? []).length;
    const uppers = (value.match(/[A-Z]/g) ?? []).length;
    const lowers = (value.match(/[a-z]/g) ?? []).length;
    if (lowers === 0 && uppers === 0) return digits > 0;
    if (/[a-z]{8}/.test(value)) return false;
    if (value.length > 44) return digits > 0 && uppers > 0;
    return digits > 0 || (uppers >= 4 && lowers >= 4);
  };
  const flush = () => {
    if (isAddressRun(run)) pushHit(hits, seen, "base58", "direccion");
    run = "";
  };
  for (const ch of base) {
    if (BASE58_SET.has(ch)) run += ch;
    else flush();
  }
  flush();

  const urlText = folded.replace(/\s+/g, "");
  if (/https?:\/\//.test(urlText) || /www\./.test(urlText)) pushHit(hits, seen, "url", "url");
  for (const domain of list.domains ?? []) {
    const needle = String(domain).toLowerCase().replace(/\s+/g, "");
    if (needle && urlText.includes(needle)) pushHit(hits, seen, "url", domain);
  }
  if (/[a-z0-9-]+\.(?:com|net|org|io|xyz|fun|me)\b/.test(urlText)) pushHit(hits, seen, "url", "url");

  for (const handle of list.handles ?? []) {
    const name = stripMarks(foldHomoglyphs(String(handle).normalize("NFKC").toLowerCase()));
    const re = new RegExp(`@\\s*${name}(?![a-z0-9])`, "i");
    if (re.test(folded)) pushHit(hits, seen, "handle", `@${handle}`);
  }

  const short = new Set((list.shortWords ?? []).map((word) => termKey(word)));
  const variants = [folded, leet(folded, "i"), leet(folded, "l")];
  for (const variant of variants) {
    for (const word of wordsOf(variant)) {
      if (short.has(word)) pushHit(hits, seen, "short", word);
    }
  }

  const compactForms = [...new Set(variants.map(compact))];
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
