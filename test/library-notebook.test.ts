import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../src/paths.js";

const CA = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
const OTHER = "11111111111111111111111111111111";
const WHEN = "2026-10-09T12:00:00.000Z";

interface ReadModule {
  TOKEN_PROGRAM: string;
  METADATA_PROGRAM: string;
  PUMP_PROGRAM: string;
  ALLOWED_METHODS: readonly string[];
  metadataPda: (mint: string) => Promise<string>;
  bondingCurvePda: (mint: string) => Promise<string>;
  decodeMintAccount: (owner: string, data: Uint8Array) => { supplyRaw: string; mintAuthority: { state: string }; freezeAuthority: { state: string } } | null;
  decodeMetadataAccount: (data: Uint8Array) => { name: string; uri: string; mutable: string | null } | null;
  isAllowedRpcUrl: (value: string) => boolean;
  blankCard: (mint: string, consultedAt: string, errors: unknown[]) => Card;
  readMint: (options: Record<string, unknown>) => Promise<{ ok: boolean; card: Card | null }>;
}

interface Card {
  isMint?: boolean;
  partial?: boolean;
  officialStubx?: boolean;
  name: { text: string | null };
  uri: { text: string | null };
  supplyRpc: string | null;
  supplyAccount: string | null;
  program?: string;
  mint: string;
}

interface ModelModule {
  MAX_BYTES: number;
  validateExport: (text: string) => { ok: boolean; error?: { es: string }; records?: Array<{ note: string; card: Card }> };
  validateCard: (card: Card) => { ok: boolean };
  toExport: (records: unknown[], exportedAt: string) => string;
  compareRecords: (left: { card: Card }, right: { card: Card }) => { ok: boolean; rows?: Array<{ field: { es: string }; same: boolean }> };
  staleLine: (consultedAt: string, lang: string) => string;
}

async function modules(): Promise<{ read: ReadModule; model: ModelModule }> {
  const root = repoRoot();
  const read = (await import(pathToFileURL(path.join(root, "web/v2/shared/solana-read.js")).href)) as ReadModule;
  const model = (await import(pathToFileURL(path.join(root, "web/v2/shared/notebook-model.js")).href)) as ModelModule;
  return { read, model };
}

function u32(value: number): Buffer {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes;
}

function u64(value: bigint): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(value);
  return bytes;
}

function mintBytes(supply = 1000n): Buffer {
  const bytes = Buffer.alloc(82);
  u32(0).copy(bytes, 0);
  u64(supply).copy(bytes, 36);
  bytes[44] = 6;
  bytes[45] = 1;
  u32(1).copy(bytes, 46);
  bytes.fill(9, 50, 82);
  return bytes;
}

function borshString(value: string): Buffer {
  const body = Buffer.from(value);
  return Buffer.concat([u32(body.length), body]);
}

function metadataBytes(name: string, symbol: string, uri: string, mutable = 0): Buffer {
  return Buffer.concat([
    Buffer.from([4]),
    Buffer.alloc(32, 3),
    Buffer.alloc(32, 4),
    borshString(name),
    borshString(symbol),
    borshString(uri),
    Buffer.from([0, 0, 0, 0, mutable]),
  ]);
}

function curveBytes(): Buffer {
  const bytes = Buffer.alloc(49);
  Buffer.from([23, 183, 248, 55, 96, 216, 172, 96]).copy(bytes, 0);
  u64(10n).copy(bytes, 8);
  u64(20n).copy(bytes, 16);
  u64(30n).copy(bytes, 24);
  u64(40n).copy(bytes, 32);
  bytes[48] = 0;
  return bytes;
}

function account(owner: string, data: Buffer | null) {
  if (!data) return null;
  return { owner, data: [data.toString("base64"), "base64"], executable: false, lamports: 1, rentEpoch: 0 };
}

function rpcOk(value: unknown, slot = 99) {
  return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", id: 1, result: { context: { slot }, value } }) };
}

function fastClock() {
  return {
    now: () => new Date(WHEN),
    sleep: async () => undefined,
    mono: () => 0,
    minIntervalMs: 0,
    maxRetries: 2,
    timeoutMs: 50,
  };
}

