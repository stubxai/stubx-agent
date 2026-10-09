import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { TOKEN_2022_PROGRAM, PUMP_PROGRAM, bondingCurvePda, metadataPda } from "../programs.js";
import { readAnyMint, type LiveReading } from "../signals.js";
import { repoRootFrom } from "../root.js";
import type { CanonicalToken } from "../types.js";
import type { RpcTransport } from "../rpc.js";
import { labFixtures, type AccountFixture, type LabFixture } from "./layouts.js";

const root = repoRootFrom(import.meta.url);
const registry = (
  JSON.parse(readFileSync(path.join(root, "verify/registry/canonical.json"), "utf8")) as { tokens: CanonicalToken[] }
).tokens;
const PUMP = Uint8Array.from([23, 183, 248, 55, 96, 216, 172, 96]);

function ok(slot: number, value: unknown): { status: number; body: string } {
  return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot }, value } }) };
}

function accountJson(account: AccountFixture | { owner: string; data: Uint8Array } | null): unknown {
  if (!account) {
    return null;
  }
  const data = "dataBase64" in account ? account.dataBase64 : Buffer.from(account.data).toString("base64");
  return {
    owner: account.owner,
    lamports: "lamports" in account ? account.lamports : 1,
    executable: false,
    space: "space" in account ? account.space : Buffer.from(data, "base64").length,
    data: [data, "base64"],
  };
}

function transportFor(input: {
  slot: number;
  accounts: Map<string, AccountFixture | { owner: string; data: Uint8Array } | null>;
  supply: { amount: string; decimals: number } | null;
  largest: Array<{ address: string; amount: string; decimals: number }> | null;
  failEndpoint?: string;
  timeout?: boolean;
}): RpcTransport {
  return async (endpoint, body) => {
    if (input.timeout) {
      throw new Error("The operation was aborted due to timeout");
    }
    if (input.failEndpoint && endpoint === input.failEndpoint) {
      return { status: 429, body: "" };
    }
    const request = JSON.parse(body) as { method: string; params: unknown[] };
    if (request.method === "getMultipleAccounts") {
      const ids = request.params[0] as string[];
      return ok(
        input.slot,
        ids.map((id) => accountJson(input.accounts.get(id) ?? null)),
      );
    }
    if (request.method === "getTokenSupply") {
      if (!input.supply) {
        return { status: 500, body: "" };
      }
      return ok(input.slot, input.supply);
    }
    if (request.method === "getTokenLargestAccounts") {
      if (!input.largest) {
        return { status: 429, body: "" };
      }
      return ok(input.slot, input.largest);
    }
    throw new Error(`método inesperado ${request.method}`);
  };
}

async function readFixture(fixture: LabFixture, endpoints = ["https://rpc-a.invalid"]): Promise<LiveReading> {
  const accounts = new Map<string, AccountFixture | null>();
  accounts.set(fixture.mint, fixture.mintAccount);
  accounts.set(metadataPda(fixture.mint), fixture.metaplex);
  accounts.set(bondingCurvePda(fixture.mint), fixture.curve);
  const supply = fixture.supply && !("error" in fixture.supply) ? fixture.supply : null;
  const largest = Array.isArray(fixture.largest) ? fixture.largest : null;
  return readAnyMint({
    mint: fixture.mint,
    registry,
    endpoints,
    transport: transportFor({ slot: fixture.slot, accounts, supply, largest }),
    maxRetries: 0,
    minIntervalMs: 0,
    sleep: async () => {},
  });
}

function fixture(id: string): LabFixture {
  const found = labFixtures().find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}

function textOf(reading: LiveReading): string {
  return JSON.stringify(reading);
}

function u64(value: bigint): Uint8Array {
  const out = new Uint8Array(8);
  let rest = value;
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(rest & 0xffn);
    rest >>= 8n;
  }
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function tlv(type: number, value: Uint8Array): Uint8Array {
  const out = new Uint8Array(4 + value.length);
  const view = new DataView(out.buffer);
  view.setUint16(0, type, true);
  view.setUint16(2, value.length, true);
  out.set(value, 4);
  return out;
}

