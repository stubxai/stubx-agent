import path from "node:path";
import { isRecord, readStrictJson } from "./json-file.js";
import type { LoadedPolicy } from "./limits.js";

export type PpmBox = {
  status: "pending" | "repo-tested";
  provenByTests: boolean;
  ppmMarked: boolean;
  markedOn: string | null;
  publicEvidence: string | null;
  summary: string;
  summaryEn: string;
};

/**
 * Public evidence behind the two marked boxes (limits and kill-switch), reviewed
 * on 2026-10-05 with legal sign-off. Wallet and logs stay unmarked.
 * Placeholders `__URL_…__` must be replaced by real Actions run URLs before
 * merging: evaluatePpmHonesty rejects anything that is not a run URL of this
 * repository, so CI stays red while a placeholder is left.
 */
export const RUN_URL = /^https:\/\/github\.com\/stubxai\/stubx-agent\/actions\/runs\/[0-9]+$/;
export const PPM_MARKED_ON = "2026-10-05";
export const LIMITS_CI_RUN = "https://github.com/stubxai/stubx-agent/actions/runs/37278171372";
export const KILL_SWITCH_DRILL_RUNS: readonly string[] = [
  "https://github.com/stubxai/stubx-agent/actions/runs/36264436020",
  "https://github.com/stubxai/stubx-agent/actions/runs/36397668286",
  "https://github.com/stubxai/stubx-agent/actions/runs/37284177840",
];

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
    killSwitch: PpmBox & { publicDrill: boolean; publicDrills: readonly string[]; scope: "ops-social" };
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
    ppmMarkedCount: 2,
    network: false,
    signing: false,
    scope:
      "Two public PPM boxes are marked (limits and kill-switch, 2026-10-05) after review with legal sign-off. Wallet and logs stay unmarked. A marked box is not an audit: a green run only proves what it checks, in that version of the code.",
    boxes: {
      wallet: {
        status: "pending",
        provenByTests: false,
        ppmMarked: false,
        markedOn: null,
        publicEvidence: null,
        summary: "No hay wallet del agente y este paquete no crea ninguna. La casilla sigue pendiente.",
        summaryEn: "The agent has no wallet and this package does not create one. The box stays pending.",
      },
      logs: {
        status: "pending",
        provenByTests: false,
        ppmMarked: false,
        markedOn: null,
        publicEvidence: null,
        summary:
          "Hay un formato de entrada con huella sha256, solo en memoria. El registro público de solo-añadir es la fase P4. La casilla sigue pendiente.",
        summaryEn:
          "A sha256 log entry type exists in memory only. The public append-only log is phase P4. The box stays pending.",
      },
      limits: {
        status: "repo-tested",
        provenByTests: true,
        ppmMarked: true,
        markedOn: PPM_MARKED_ON,
        publicEvidence: LIMITS_CI_RUN,
        summary:
          "Límites v1 escritos en LIMITS.md y aplicados en el código, cada uno con su test. Casilla marcada el 05-10-2026 con una ejecución pública de la CI en verde y el OK legal. Marcada no significa auditada. Si una CI posterior falla en estos tests, se desmarca.",
        summaryEn:
          "Limits v1 are written in LIMITS.md and enforced in code, each with its test. Box marked on 2026-10-05 with a green public CI run and legal sign-off. Marked does not mean audited. If a later CI run fails these tests, the box is unmarked.",
      },
      killSwitch: {
        status: "repo-tested",
        provenByTests: true,
        ppmMarked: true,
        markedOn: PPM_MARKED_ON,
        publicEvidence: KILL_SWITCH_DRILL_RUNS[KILL_SWITCH_DRILL_RUNS.length - 1] ?? null,
        publicDrill: true,
        publicDrills: KILL_SWITCH_DRILL_RUNS,
        scope: "ops-social",
        summary:
          "Lee state/killswitch.json y es fail-closed, cubierto por tests. Casilla marcada el 05-10-2026 tras simulacros públicos seguidos en verde (26-09, 28-09 y 05-10) y el OK legal. Solo para el agente: no pausa transferencias ni congela tokens o cuentas. Si un simulacro sale en rojo, se desmarca.",
        summaryEn:
          "Reads state/killswitch.json and fails closed, covered by tests. Box marked on 2026-10-05 after consecutive green public drills (26-09, 28-09 and 05-10) and legal sign-off. Agent only: it cannot pause transfers or freeze tokens or accounts. If a drill fails, the box is unmarked.",
      },
    },
  };
}

export function evaluatePpmHonesty(report: PpmReport): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (report.approved !== false) {
    problems.push("approved");
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
  let marked = 0;
  for (const [name, box] of named) {
    if (box.ppmMarked === true) {
      marked += 1;
      if (typeof box.publicEvidence !== "string" || !RUN_URL.test(box.publicEvidence)) {
        problems.push(`${name}.publicEvidence`);
      }
      if (typeof box.markedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(box.markedOn)) {
        problems.push(`${name}.markedOn`);
      }
    } else if (box.ppmMarked !== false || box.publicEvidence !== null || box.markedOn !== null) {
      problems.push(`${name}.ppmMarked`);
    }
  }
  if (report.ppmMarkedCount !== marked) {
    problems.push("ppmMarkedCount");
  }
  // Only limits and kill-switch may be marked. Wallet and logs stay pending and unmarked.
  if (
    report.boxes.wallet.status !== "pending" ||
    report.boxes.wallet.provenByTests !== false ||
    report.boxes.wallet.ppmMarked !== false
  ) {
    problems.push("wallet");
  }
  if (
    report.boxes.logs.status !== "pending" ||
    report.boxes.logs.provenByTests !== false ||
    report.boxes.logs.ppmMarked !== false
  ) {
    problems.push("logs");
  }
  if (report.boxes.limits.status !== "repo-tested" || report.boxes.limits.provenByTests !== true) {
    problems.push("limits");
  }
  const ks = report.boxes.killSwitch;
  if (ks.status !== "repo-tested" || ks.provenByTests !== true || ks.scope !== "ops-social") {
    problems.push("killSwitch");
  }
  if (ks.ppmMarked === true) {
    const drills = Array.isArray(ks.publicDrills) ? ks.publicDrills : [];
    if (
      ks.publicDrill !== true ||
      drills.length < 2 ||
      !drills.every((url) => typeof url === "string" && RUN_URL.test(url)) ||
      ks.publicEvidence !== drills[drills.length - 1]
    ) {
      problems.push("killSwitch.publicDrills");
    }
  }
  return { ok: problems.length === 0, problems };
}
