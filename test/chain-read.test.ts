import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { decodePubkey, encodeBase58 } from "../verify/base58.js";
import { findProgramAddress } from "../verify/pda.js";
import { bondingCurvePda } from "../verify/programs.js";
import { repoRoot } from "../src/paths.js";

const readUrl = pathToFileURL(path.join(repoRoot(), "comparar/chain-read.mjs")).href;
const OFFICIAL = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
const CURVE = "3shQFExQ3rpFL6GaXPRQNTMYazVHmTvRfuazfv62toAE";

function quiet() {
  return {
    sleep: async () => {},
    random: () => 0,
    monoNow: () => 0,
    now: () => new Date("2026-10-10T00:00:00.000Z"),
    minIntervalMs: 0,
    maxRetries: 0,
  };
}

describe("lectura de la curva", () => {
  test("los límites copian verify/policy/limits.json", async () => {
    const { LIMITS } = await import(readUrl);
    const file = JSON.parse(readFileSync(path.join(repoRoot(), "verify/policy/limits.json"), "utf8")) as {
      defaultRpcUrl: string;
      fallbackRpcUrl: string;
      timeoutMs: number;
      maxRetries: number;
      backoffBaseMs: number;
      minIntervalMs: number;
      allowedRpcMethods: string[];
    };
    assert.equal(LIMITS.defaultRpcUrl, file.defaultRpcUrl);
    assert.equal(LIMITS.fallbackRpcUrl, file.fallbackRpcUrl);
    assert.equal(LIMITS.timeoutMs, file.timeoutMs);
    assert.equal(LIMITS.maxRetries, file.maxRetries);
    assert.equal(LIMITS.backoffBaseMs, file.backoffBaseMs);
    assert.equal(LIMITS.minIntervalMs, file.minIntervalMs);
    assert.deepEqual(LIMITS.allowedRpcMethods, file.allowedRpcMethods);
    assert.equal(LIMITS.defaultRpcUrl.includes("publicnode"), true);
  });

  test("la PDA de la curva oficial y la global coinciden con Verify", async () => {
    const { bondingCurvePda: localCurve, globalPda, globalDiscriminator } = await import(readUrl);
    assert.equal(localCurve(OFFICIAL), bondingCurvePda(OFFICIAL));
    assert.equal(localCurve(OFFICIAL), CURVE);
    const program = decodePubkey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
    assert.ok(program);
    const expected = encodeBase58(findProgramAddress([new TextEncoder().encode("global")], program).address);
    assert.equal(globalPda(), expected);
    const disc = createHash("sha256").update("account:Global").digest().subarray(0, 8);
    assert.deepEqual(Buffer.from(globalDiscriminator()), disc);
  });

  test("un método fuera de la lista no llama al transporte", async () => {
    const { RpcClient } = await import(readUrl);
    let fetches = 0;
    const client = new RpcClient({
      endpoint: "https://solana-rpc.publicnode.com",
      ...quiet(),
      transport: async () => {
        fetches += 1;
        return { status: 200, body: "{}" };
      },
    });
    const blocked = await client.call("sendTransaction", [], () => null);
    assert.equal(blocked.ok, false);
    assert.equal(fetches, 0);
    assert.equal(client.calls.length, 0);
  });

  test("un 429 no queda como fuente y el respaldo sí", async () => {
    const { createReader, encodeMintAccount, encodeCurveAccount, encodeGlobalAccount, bytesToBase64, PUMP_PROGRAM, TOKEN_PROGRAM } = await import(readUrl);
    const mint = encodeMintAccount(1000000000000000n, 6);
    const curve = encodeCurveAccount({
      virtualToken: 1059122445097276n,
      virtualQuote: 30393086421n,
      realToken: 779222445097276n,
      realQuote: 393086421n,
      supply: 1000000000000000n,
      complete: false,
    });
    const global = encodeGlobalAccount(95n, 5n);
    const accounts = [mint, curve, new Uint8Array(), global];
    const owners = [TOKEN_PROGRAM, PUMP_PROGRAM, TOKEN_PROGRAM, PUMP_PROGRAM];
    const payload = (method: string) => {
      if (method === "getSlot") return { jsonrpc: "2.0", id: 1, result: 454936125 };
      return {
        jsonrpc: "2.0",
        id: 1,
        result: {
          context: { slot: 454936125 },
          value: accounts.map((data, index) =>
            index === 2
              ? null
              : { data: [bytesToBase64(data), "base64"], executable: false, lamports: 1, owner: owners[index], space: data.length },
          ),
        },
      };
    };
    const seen: string[] = [];
    const reader = createReader({
      ...quiet(),
      transport: async (endpoint: string, body: string) => {
        seen.push(endpoint);
        const request = JSON.parse(body) as { method: string };
        if (endpoint.includes("publicnode")) return { status: 429, body: "no" };
        return { status: 200, body: JSON.stringify(payload(request.method)) };
      },
    });
    const { readCurveState } = await import(readUrl);
    const state = await readCurveState(OFFICIAL, { reader });
    assert.equal(state.ok, true);
    if (!state.ok) return;
    assert.equal(state.curve?.virtualToken, 1059122445097276n);
    assert.equal(state.fees?.protocol.status, "leida");
    assert.equal(state.fees?.protocol.bps, 95n);
    assert.equal(state.fees?.creator.bps, 5n);
    assert.equal(state.slot, 454936125);
    assert.equal(state.reads.some((row: { endpoint: string }) => row.endpoint.includes("publicnode")), false);
    assert.equal(state.reads.every((row: { endpoint: string }) => row.endpoint.includes("mainnet-beta")), true);
    assert.equal(seen[0]?.includes("publicnode"), true);
  });

  test("sin comisión de creación no se lee un cero", async () => {
    const { decodeGlobal, encodeGlobalAccount, encodeCurveAccount, decodeCurve, quoteIsSol, PUMP_PROGRAM } = await import(readUrl);
    const short = decodeGlobal(PUMP_PROGRAM, encodeGlobalAccount(95n));
    assert.equal(short?.protocol.bps, 95n);
    assert.equal(short?.creator.status, "ausente");
    assert.equal(Object.hasOwn(short?.creator ?? {}, "bps"), false);
    const broken = new Uint8Array(162);
    broken.set(encodeGlobalAccount(95n).subarray(0, 8));
    const view = new DataView(broken.buffer);
    view.setBigUint64(105, 95n, true);
    view.setBigUint64(154, 10001n, true);
    const bad = decodeGlobal(PUMP_PROGRAM, broken);
    assert.equal(bad?.creator.status, "ilegible");
    assert.equal(Object.hasOwn(bad?.creator ?? {}, "bps"), false);
    const other = decodeCurve(
      PUMP_PROGRAM,
      encodeCurveAccount({
        virtualToken: 10n,
        virtualQuote: 10n,
        realToken: 10n,
        realQuote: 10n,
        supply: 10n,
        complete: false,
        quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      }),
    );
    assert.equal(other?.quoteSol, false);
    assert.equal(quoteIsSol(other?.quoteMint ?? null), false);
    const closed = decodeCurve(
      PUMP_PROGRAM,
      encodeCurveAccount({
        virtualToken: 10n,
        virtualQuote: 10n,
        realToken: 0n,
        realQuote: 10n,
        supply: 10n,
        complete: true,
      }),
    );
    assert.equal(closed?.complete, true);
    assert.equal(closed?.quoteSol, true);
  });
});