describe("lectura universal con RPC simulado", () => {
  test("una dirección inválida no llama al servicio", async () => {
    let called = false;
    const reading = await readAnyMint({
      mint: "no es una direccion",
      registry,
      endpoints: ["https://rpc-a.invalid"],
      transport: async () => {
        called = true;
        return { status: 200, body: "" };
      },
      maxRetries: 0,
      minIntervalMs: 0,
    });
    assert.equal(called, false);
    assert.equal(reading.kind, "invalida");
    assert.equal(reading.ok, false);
  });

  test("el mint revocado se lee sin puntuación", async () => {
    const reading = await readFixture(fixture("revoked-mint"));
    assert.equal(reading.ok, true);
    assert.equal(reading.title.es, "Lectura de este token");
    assert.equal(reading.signals.find((item) => item.id === "emision")?.level, "ok");
    assert.equal(reading.signals.find((item) => item.id === "congelacion")?.level, "ok");
    assert.match(textOf(reading), /Cuentas con tokens/);
    assert.equal(/\bholders?\b|reserva|\breserve\b|scam|recomendado|\bseguro\b/i.test(textOf(reading)), false);
  });

  test("la congelación activa es una señal y no un veredicto de estafa", async () => {
    const reading = await readFixture(fixture("active-freeze"));
    assert.equal(reading.title.es, "Lectura de este token");
    assert.equal(reading.signals.find((item) => item.id === "congelacion")?.level, "riesgo");
    assert.equal(reading.signals.find((item) => item.id === "emision")?.level, "atencion");
    assert.match(reading.signals.find((item) => item.id === "cuentas")?.explain.es ?? "", /cuenta con tokens/);
    assert.equal(/scam|recomendado|\bseguro\b/i.test(textOf(reading)), false);
  });

  test("un nombre parecido a STUBX con otra dirección es posible copia", async () => {
    const reading = await readFixture(fixture("name-impersonation"));
    assert.equal(reading.title.es, "Posible copia de STUBX");
    assert.equal(reading.title.en, "Possible STUBX copy");
    assert.equal(reading.light, "riesgo");
    assert.equal(reading.mint === registry[0]?.mint, false);
  });

  test("la dirección del registro se reconoce", async () => {
    const mint = registry[0]?.mint ?? "";
    const sample = fixture("revoked-mint");
    const reading = await readAnyMint({
      mint,
      registry,
      endpoints: ["https://rpc-a.invalid"],
      transport: transportFor({
        slot: 1,
        accounts: new Map([
          [mint, sample.mintAccount],
          [metadataPda(mint), null],
          [bondingCurvePda(mint), null],
        ]),
        supply: { amount: "1000000000000000", decimals: 6 },
        largest: [],
      }),
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    assert.equal(reading.title.es, "Esta dirección es la del registro de STUBX");
    assert.equal(reading.light, "ok");
  });

  test("una cuenta ausente y una que no es mint no se rellenan", async () => {
    const missing = await readFixture(fixture("missing-account"));
    assert.equal(missing.title.es, "Esta dirección no existe");
    const other = await readFixture(fixture("not-a-mint"));
    assert.equal(other.title.es, "Esta cuenta no es un mint");
  });

  test("si el suministro no cuadra no hay porcentajes", async () => {
    const reading = await readFixture(fixture("supply-mismatch"));
    const supply = reading.signals.find((item) => item.id === "suministro");
    assert.match(supply?.explain.es ?? "", /No se calculan porcentajes/);
    const sample = reading.signals.find((item) => item.id === "cuentas");
    assert.equal(/\d+(?:\.\d+)? %/.test(sample?.explain.es ?? ""), false);
  });

  test("el límite en el primer servicio usa el segundo", async () => {
    const sample = fixture("revoked-mint");
    const accounts = new Map<string, AccountFixture | null>([
      [sample.mint, sample.mintAccount],
      [metadataPda(sample.mint), null],
      [bondingCurvePda(sample.mint), null],
    ]);
    const reading = await readAnyMint({
      mint: sample.mint,
      registry,
      endpoints: ["https://rpc-a.invalid", "https://rpc-b.invalid"],
      transport: transportFor({
        slot: sample.slot,
        accounts,
        supply: { amount: "1000000000000000", decimals: 6 },
        largest: [],
        failEndpoint: "https://rpc-a.invalid",
      }),
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    assert.equal(reading.ok, true);
    assert.equal(reading.usedFallback, true);
    assert.equal(reading.endpointHost, "rpc-b.invalid");
    const refused = await readAnyMint({
      mint: sample.mint,
      registry,
      endpoints: ["https://rpc-a.invalid", "https://rpc-b.invalid"],
      transport: async (endpoint, body) => {
        if (endpoint === "https://rpc-a.invalid") {
          return { status: 403, body: "" };
        }
        return transportFor({
          slot: sample.slot,
          accounts,
          supply: { amount: "1000000000000000", decimals: 6 },
          largest: [],
        })(endpoint, body, 8000);
      },
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    assert.equal(refused.ok, true);
    assert.equal(refused.usedFallback, true);
  });

  test("el límite y el tiempo agotado se dicen en claro", async () => {
    const sample = fixture("revoked-mint");
    const limited = await readAnyMint({
      mint: sample.mint,
      registry,
      endpoints: ["https://rpc-a.invalid"],
      transport: async () => ({ status: 429, body: "" }),
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    assert.equal(limited.kind, "limite");
    assert.match(limited.support.es, /límite de peticiones/);
    assert.match(limited.support.es, /No se ha inventado un resultado/);
    const timed = await readAnyMint({
      mint: sample.mint,
      registry,
      endpoints: ["https://rpc-a.invalid"],
      transport: transportFor({
        slot: 1,
        accounts: new Map(),
        supply: null,
        largest: null,
        timeout: true,
      }),
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    assert.equal(timed.kind, "tiempo");
    assert.match(timed.support.es, /tiempo de espera/);
  });

  test("las extensiones de riesgo de Token-2022 se nombran", async () => {
    const sample = fixture("revoked-mint");
    const key = new Uint8Array(32);
    key[0] = 4;
    const body = concat(
      tlv(1, new Uint8Array(108)),
      tlv(12, key),
      tlv(14, concat(key, key)),
      tlv(6, Uint8Array.of(2)),
    );
    const data = new Uint8Array(166 + body.length);
    const base = Buffer.from(sample.mintAccount?.dataBase64 ?? "", "base64");
    data.set(base.subarray(0, 82), 0);
    data[165] = 1;
    data.set(body, 166);
    const reading = await readAnyMint({
      mint: sample.mint,
      registry,
      endpoints: ["https://rpc-a.invalid"],
      transport: transportFor({
        slot: 4,
        accounts: new Map([
          [sample.mint, { owner: TOKEN_2022_PROGRAM, data }],
          [metadataPda(sample.mint), null],
          [bondingCurvePda(sample.mint), null],
        ]),
        supply: { amount: "1000000000000000", decimals: 6 },
        largest: [],
      }),
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    const titles = reading.signals.map((item) => item.title.es).join("\n");
    assert.match(titles, /Comisión de transferencia/);
    assert.match(titles, /Delegado permanente/);
    assert.match(titles, /Gancho de transferencia/);
    assert.match(titles, /Las cuentas nuevas nacen congeladas/);
  });

  test("la curva usa cantidad real y virtual", async () => {
    const sample = fixture("revoked-mint");
    const curve = concat(PUMP, u64(2000n), u64(100n), u64(500n), u64(50n), u64(1000n), Uint8Array.of(0));
    const reading = await readAnyMint({
      mint: sample.mint,
      registry,
      endpoints: ["https://rpc-a.invalid"],
      transport: transportFor({
        slot: 5,
        accounts: new Map<string, AccountFixture | { owner: string; data: Uint8Array } | null>([
          [sample.mint, sample.mintAccount],
          [metadataPda(sample.mint), null],
          [bondingCurvePda(sample.mint), { owner: PUMP_PROGRAM, data: curve }],
        ]),
        supply: { amount: "1000000000000000", decimals: 6 },
        largest: [],
      }),
      maxRetries: 0,
      minIntervalMs: 0,
      sleep: async () => {},
    });
    const explain = reading.signals.find((item) => item.id === "curva")?.explain.es ?? "";
    assert.match(explain, /Cantidad real de la curva: 500/);
    assert.match(explain, /Cantidad virtual de la curva: 2000/);
    assert.equal(/reserva|\breserve\b|\bfondo\b/i.test(explain), false);
  });
});
