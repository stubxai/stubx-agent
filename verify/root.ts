import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function repoRootFrom(moduleUrl: string): string {
  let dir = path.dirname(fileURLToPath(moduleUrl));
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(path.join(dir, "package.json")) && existsSync(path.join(dir, "verify", "policy", "limits.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error("No se encuentra la raíz del repositorio (verify/policy/limits.json).");
}

export function readVerifyPolicy(root: string): {
  version: string;
  defaultRpcUrl: string;
  rpcUrlEnv: string;
  fallbackRpcUrl: string;
  fallbackRpcUrlEnv: string;
  timeoutMs: number;
  maxRetries: number;
  backoffBaseMs: number;
  minIntervalMs: number;
  commitment: string;
  holderSampleLimit: number;
  nonTechnicalAttentionBps: number;
  metadataMaxBytes: number;
  imageMaxBytes: number;
  allowedRpcMethods: string[];
} {
  const file = path.join(root, "verify", "policy", "limits.json");
  return JSON.parse(readFileSync(file, "utf8")) as ReturnType<typeof readVerifyPolicy>;
}
