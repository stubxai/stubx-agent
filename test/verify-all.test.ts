import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { VERIFY_STEPS, buildVerifyReport, verifyMarkdown } from "../src/verify-all.js";
import { FIXED_NOW } from "./helpers.js";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const allGreen = VERIFY_STEPS.map((s) => ({ id: s.id, exitCode: 0, durationMs: 1 }));

describe("verify:all", () => {
  test("runs exactly the five existing checks, in order", () => {
    assert.deepEqual(
      VERIFY_STEPS.map((s) => s.script),
      ["test", "scan:forbidden", "drill:killswitch", "logs:verify", "logs:status"],
    );
  });

  test("is green only when every step passes", () => {
    const green = buildVerifyReport({ date: FIXED_NOW, commit: SHA, node: "v22.14.0", results: allGreen });
    assert.equal(green.ok, true);
    assert.equal(green.network, false);
    const red = buildVerifyReport({
      date: FIXED_NOW,
      commit: SHA,
      node: "v22.14.0",
      results: allGreen.map((r) => (r.id === "logs-verify" ? { ...r, exitCode: 1 } : r)),
    });
    assert.equal(red.ok, false);
    assert.equal(red.steps.find((s) => s.id === "logs-verify")?.pass, false);
  });

  test("a missing step counts as a failure", () => {
    const report = buildVerifyReport({ date: FIXED_NOW, commit: null, node: "v22.14.0", results: allGreen.slice(1) });
    assert.equal(report.ok, false);
    assert.equal(report.steps[0]?.exitCode, -1);
  });

  test("the markdown report is dated, names the commit and states its limits", () => {
    const md = verifyMarkdown(buildVerifyReport({ date: FIXED_NOW, commit: SHA, node: "v22.14.0", results: allGreen }));
    assert.match(md, /VERDE/);
    assert.ok(md.includes(FIXED_NOW));
    assert.ok(md.includes(SHA));
    assert.match(md, /No añade capacidades al agente/);
    for (const s of VERIFY_STEPS) assert.ok(md.includes(`npm run ${s.script}`), s.script);
  });
});
