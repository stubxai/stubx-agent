/** Estilos de titular. Las fuentes están en assets/ con licencia OFL. */

export const HEADLINES = [
  { id: "meme", nombre: { es: "Meme", en: "Meme" }, family: "Studio Anton", file: "Anton-Regular.ttf" },
  { id: "comic", nombre: { es: "Cómic", en: "Comic" }, family: "Studio Bangers", file: "Bangers-Regular.ttf" },
  { id: "neon", nombre: { es: "Neón", en: "Neon" }, family: "Studio Audiowide", file: "Audiowide-Regular.ttf" },
  { id: "pixel", nombre: { es: "Pixel", en: "Pixel" }, family: "Studio Pixel", file: "Silkscreen-Bold.ttf" },
  { id: "bold", nombre: { es: "Bold", en: "Bold" }, family: "Studio Archivo", file: "ArchivoBlack-Regular.ttf" },
];

export const BODY_FONT = "BarlowCondensed-SemiBold.ttf";
export const NOTICE_FONT = "SairaExtraCondensed-SemiBold.ttf";

export function headlineById(id) {
  return HEADLINES.find((item) => item.id === id) ?? HEADLINES[0];
}
