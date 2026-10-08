import { createHash } from "node:crypto";

export type BytesResult = {
  ok: true;
  url: string;
  status: number;
  bytes: Uint8Array;
  fetchedAt: string;
} | {
  ok: false;
  url: string | null;
  status: number | null;
  error: string;
  fetchedAt: string;
};

export type JsonResult = {
  ok: true;
  url: string;
  status: number;
  json: unknown;
  fetchedAt: string;
} | {
  ok: false;
  url: string | null;
  status: number | null;
  error: string;
  fetchedAt: string;
};

type HttpOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  fetchImpl?: typeof fetch;
};

const CID_RE = /(?:baf[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})/;

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://dweb.link/ipfs/",
  "https://w3s.link/ipfs/",
  "https://ipfs.io/ipfs/",
];

export function extractCid(value: string): string | null {
  const match = CID_RE.exec(value);
  return match ? match[0] : null;
}

export function isPublicHttps(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") {
    return false;
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return false;
  }
  if (host === "0.0.0.0" || host === "::1" || host.startsWith("127.")) {
    return false;
  }
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(host)) {
    return false;
  }
  return true;
}

export function candidateUrls(uri: string): string[] {
  const urls: string[] = [];
  if (isPublicHttps(uri)) {
    urls.push(uri);
  }
  const cid = extractCid(uri);
  if (cid) {
    for (const gateway of GATEWAYS) {
      const next = `${gateway}${cid}`;
      if (!urls.includes(next)) {
        urls.push(next);
      }
    }
  }
  return urls;
}

export async function fetchBytes(url: string, options: HttpOptions = {}): Promise<BytesResult> {
  const now = options.now ?? (() => new Date());
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = options.random ?? Math.random;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxBytes = options.maxBytes ?? 1_000_000;
  const maxRetries = options.maxRetries ?? 2;
  const backoffBaseMs = options.backoffBaseMs ?? 500;
  const urls = candidateUrls(url);
  if (urls.length === 0) {
    return { ok: false, url: null, status: null, error: "La URI no es https público.", fetchedAt: now().toISOString() };
  }
  let last: BytesResult = { ok: false, url: urls[0] ?? null, status: null, error: "sin respuesta", fetchedAt: now().toISOString() };
  for (const candidate of urls) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const fetchedAt = now().toISOString();
      try {
        const response = await fetchImpl(candidate, {
          method: "GET",
          redirect: "follow",
          headers: { accept: "*/*", "user-agent": "stubx-verify/0.1" },
          signal: AbortSignal.timeout(timeoutMs),
        });
        const finalUrl = response.url || candidate;
        if (!finalUrl.startsWith("https:")) {
          last = { ok: false, url: candidate, status: response.status, error: "La redirección no es https.", fetchedAt };
          break;
        }
        if (response.status === 429 || response.status === 408 || response.status >= 500) {
          last = { ok: false, url: candidate, status: response.status, error: `HTTP ${response.status}`, fetchedAt };
          if (attempt < maxRetries) {
            await sleep(backoffBaseMs * 2 ** attempt + Math.floor(random() * 100));
            continue;
          }
          break;
        }
        if (response.status < 200 || response.status >= 300) {
          last = { ok: false, url: candidate, status: response.status, error: `HTTP ${response.status}`, fetchedAt };
          break;
        }
        const bytes = await readLimited(response, maxBytes);
        return { ok: true, url: finalUrl, status: response.status, bytes, fetchedAt };
      } catch (error) {
        last = {
          ok: false,
          url: candidate,
          status: null,
          error: error instanceof Error ? error.message : "error de red",
          fetchedAt,
        };
        if (attempt < maxRetries) {
          await sleep(backoffBaseMs * 2 ** attempt + Math.floor(random() * 100));
          continue;
        }
      }
    }
  }
  return last;
}

export async function fetchJson(url: string, options: HttpOptions = {}): Promise<JsonResult> {
  const result = await fetchBytes(url, options);
  if (!result.ok) {
    return result;
  }
  try {
    const json = JSON.parse(new TextDecoder().decode(result.bytes)) as unknown;
    return { ok: true, url: result.url, status: result.status, json, fetchedAt: result.fetchedAt };
  } catch {
    return { ok: false, url: result.url, status: result.status, error: "El contenido no es JSON.", fetchedAt: result.fetchedAt };
  }
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) {
    const raw = new Uint8Array(await response.arrayBuffer());
    if (raw.byteLength > maxBytes) {
      throw new Error("Respuesta mayor que el límite.");
    }
    return raw;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const step = await reader.read();
    if (step.done) {
      break;
    }
    total += step.value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Respuesta mayor que el límite.");
    }
    chunks.push(step.value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
