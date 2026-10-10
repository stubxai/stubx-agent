import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../src/paths.js";

const mathUrl = pathToFileURL(path.join(repoRoot(), "comparar/curve-math.mjs")).href;

const LIVE = {
  virtualToken: 1059122445097276n,
  virtualQuote: 30393086421n,
  realToken: 779222445097276n,
  realQuote: 393086421n,
};

describe("cálculo de la curva", () => {
  test("una cantidad pequeña coincide con el cálculo a mano", async () => {
    const { estimateBaseToToken } = await import(mathUrl);
    const curve = { virtualToken: 1000000n, virtualQuote: 1000000n, realToken: 500000n, realQuote: 1000n };
    const out = estimateBaseToToken(curve, 10000n, 100n);
    assert.equal(out.status, "ok");
    assert.equal(out.fee, 100n);
    assert.equal(out.net, 9900n);
    assert.equal(out.tokensOut, 9802n);
    assert.equal(out.independent, 9803n);
    assert.ok(out.diff <= 1n);
  });

  test("la cantidad del 2026-10-09 coincide con el segundo cálculo", async () => {
    const { estimateBaseToToken } = await import(mathUrl);
    const out = estimateBaseToToken(LIVE, 100000000n, 100n);
    assert.equal(out.status, "ok");
    assert.equal(out.fee, 1000000n);
    assert.equal(out.net, 99000000n);
    assert.equal(out.tokensOut, 3438699491302n);
    assert.equal(out.independent, 3438699491303n);
    assert.equal(out.diff, 1n);
    assert.equal(out.impactBps, 32n);
  });

  test("la dirección inversa también cabe en una unidad", async () => {
    const { estimateTokenToBase } = await import(mathUrl);
    const curve = { virtualToken: 1000000n, virtualQuote: 1000000n, realToken: 500000n, realQuote: 20000n };
    const out = estimateTokenToBase(curve, 9802n, 100n);
    assert.equal(out.status, "ok");
    assert.equal(out.grossQuote, 9706n);
    assert.equal(out.independent, 9707n);
    assert.equal(out.fee, 97n);
    assert.equal(out.net, 9609n);
    assert.equal(out.diff, 1n);
  });

  test("una cantidad inválida, vacía o con demasiados decimales no entra", async () => {
    const { parseAmount } = await import(mathUrl);
    assert.equal(parseAmount("", 9).ok, false);
    assert.equal(parseAmount("0", 9).code, "cero");
    assert.equal(parseAmount("-1", 9).code, "invalida");
    assert.equal(parseAmount("1.2.3", 9).code, "invalida");
    assert.equal(parseAmount("abc", 9).code, "invalida");
    assert.equal(parseAmount("1,2,3", 9).code, "invalida");
    assert.equal(parseAmount("0,1", 9).units, 100000000n);
    assert.equal(parseAmount("0.1", 9).units, 100000000n);
    assert.equal(parseAmount("1.0000000001", 9).code, "decimales");
  });

  test("si no cabe en la cantidad real no se recorta", async () => {
    const { estimateBaseToToken, estimateTokenToBase } = await import(mathUrl);
    const curve = { virtualToken: 1000n, virtualQuote: 1000n, realToken: 10n, realQuote: 10n };
    assert.equal(estimateBaseToToken(curve, 500n, 0n).status, "no_alcanza");
    assert.equal(estimateTokenToBase(curve, 500n, 0n).status, "no_alcanza");
    assert.equal(Object.hasOwn(estimateBaseToToken(curve, 500n, 0n), "tokensOut"), false);
  });

  test("una comisión ausente no se convierte en cero", async () => {
    const { feeBpsForEstimate } = await import(mathUrl);
    const missing = feeBpsForEstimate({ protocol: { status: "ausente" }, creator: { status: "ausente" } });
    assert.equal(missing.ok, false);
    assert.equal(Object.hasOwn(missing, "totalBps"), false);
    const readZero = feeBpsForEstimate({ protocol: { status: "leida", bps: 0n }, creator: { status: "ausente" } });
    assert.equal(readZero.ok, true);
    assert.equal(readZero.totalBps, 0n);
    assert.equal(readZero.creatorBps, null);
    assert.equal(readZero.creatorOmitted, true);
    const both = feeBpsForEstimate({ protocol: { status: "leida", bps: 95n }, creator: { status: "leida", bps: 5n } });
    assert.equal(both.totalBps, 100n);
    assert.equal(both.creatorOmitted, false);
    const broken = feeBpsForEstimate({ protocol: { status: "leida", bps: 95n }, creator: { status: "ilegible" } });
    assert.equal(broken.ok, false);
  });
});

describe("el módulo no trae envío ni firma", () => {
  test("el texto del cálculo y de la lectura no nombra esas llamadas", () => {
    const root = repoRoot();
    assert.equal(existsSync(path.join(root, "web/v2/modules/curve-math.mjs")), false);
    assert.equal(existsSync(path.join(root, "web/v2/modules/chain-read.mjs")), false);
    for (const rel of ["comparar/curve-math.mjs", "pares/chain-read.mjs"]) {
      const text = readFileSync(path.join(root, rel), "utf8");
      assert.equal(text.includes("sendTransaction"), false, rel);
      assert.equal(text.includes("signTransaction"), false, rel);
      assert.equal(text.includes("simulateTransaction"), false, rel);
    }
  });
});
