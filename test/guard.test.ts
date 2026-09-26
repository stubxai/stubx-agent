import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { assessRpc, MAINNET_FORBIDDEN } from "../src/guard.js";
import { agent } from "./helpers.js";

describe("MAINNET_FORBIDDEN", () => {
  test("the guard constant stays on", () => {
    assert.equal(MAINNET_FORBIDDEN, true);
  });

  test("blocks a mainnet endpoint", () => {
    const decision = assessRpc("https://api.mainnet-beta.solana.com");
    assert.equal(decision.allowed, false);
    assert.equal(decision.code, "MAINNET_FORBIDDEN");
  });

  test("blocks testnet", () => {
    const decision = assessRpc("https://api.testnet.solana.com");
    assert.equal(decision.allowed, false);
    assert.equal(decision.code, "TESTNET_FORBIDDEN");
  });

  test("blocks an unofficial endpoint", () => {
    const decision = assessRpc("https://rpc.example.invalid");
    assert.equal(decision.allowed, false);
    assert.equal(decision.code, "REMOTE_RPC_FORBIDDEN");
  });

  test("blocks devnet", () => {
    const decision = assessRpc("https://api.devnet.solana.com");
    assert.equal(decision.allowed, false);
    assert.equal(decision.code, "REMOTE_RPC_FORBIDDEN");
  });

  test("blocks an empty endpoint", () => {
    const decision = assessRpc("   ");
    assert.equal(decision.allowed, false);
    assert.equal(decision.code, "REMOTE_RPC_FORBIDDEN");
  });

  test("dispatch refuses a testnet URL", () => {
    const result = agent().dispatch("chain:read", { url: "https://api.testnet.solana.com" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "TESTNET_FORBIDDEN");
      assert.equal(result.onChainEffect, false);
    }
  });

  test("dispatch refuses a remote URL that is not mainnet", () => {
    const result = agent().dispatch("log:append", {
      kind: "note",
      detail: "ver https://example.invalid/nota",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "REMOTE_RPC_FORBIDDEN");
    }
  });
});
