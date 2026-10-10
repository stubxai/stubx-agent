/** Mapa de bits propio (código MIT). 5×7 más una fila de acento. */

export const FONT_H = 8;
const LETTER_H = 7;

const BASE = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  "3": [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b00001, 0b11110],
  "6": [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
};

const ACCENT = {
  Á: ["A", 0b00100],
  É: ["E", 0b00100],
  Í: ["I", 0b00100],
  Ó: ["O", 0b00100],
  Ú: ["U", 0b00100],
  Ü: ["U", 0b01010],
  Ñ: ["N", 0b01110],
};

const PUNCT = {
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b00110, 0b00100, 0b01000],
  "-": [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
  "·": [0b00000, 0b00000, 0b00000, 0b00100, 0b00000, 0b00000, 0b00000],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "?": [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b00000, 0b00100],
  "¿": [0b00100, 0b00000, 0b00100, 0b01000, 0b10000, 0b10001, 0b01110],
  "¡": [0b00100, 0b00000, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  ":": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  ";": [0b00000, 0b01100, 0b01100, 0b00000, 0b00110, 0b00100, 0b01000],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  '"': [0b01010, 0b01010, 0b10100, 0b00000, 0b00000, 0b00000, 0b00000],
  "(": [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ")": [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
};

const BOX = [0b11111, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11111];

export function displayChar(ch) {
  const upper = ch.toLocaleUpperCase("es-ES");
  return upper.length === 1 ? upper : ch;
}

export function glyphOf(ch) {
  const shown = displayChar(ch);
  if (shown === " ") return { rows: [0, 0, 0, 0, 0, 0, 0, 0], w: 3, missing: false, empty: true };
  if (ACCENT[shown]) {
    const [base, mark] = ACCENT[shown];
    return { rows: [mark, ...BASE[base]], w: 5, missing: false, empty: false };
  }
  if (BASE[shown]) return { rows: [0, ...BASE[shown]], w: 5, missing: false, empty: false };
  if (PUNCT[shown]) return { rows: [0, ...PUNCT[shown]], w: 5, missing: false, empty: false };
  return { rows: [0, ...BOX], w: 5, missing: true, empty: false };
}

export function bitAt(rows, col, row) {
  const line = rows[row] ?? 0;
  return (line & (1 << (4 - col))) !== 0;
}

export function inkSpan(ch) {
  const glyph = glyphOf(ch);
  if (glyph.empty) return null;
  let top = null;
  let bottom = null;
  for (let row = 0; row < FONT_H; row += 1) {
    for (let col = 0; col < glyph.w; col += 1) {
      if (!bitAt(glyph.rows, col, row)) continue;
      if (!top) top = { col, row };
      bottom = { col, row };
    }
  }
  if (!top || !bottom) return null;
  return { top, bottom, w: glyph.w };
}

export function measureText(text, fontSize) {
  const scale = fontSize / FONT_H;
  let width = 0;
  const shown = [...text].map(displayChar).join("");
  for (let i = 0; i < shown.length; i += 1) {
    const glyph = glyphOf(shown[i] ?? " ");
    width += glyph.w * scale;
    if (i < shown.length - 1) width += scale;
  }
  return width;
}

export function wrapText(text, maxWidth, fontSize) {
  const lines = [];
  const paragraphs = String(text ?? "").split(/\n/);
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let line = "";
    const pushWord = (word) => {
      if (measureText(word, fontSize) <= maxWidth) {
        line = word;
        return;
      }
      let chunk = "";
      for (const ch of word) {
        const next = chunk + ch;
        if (measureText(next, fontSize) <= maxWidth) chunk = next;
        else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (measureText(next, fontSize) <= maxWidth) line = next;
      else {
        if (line) lines.push(line);
        pushWord(word);
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}
