import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, test } from "node:test";
import { fingerprint } from "../src/fingerprint.js";
import { StubAgent } from "../src/stub-agent.js";
import { evaluatePpmHonesty } from "../src/ppm.js";
import type { PpmReport } from "../src/ppm.js";
import { repoRoot } from "../src/paths.js";
import { STUBX_MINT } from "../src/public-mint.js";
import { agent } from "./helpers.js";

function reportFrom(orch = agent()): PpmReport {
  const result = orch.dispatch("ppm:print");
  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("ppm:print failed");
  }
  return result.output as PpmReport;
}

describe("ppm", () => {
  test("wallet and logs stay pending", () => {
    const report = reportFrom();
    assert.equal(report.boxes.wallet.status, "pending");
    assert.equal(report.boxes.logs.status, "pending");
    assert.equal(report.boxes.wallet.provenByTests, false);
    assert.equal(report.boxes.logs.provenByTests, false);
  });

  test("limits and kill-switch are repo-tested and unmarked", () => {
    const report = reportFrom();
    assert.equal(report.boxes.limits.status, "repo-tested");
    assert.equal(report.boxes.limits.provenByTests, true);
    assert.equal(report.boxes.limits.ppmMarked, false);
    assert.equal(report.boxes.killSwitch.status, "repo-tested");
    assert.equal(report.boxes.killSwitch.provenByTests, true);
    assert.equal(report.boxes.killSwitch.ppmMarked, false);
    assert.equal(report.boxes.killSwitch.publicDrill, false);
    assert.equal(report.boxes.killSwitch.scope, "ops-social");
  });

  test("the report is not an approval", () => {
    const report = reportFrom();
    assert.equal(report.approved, false);
    assert.equal(report.ppmMarkedCount, 0);
    assert.equal(report.signing, false);
    assert.equal(report.network, false);
    assert.equal(report.package, "@stubx/agents");
    assert.equal(report.packageVersion, "0.1.0");
    assert.equal(report.tokenMint, STUBX_MINT);
    assert.equal(report.policyVersion, "1.0.0");
    assert.match(report.policySha256, /^[0-9a-f]{64}$/);
    assert.equal(report.boxes.wallet.publicEvidence, null);
    assert.equal(report.boxes.logs.publicEvidence, null);
    assert.equal(report.boxes.limits.publicEvidence, null);
    assert.equal(report.boxes.killSwitch.publicEvidence, null);
  });

  test("honesty check passes the real report and rejects a marked wallet", () => {
    const report = reportFrom();
    assert.equal(evaluatePpmHonesty(report).ok, true);
    const marked: PpmReport = {
      ...report,
      boxes: {
        ...report.boxes,
        wallet: { ...report.boxes.wallet, status: "repo-tested", provenByTests: true },
      },
    };
    const honesty = evaluatePpmHonesty(marked);
    assert.equal(honesty.ok, false);
    assert.ok(honesty.problems.includes("wallet"));
  });

  test("ppm:check agrees with the honest report", () => {
    const result = agent().dispatch("ppm:check");
    assert.equal(result.ok, true);
    if (result.ok) {
      const output = result.output as { problems: string[] };
      assert.deepEqual(output.problems, []);
    }
  });

  test("stub agent prints, audits, and fingerprints memory", () => {
    const orch = agent();
    const stub = new StubAgent(orch);
    const printed = stub.print();
    assert.equal(printed.ok, true);
    const before = stub.hashLogs();
    assert.match(before, /^[0-9a-f]{64}$/);
    assert.equal(stub.hashLogs(), before);
    assert.equal(before, fingerprint(JSON.stringify(orch.events())));
    const audited = stub.audit();
    assert.equal(audited.ok, true);
    assert.notEqual(stub.hashLogs(), before);
  });

  test("cli ppm:print exits 0 with pending wallet and logs", () => {
    const result = spawnSync(process.execPath, ["dist/src/cli.js", "ppm:print"], {
      cwd: repoRoot(),
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout) as PpmReport;
    assert.equal(report.approved, false);
    assert.equal(report.boxes.wallet.status, "pending");
    assert.equal(report.boxes.logs.status, "pending");
    assert.equal(report.boxes.limits.provenByTests, true);
    assert.equal(report.boxes.killSwitch.provenByTests, true);
  });

  test("chain:read is local and does not claim a network call", () => {
    const result = agent().dispatch("chain:read");
    assert.equal(result.ok, true);
    if (result.ok) {
      const output = result.output as { network: boolean; write: boolean; mint: string };
      assert.equal(output.network, false);
      assert.equal(output.write, false);
      assert.equal(output.mint, STUBX_MINT);
    }
  });
});
