#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { validateMint } from "./input.js";
import { fetchBytes, fetchJson } from "./http.js";
import { readVerifyPolicy, repoRootFrom } from "./root.js";
import { buildReport, redactEndpoint } from "./report.js";
import { reportHtml, reportJson, reportMarkdown } from "./render.js";
import { RpcClient } from "./rpc.js";
import type { CanonicalToken } from "./types.js";

type Format = "json" | "md" | "html";

const USAGE = `Uso: verify <mint> [--format json|md|html] [--out dir]

Lee datos públicos de un mint SPL en mainnet-beta y escribe una ficha.
No firma, no envía transacciones y no usa claves.
RPC_URL sustituye el endpoint público por defecto.
`;

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return;
  }
  let mint: string | null = null;
  let format: Format | null = null;
  let outDir: string | null = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? "";
    if (arg === "--format") {
      format = parseFormat(args[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (arg.startsWith("--format=")) {
      format = parseFormat(arg.slice("--format=".length));
      continue;
    }
    if (arg === "--out") {
      outDir = args[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg.startsWith("--out=")) {
      outDir = arg.slice("--out=".length);
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Opción desconocida: ${arg}\n${USAGE}`);
      process.exit(1);
    }
    if (mint) {
      console.error(`Solo se acepta un mint.\n${USAGE}`);
      process.exit(1);
    }
    mint = arg;
  }
  if (!mint) {
    console.error(USAGE);
    process.exit(1);
  }
  const checked = validateMint(mint);
  if (!checked.ok) {
    console.error(checked.message);
    process.exit(1);
  }
  if (outDir !== null && outDir.length === 0) {
    console.error("Falta el directorio de --out.");
    process.exit(1);
  }
  const root = repoRootFrom(import.meta.url);
  const policy = readVerifyPolicy(root);
  const endpoint = process.env[policy.rpcUrlEnv]?.trim() || policy.defaultRpcUrl;
  assertMainnet(endpoint);
  const registry = loadRegistry(root);
  const rpc = new RpcClient({
    endpoint,
    timeoutMs: policy.timeoutMs,
    maxRetries: policy.maxRetries,
    backoffBaseMs: policy.backoffBaseMs,
    minIntervalMs: policy.minIntervalMs,
  });
  buildReport({
    mint: checked.mint,
    rpc,
    rpcEndpoint: redactEndpoint(endpoint),
    registry,
    attentionBps: policy.nonTechnicalAttentionBps,
    loadMetadata: (url, options) => fetchJson(url, { ...options, timeoutMs: policy.timeoutMs, maxBytes: policy.metadataMaxBytes, maxRetries: policy.maxRetries }),
    loadImage: (url, options) => fetchBytes(url, { ...options, timeoutMs: policy.timeoutMs, maxBytes: policy.imageMaxBytes, maxRetries: policy.maxRetries }),
  })
    .then((report) => {
      const formats: Format[] = format ? [format] : outDir ? ["json", "md", "html"] : ["json"];
      const rendered = {
        json: reportJson(report),
        md: reportMarkdown(report),
        html: reportHtml(report),
      };
      if (outDir) {
        mkdirSync(outDir, { recursive: true });
        for (const item of formats) {
          const ext = item === "md" ? "md" : item;
          writeFileSync(path.join(outDir, `${checked.mint}.${ext}`), rendered[item]);
        }
        console.error(`Ficha escrita en ${outDir} (${formats.join(", ")}). Parcial: ${report.partial ? "sí" : "no"}.`);
        return;
      }
      process.stdout.write(rendered[formats[0] ?? "json"]);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Error al construir la ficha.");
      process.exit(1);
    });
}

function parseFormat(value: string): Format {
  if (value === "json" || value === "md" || value === "html") {
    return value;
  }
  console.error("El formato tiene que ser json, md o html.");
  process.exit(1);
}

function assertMainnet(endpoint: string): void {
  let host = "";
  try {
    host = new URL(endpoint).hostname.toLowerCase();
  } catch {
    console.error("RPC_URL no es una URL.");
    process.exit(1);
  }
  if (host.includes("devnet") || host.includes("testnet")) {
    console.error("Esta versión solo lee mainnet-beta.");
    process.exit(1);
  }
}

function loadRegistry(root: string): CanonicalToken[] {
  const file = path.join(root, "verify", "registry", "canonical.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { tokens: CanonicalToken[] };
  return parsed.tokens;
}

main();
