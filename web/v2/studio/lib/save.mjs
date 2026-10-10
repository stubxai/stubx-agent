// Guardar la imagen en cada dispositivo.
// iOS Safari descarga los blob: a Archivos y no a Fotos; ahí se usa la hoja de compartir
// (Guardar imagen) y, si no existe, la imagen se abre en una pestaña para mantenerla pulsada.

export const FILE_NAME = "studio.png";
export const REVOKE_MS = 60_000;

export function isIOS(nav) {
  if (!nav) return false;
  const ua = String(nav.userAgent || "");
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return nav.platform === "MacIntel" && Number(nav.maxTouchPoints) > 1;
}

export function canShareFiles(nav, file) {
  if (!nav || typeof nav.share !== "function" || typeof nav.canShare !== "function") return false;
  try {
    return nav.canShare({ files: [file] }) === true;
  } catch {
    return false;
  }
}

export function saveMode({ ios, share }) {
  if (ios && share) return "share";
  if (ios) return "open";
  return "download";
}
