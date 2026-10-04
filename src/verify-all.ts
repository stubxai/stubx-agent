/**
 * verify:all: runs the existing checks in order and summarises them in one dated report.
 * No network, no secrets, no new dependencies. It adds no capability to the agent:
 * it only groups checks that already exist (test, scan:forbidden, drill:killswitch,
 * logs:verify, logs:status).
 */

export type VerifyStep = {
  id: string;
  script: string;
  proves: string;
  doesNotProve: string;
};

export const VERIFY_STEPS: readonly VerifyStep[] = [
  {
    id: "test",
    script: "test",
    proves: "Los tests automáticos de este repositorio pasan.",
    doesNotProve: "Que no haya otros fallos.",
  },
  {
    id: "scan-forbidden",
    script: "scan:forbidden",
    proves: "El código no contiene los marcadores conocidos de firma o envío de transacciones.",
    doesNotProve: "Que sea una auditoría externa.",
  },
  {
    id: "drill-killswitch",
    script: "drill:killswitch",
    proves: "En una copia temporal, con el interruptor activado o roto, el agente no ejecuta ninguna acción.",
    doesNotProve: "Nada en la cadena: no pausa transferencias ni congela cuentas.",
  },
  {
    id: "logs-verify",
    script: "logs:verify",
    proves: "La cadena de hashes del registro público cuadra y cada ancla tiene su sello.",
    doesNotProve: "Que el registro esté completo ni que los sellos estén confirmados en Bitcoin.",
  },
  {
    id: "logs-status",
    script: "logs:status",
    proves: "Cuántos días UTC distintos tienen entradas del workflow daily-log.",
    doesNotProve: "No marca la casilla «Logs» del PPM (siempre responde pending).",
  },
];

export type StepResult = {
  id: string;
  script: string;
  exitCode: number;
  pass: boolean;
  durationMs: number;
};

export type VerifyReport = {
  check: "verify-all";
  date: string;
  commit: string | null;
  node: string;
  network: false;
  ok: boolean;
  steps: StepResult[];
};

export function buildVerifyReport(input: {
  date: string;
  commit: string | null;
  node: string;
  results: readonly { id: string; exitCode: number; durationMs: number }[];
}): VerifyReport {
  const steps: StepResult[] = VERIFY_STEPS.map((step) => {
    const r = input.results.find((x) => x.id === step.id);
    const exitCode = r ? r.exitCode : -1;
    return { id: step.id, script: step.script, exitCode, pass: exitCode === 0, durationMs: r ? r.durationMs : 0 };
  });
  return {
    check: "verify-all",
    date: input.date,
    commit: input.commit,
    node: input.node,
    network: false,
    ok: steps.every((s) => s.pass),
    steps,
  };
}

export function verifyMarkdown(report: VerifyReport): string {
  const lines: string[] = [];
  lines.push(`# verify:all · ${report.ok ? "VERDE (todos los pasos pasan)" : "ROJO (algún paso falla)"}`);
  lines.push("");
  lines.push(`- Fecha (UTC): ${report.date}`);
  lines.push(`- Commit: ${report.commit ?? "desconocido"}`);
  lines.push(`- Node.js: ${report.node}`);
  lines.push("- Red: no · Secretos: no");
  lines.push("");
  lines.push("| Paso | Comando | Resultado | Qué demuestra | Qué no demuestra |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const s of report.steps) {
    const step = VERIFY_STEPS.find((x) => x.id === s.id);
    lines.push(
      `| \`${s.id}\` | \`npm run ${s.script}\` | ${s.pass ? "pasa" : `falla (salida ${s.exitCode})`} | ${step?.proves ?? ""} | ${step?.doesNotProve ?? ""} |`,
    );
  }
  lines.push("");
  lines.push(
    "Este informe solo junta comprobaciones que ya existen. No añade capacidades al agente, que sigue sin wallet, sin claves, sin firma y sin envío de transacciones. Un paso en verde solo demuestra lo que ese paso comprueba, en esa versión del código.",
  );
  lines.push("");
  return lines.join("\n");
}
