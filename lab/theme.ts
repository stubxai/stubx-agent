export const PALETTE = {
  bg: "#071422",
  bgElev: "#10243f",
  text: "#f4f7fb",
  muted: "#d5deea",
  accent: "#ff2d6f",
  accentInk: "#14060c",
  line: "#8eaccf",
  ok: "#c8f5dc",
  attention: "#ffe3ad",
  risk: "#ffd0dc",
} as const;

export type Palette = typeof PALETTE;

function channel(hex: string, index: number): number {
  const raw = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
  const srgb = raw / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const r = channel(hex, 0);
  const g = channel(hex, 1);
  const b = channel(hex, 2);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
