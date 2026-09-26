import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { assessAction } from "../src/allowlist.js";
import { ALLOWED_ACTIONS } from "../src/types.js";
import { agent, writeState, DISENGAGED } from "./helpers.js";

describe("allowlist", () => {
  test("allows every documented action when the kill-switch is off", () => {
    const orch = agent(writeState("killswitch.json", DISENGAGED));
    for (const action of ALLOWED_ACTIONS) {
      if (action === "log:append") {
        const result = orch.dispatch(action, { kind: "note", detail: "Nota local de prueba." });
        assert.equal(result.ok, true, action);
        continue;
      }
      const result = orch.dispatch(action);
      assert.equal(result.ok, true, action);
    }
  });

  test("rejects an unknown action", () => {
    const result = agent().dispatch("not-a-real-action");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "not-allowlisted");
      assert.equal(result.limitId, null);
      assert.equal(result.onChainEffect, false);
    }
  });

  test("rejects an empty action", () => {
    const result = agent().dispatch("");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "not-allowlisted");
    }
  });

  test("rejects a different case", () => {
    const result = agent().dispatch("PPM:PRINT");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "not-allowlisted");
    }
  });

  test("rejects whitespace", () => {
    const result = agent().dispatch(" ppm:print ");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "not-allowlisted");
    }
  });

  test("a poisoned allowlist still cannot grant a signing action", () => {
    const assessment = assessAction("signTransaction", ["signTransaction", "ppm:print"]);
    assert.equal(assessment.kind, "deny");
    if (assessment.kind === "deny") {
      assert.equal(assessment.limitId, "no-sign");
    }
  });

  test("a poisoned allowlist still cannot grant sending", () => {
    const assessment = assessAction("sendTransaction", ["sendTransaction"]);
    assert.equal(assessment.kind, "deny");
    if (assessment.kind === "deny") {
      assert.equal(assessment.limitId, "no-send");
    }
  });

  test("status payload is rejected", () => {
    const result = agent().dispatch("status", { extra: true });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "invalid-payload");
    }
  });
});