describe("lector y cuaderno", () => {
  test("las PDA coinciden con Verify y solo hay métodos de lectura", async () => {
    const { read } = await modules();
    const programs = (await import(pathToFileURL(path.join(repoRoot(), "dist/verify/programs.js")).href)) as {
      metadataPda: (mint: string) => string;
      bondingCurvePda: (mint: string) => string;
    };
    assert.equal(await read.metadataPda(CA), programs.metadataPda(CA));
    assert.equal(await read.bondingCurvePda(CA), programs.bondingCurvePda(CA));
    assert.deepEqual([...read.ALLOWED_METHODS], [
      "getAccountInfo",
      "getMultipleAccounts",
      "getTokenSupply",
      "getTokenLargestAccounts",
      "getSlot",
    ]);
  });

  test("una cuenta de mint, metadatos con script y una curva se leen sin seguir la URI", async () => {
    const { read } = await modules();
    const decoded = read.decodeMintAccount(read.TOKEN_PROGRAM, mintBytes(4242n));
    assert.equal(decoded?.supplyRaw, "4242");
    assert.equal(decoded?.mintAuthority.state, "revocada");
    assert.equal(decoded?.freezeAuthority.state, "activa");
    const meta = read.decodeMetadataAccount(metadataBytes("<script>alert(1)</script>", "ABC", "https://evil.example/phish", 1));
    assert.ok(meta);
    assert.equal(meta?.name.includes("<"), false);
    assert.equal(meta?.uri, "https://evil.example/phish");
    assert.equal(meta?.mutable, "si");
    const calls: string[] = [];
    const result = await read.readMint({
      mint: CA,
      ...fastClock(),
      transport: async (_endpoint: string, body: string) => {
        const parsed = JSON.parse(body) as { method: string };
        calls.push(parsed.method);
        if (parsed.method === "getMultipleAccounts") {
          return rpcOk([
            account(read.TOKEN_PROGRAM, mintBytes()),
            account(read.METADATA_PROGRAM, metadataBytes("<script>alert(1)</script>", "STB", "https://evil.example/phish")),
            account(read.PUMP_PROGRAM, curveBytes()),
          ]);
        }
        if (parsed.method === "getTokenSupply") return rpcOk({ amount: "1000", decimals: 6, uiAmount: null, uiAmountString: "skip" });
        throw new Error(parsed.method);
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.card?.isMint, true);
    assert.equal(result.card?.partial, false);
    assert.equal(result.card?.officialStubx, true);
    assert.equal(result.card?.name.text?.includes("<"), false);
    assert.equal(result.card?.uri.text, "https://evil.example/phish");
    assert.equal(JSON.stringify(result.card).includes("uiAmount"), false);
    assert.deepEqual(calls, ["getMultipleAccounts", "getTokenSupply"]);
    assert.equal(calls.includes("getTokenLargestAccounts"), false);
  });

  test("429, cuenta ausente, no-mint y dirección inválida no inventan un cero", async () => {
    const { read } = await modules();
    let calls = 0;
    const limited = await read.readMint({
      mint: OTHER,
      ...fastClock(),
      transport: async () => {
        calls += 1;
        return { status: 429, body: "{}" };
      },
    });
    assert.equal(limited.ok, false);
    assert.equal(limited.card?.supplyRpc, null);
    assert.equal(limited.card?.supplyAccount, null);
    assert.equal(JSON.stringify(limited.card).includes('"0"'), false);
    assert.ok(calls >= 3);

    const missing = await read.readMint({
      mint: OTHER,
      ...fastClock(),
      transport: async (_endpoint: string, body: string) => {
        assert.equal((JSON.parse(body) as { method: string }).method, "getMultipleAccounts");
        return rpcOk([null, null, null]);
      },
    });
    assert.equal(missing.ok, true);
    assert.equal(missing.card?.program, "no_es_mint");
    assert.equal(missing.card?.partial, false);
    assert.equal(missing.card?.supplyRpc, null);

    const foreign = await read.readMint({
      mint: OTHER,
      ...fastClock(),
      transport: async () => rpcOk([account("11111111111111111111111111111111", Buffer.from([1, 2, 3])), null, null]),
    });
    assert.equal(foreign.card?.program, "no_es_mint");

    let touched = false;
    const invalid = await read.readMint({
      mint: "no-es-una-direccion",
      ...fastClock(),
      transport: async () => {
        touched = true;
        return { status: 200, body: "{}" };
      },
    });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.card, null);
    assert.equal(touched, false);
    assert.equal(read.isAllowedRpcUrl("http://api.mainnet-beta.solana.com"), false);
    assert.equal(read.isAllowedRpcUrl("https://user:secret@example.com"), false);
  });

  test("importar rechaza script, 10 MB y un esquema roto, y una copia válida vuelve", async () => {
    const { read, model } = await modules();
    const huge = "x".repeat(model.MAX_BYTES + 1);
    assert.match(model.validateExport(huge).error?.es ?? "", /1 MB/);
    assert.equal(model.validateExport("{").ok, false);
    assert.equal(model.validateExport('{"schema":"<script>alert(1)</script>"}').ok, false);
    const card = read.blankCard(OTHER, WHEN, []);
    const checked = model.validateCard(card);
    assert.equal(checked.ok, true);
    const record = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", note: "nota aparte", card };
    const copy = model.toExport([record], WHEN);
    const back = model.validateExport(copy);
    assert.equal(back.ok, true);
    assert.equal(back.records?.[0]?.note, "nota aparte");
    assert.equal(back.records?.[0]?.card.mint, OTHER);
    const broken = JSON.parse(copy) as { cards: Array<Record<string, unknown>> };
    broken.cards.push({ ...broken.cards[0], id: record.id });
    assert.match(model.validateExport(JSON.stringify(broken)).error?.es ?? "", /mismo id/);
    const priced = JSON.parse(copy) as { price?: number };
    priced.price = 1;
    assert.equal(model.validateExport(JSON.stringify(priced)).ok, false);
  });

  test("solo se comparan dos fichas del mismo mint y la antigua no se presenta como actual", async () => {
    const { read, model } = await modules();
    const left = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", note: "primera", card: read.blankCard(CA, WHEN, []) };
    const rightCard = read.blankCard(CA, "2026-10-09T13:00:00.000Z", []);
    rightCard.supplyAccount = "5";
    const right = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", note: "segunda", card: rightCard };
    const same = model.compareRecords(left, right);
    assert.equal(same.ok, true);
    assert.equal(same.rows?.some((row) => row.field.es === "Suministro en la cuenta" && row.same === false), true);
    const other = model.compareRecords(left, { ...right, card: read.blankCard(OTHER, WHEN, []) });
    assert.equal(other.ok, false);
    assert.match(model.staleLine(WHEN, "es"), /puede haber cambiado/);
    assert.match(model.staleLine(WHEN, "en"), /this may have changed/);
    assert.equal(model.staleLine(WHEN, "es").includes("actual"), false);
  });

  test("las páginas nuevas no firman, no nombran otros tokens y llevan el pie", () => {
    const root = repoRoot();
    const files = [
      "web/v2/shared/solana-read.js",
      "web/v2/shared/notebook-model.js",
      "web/v2/assets/cuaderno.js",
      "web/v2/assets/draft-address.js",
    ];
    const banned = ["signTransaction", "sendTransaction", "phantom", "innerHTML"];
    for (const rel of files) {
      const source = readFileSync(path.join(root, rel), "utf8");
      for (const word of banned) assert.equal(source.includes(word), false, `${rel} ${word}`);
    }
    const aprender = readFileSync(path.join(root, "web/v2/aprender/index.html"), "utf8");
    for (const id of [
      "direccion",
      "registro",
      "autoridad-emision",
      "autoridad-congelacion",
      "metadatos-mutables",
      "desconocido",
      "curva-pump",
      "reserva-real",
      "reserva-virtual",
      "suplantacion",
      "titular",
      "holder",
      "ficha",
      "censo",
      "comision",
      "extension-token-2022",
      "guia-identificar",
      "guia-permisos",
      "guia-liquidez",
    ]) {
      assert.match(aprender, new RegExp(`id="${id}"`));
    }
    assert.match(aprender, /Pendiente de revisión humana|pendiente de revisión humana/);
    assert.ok(aprender.includes(CA));
    assert.equal(aprender.includes("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), false);
    assert.equal(aprender.toLowerCase().includes("estafa"), false);
    assert.match(aprender, /Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión\./);
    assert.match(aprender, /High-risk crypto · You could lose everything · Not investment advice\./);
    const main = aprender.slice(aprender.indexOf("<main"), aprender.indexOf("</main>"));
    assert.equal(main.includes("https://"), false);
    assert.match(aprender, /href="\/verify\/"/);
    const notebook = readFileSync(path.join(root, "web/v2/cuaderno/index.html"), "utf8");
    assert.match(notebook, /puede haber cambiado/);
    assert.match(notebook, /this may have changed/);
    assert.match(notebook, /connect-src 'self' https:\/\/api\.mainnet-beta\.solana\.com/);
    assert.equal(notebook.includes("frame-ancestors"), false);
    assert.match(notebook, /No es una auditoría ni una recomendación\./);
    assert.equal(notebook.toLowerCase().includes("phantom"), false);
    const verify = readFileSync(path.join(root, "web/v2/verify/index.html"), "utf8");
    assert.match(verify, /draft-address\.js/);
    assert.match(verify, /href="\/aprender\/#direccion"/);
    const mission = readFileSync(path.join(root, "lab/client/ui.js"), "utf8");
    assert.match(mission, /\/aprender\/\?from=lab#/);
  });
});
