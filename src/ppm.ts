import path from "node:path";
import { isRecord, readStrictJson } from "./json-file.js";
import type { LoadedPolicy } from "./limits.js";

export type PpmBox = {
  status: "pending" | "repo-tested";
  provenByTests: boolean;
  ppmMarked: boolean;
  publicEvidence: string | null;
  summary: string;
  summaryEn: string;
};

export type PpmReport = {
  schema: "stubx.ppm/v0";
  package: "@stubx/agents";
  packageVersion: string;
  policyId: string;
  policyVersion: string;
  policySha256: string;
  tokenMint: string;
  approved: boolean;
  ppmMarkedCount: number;
  network: false;
  signing: false;
  scope: string;
  boxes: {
    wallet: PpmBox;
    logs: PpmBox;
    limits: PpmBox;
    killSwitch: PpmBox & { publicDrill: boolean; scope: "ops-social" };
  };
};

export function readPackageVersion(root: string): string | null {
  const read = readStrictJson(path.join(root, "package.json"), 256 * 1024);
  if (!read.ok || !isRecord(read.value)) {
    return null;
  }
  if (read.value.name !== "@stubx/agents" || typeof read.value.version !== "string") {
    return null;
  }
  return read.value.version;
}

export function buildPpmReport(input: {
  packageVersion: string;
  policy: LoadedPolicy;
  mint: string;
}): PpmReport {
  return {
    schema: "stubx.ppm/v0",
    package: "@stubx/agents",
    packageVersion: input.packageVersion,
    policyId: input.policy.id,
    policyVersion: input.policy.version,
    policySha256: input.policy.sha256,
    tokenMint: input.mint,
    approved: false,
    ppmMarkedCount: 0,
    network: false,
    signing: false,
    scope: "Tests in this repository and this version only. Public PPM boxes stay unmarked.",
    boxes: {
      wallet: {
        status: "pending",
        provenByTests: false,
        ppmMarked: false,
        publicEvidence: null,
        summary: "No hay wallet del agente y este paquete no crea ninguna. La casilla sigue pendiente.",
        summaryEn: "The agent has no wallet and this package does not create one. The box stays pending.",
      },
      logs: {
        status: "pending",
        provenByTests: false,
        ppmMarked: false,
        publicEvidence: null,
        summary:
          "Hay un formato de entrada con huella sha256, solo en memoria. El registro público de solo-añadir es la fase P4. La casilla sigue pendiente.",
        summaryEn:
          "A sha256 log entry type exists in memory only. The public append-only log is phase P4. The box stays pending.",
      },
      limits: {
        status: "repo-tested",
        provenByTests: true,
        ppmMarked: false,
        publicEvidence: null,
        summary:
          "Los límites v1 están aplicados en código y tienen tests negativos en este repositorio. La casilla pública no se marca: falta un enlace de CI y el OK legal.",
        summaryEn:
          "Limits v1 are enforced in code and covered by negative tests in this repository. The public box is not marked.",
      },
      killSwitch: {
        status: "repo-tested",
        provenByTests: true,
        ppmMarked: false,
        publicEvidence: null,
        publicDrill: false,
        scope: "ops-social",
        summary:
          "Lee state/killswitch.json y es fail-closed, cubierto por tests de este repositorio. El simulacro público es la fase P3. No pausa transferencias ni congela cuentas.",
        summaryEn:
          "Reads state/killswitch.json and fails closed. Covered by tests in this repository. The public drill is phase P3. It cannot pause transfers or freeze accounts.",
      },
    },
  };
}

export function evaluatePpmHonesty(report: PpmReport): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (report.approved !== false) {
    problems.push("approved");
  }
  if (report.ppmMarkedCount !== 0) {
    problems.push("ppmMarkedCount");
  }
  if (report.signing !== false) {
    problems.push("signing");
  }
  if (report.network !== false) {
    problems.push("network");
  }
  const named = [
    ["wallet", report.boxes.wallet],
    ["logs", report.boxes.logs],
    ["limits", report.boxes.limits],
    ["killSwitch", report.boxes.killSwitch],
  ] as const;
  for (const [name, box] of named) {
    if (box.ppmMarked !== false) {
      problems.push(`${name}.ppmMarked`);
    }
    if (box.publicEvidence !== null) {
      problems.push(`${name}.publicEvidence`);
    }
  }
  if (report.boxes.wallet.status !== "pending" || report.boxes.wallet.provenByTests !== false) {
    problems.push("wallet");
  }
  if (report.boxes.logs.status !== "pending" || report.boxes.logs.provenByTests !== false) {
    problems.push("logs");
  }
  if (report.boxes.limits.status !== "repo-tested" || report.boxes.limits.provenByTests !== true) {
    problems.push("limits");
  }
  if (
    report.boxes.killSwitch.status !== "repo-tested" ||
    report.boxes.killSwitch.provenByTests !== true ||
    report.boxes.killSwitch.publicDrill !== false ||
    report.boxes.killSwitch.scope !== "ops-social"
  ) {
    problems.push("killSwitch");
  }
  return { ok: problems.length === 0, problems };
}
