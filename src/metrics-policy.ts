/**
 * Política de medición. No recoge datos: solo declara lo que está prohibido
 * y busca en el texto de la web los patrones que lo romperían.
 * No hay contador, ni baliza, ni llamada a un tercero.
 */

export const METRICS_POLICY = {
  version: 1,
  decidedOn: "2026-10-09",
  clientMeasurement: false,
  cookies: false,
  thirdParties: false,
  storeIp: false,
  cloudflareWebAnalytics: false,
  aggregatedHitCounter: false,
  allowedPublicSignals: ["github_stars", "github_forks", "github_watchers"],
} as const;

/** Nombres partidos para que este archivo no contenga la cadena entera de una baliza. */
function marker(parts: readonly string[]): string {
  return parts.join("");
}

export const ANALYTICS_MARKERS: readonly string[] = [
  marker(["cloudflare", "insights"]),
  marker(["beacon", ".min.js"]),
  marker(["google", "-analytics"]),
  marker(["googletag", "manager"]),
  marker(["g", "tag("]),
  marker(["plausible", ".io"]),
  marker(["u", "mami"]),
  marker(["post", "hog"]),
  marker(["mix", "panel"]),
  marker(["hot", "jar"]),
  marker(["segment", ".com/analytics"]),
  marker(["document", ".cookie"]),
  marker(["cf", "-beacon"]),
  marker(["__cf", "Beacon"]),
  marker(["set", "-cookie"]),
];

export function analyticsHits(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const item of ANALYTICS_MARKERS) {
    if (lower.includes(item.toLowerCase())) {
      found.push(item);
    }
  }
  return found;
}
