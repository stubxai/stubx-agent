import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { decodePubkey, encodeBase58 } from "../base58.js";
import { candidateUrls, fetchBytes, isPrivateAddress } from "../http.js";
import { compareCanonical, normalizeToken, normalizeUrl } from "../impersonation.js";
import { validateMint } from "../input.js";
import { cleanText, decodeMint } from "../mint.js";
import { PUMP_DISCRIMINATOR, PUMP_PROGRAM, TOKEN_2022_PROGRAM, TOKEN_PROGRAM, associatedTokenAddress, bondingCurvePda } from "../programs.js";
import { buildReport, redactEndpoint } from "../report.js";
import { repoRootFrom } from "../root.js";
import { RpcClient, type RpcTransport } from "../rpc.js";
import type { CanonicalToken } from "../types.js";

const root = repoRootFrom(import.meta.url);
const registry = (JSON.parse(readFileSync(path.join(root, "verify/registry/canonical.json"), "utf8")) as { tokens: CanonicalToken[] }).tokens;
const CID = "bafkreiew224xxf6ncagzzew5bfxlc6hejrib6jmxx66kxdrv5pkeoavd5e";
const AR = "A".repeat(43);

function signalsFor(names: string[] = [], links: string[] = []): string[] {
  return compareCanonical(
    { mint: "mint-de-prueba-que-no-esta-en-el-registro-curado", names, symbols: [], imageUris: [], links },
    registry,
  ).signals;
}

describe("detector de suplantación", () => {
  test("x.com/Stubxai y x.com/STUBXAI coinciden sin mirar mayúsculas", () => {
    assert.equal(normalizeUrl("https://x.com/Stubxai"), "x.com/stubxai");
    assert.equal(normalizeUrl("https://x.com/STUBXAI"), "x.com/stubxai");
    assert.ok(signalsFor([], ["https://x.com/Stubxai"]).length > 0);
    assert.ok(signalsFor([], ["https://x.com/STUBXAI"]).length > 0);
  });

  test("mobile.x.com/stubxai coincide con el perfil del registro", () => {
    assert.equal(normalizeUrl("https://mobile.x.com/stubxai"), "x.com/stubxai");
    assert.ok(signalsFor([], ["https://mobile.x.com/stubxai"]).length > 0);
  });

  test("el host de Netlify con punto inicial coincide", () => {
    assert.ok(signalsFor([], ["https://.superb-horse-9036f5.netlify.app"]).length > 0);
  });

  test("un dominio Netlify con una errata coincide", () => {
    assert.ok(signalsFor([], ["https://superb-horse-9036f6.netlify.app/"]).length > 0);
  });

  test("STUBXAI, STUBX2 y S T U B X contienen stubx", () => {
    assert.equal(normalizeToken("STUBXAI").includes("stubx"), true);
    assert.equal(normalizeToken("STUBX2").includes("stubx"), true);
    assert.equal(normalizeToken("S T U B X"), "stubx");
    assert.ok(signalsFor(["STUBXAI"]).length > 0);
    assert.ok(signalsFor(["STUBX2"]).length > 0);
    assert.ok(signalsFor(["S T U B X"]).length > 0);
  });

  test("la T griega y la S cirílica se pliegan antes de comparar", () => {
    assert.equal(normalizeToken("S\u03A4UBX"), "stubx");
    assert.equal(normalizeToken("\u0421TUBX"), "stubx");
    assert.ok(signalsFor(["S\u03A4UBX"]).length > 0);
    assert.ok(signalsFor(["\u0421TUBX"]).length > 0);
  });

  test("NFKC pliega las letras de ancho completo", () => {
    assert.equal(normalizeToken("\uFF33\uFF34\uFF35\uFF22\uFF38"), "stubx");
    assert.ok(signalsFor(["\uFF33\uFF34\uFF35\uFF22\uFF38"]).length > 0);
  });

  test("la CLI marca S.T.U.B.X, 5TUBX, versalitas y el handle con sufijo", () => {
    assert.equal(normalizeToken("S.T.U.B.X"), "stubx");
    assert.equal(normalizeToken("5TUBX"), "stubx");
    assert.equal(normalizeToken("\uA731\u1D1B\u1D1C\u0299x"), "stubx");
    assert.ok(signalsFor(["S.T.U.B.X"]).length > 0);
    assert.ok(signalsFor(["5TUBX"]).length > 0);
    assert.ok(signalsFor(["\uA731\u1D1B\u1D1C\u0299x"]).length > 0);
    assert.ok(signalsFor([], ["https://x.com/stubxai_"]).length > 0);
    assert.ok(signalsFor([], ["https://x.com/stubxai_oficial"]).length > 0);
    assert.ok(signalsFor([], ["https://x.com/stubx_ai"]).length > 0);
    assert.equal(signalsFor(["Stubborn"]).length, 0);
    assert.equal(signalsFor(["EVILcoin"]).length, 0);
    assert.equal(signalsFor([], ["https://stubxai.com.evil.io"]).length, 0);
  });
});

describe("descarga y redacción", () => {
  test("no descarga una URI de creador ni una IP privada", async () => {
    let calls = 0;
    const blocked = await fetchBytes("https://creador.example/meta.json", {
      fetchImpl: async () => {
        calls += 1;
        return new Response("no");
      },
    });
    assert.equal(blocked.ok, false);
    assert.equal(calls, 0);
    assert.deepEqual(candidateUrls("https://creador.example/meta.json"), []);
    assert.equal(isPrivateAddress("10.1.2.3"), true);
    assert.equal(isPrivateAddress("100.64.1.1"), true);
    assert.equal(isPrivateAddress("fc00::1"), true);
    assert.equal(isPrivateAddress("fe80::1"), true);
    assert.equal(isPrivateAddress("::1"), true);
    assert.equal(isPrivateAddress("198.18.0.1"), true);
    assert.equal(isPrivateAddress("198.19.255.1"), true);
    assert.equal(isPrivateAddress("8.8.8.8"), false);
    assert.equal(isPrivateAddress("64:ff9b::1"), true);
    assert.equal(isPrivateAddress("::ffff:7f00:1"), true);
    assert.equal(isPrivateAddress("::ffff:127.0.0.1"), true);
    assert.equal(isPrivateAddress("::ffff:808:808"), false);
  });

  test("un CID solo sale por las pasarelas y una redirección privada no se sigue", async () => {
    const seen: string[] = [];
    const result = await fetchBytes(`https://ipfs.io/ipfs/${CID}`, {
      maxRetries: 0,
      sleep: async () => {},
      random: () => 0,
      resolveHost: async (host) => (host === "10.0.0.1" ? ["10.0.0.1"] : ["1.1.1.1"]),
      fetchImpl: async (url) => {
        seen.push(String(url));
        return new Response(null, { status: 302, headers: { location: "https://10.0.0.1/secreto" } });
      },
    });
    assert.equal(result.ok, false);
    assert.equal(seen.some((url) => url.includes("10.0.0.1")), false);
    assert.equal(seen.some((url) => url.includes("creador.example")), false);
    assert.ok(candidateUrls(`ar://${AR}`).every((url) => url.startsWith("https://arweave.net/")));
  });

  test("redactEndpoint no conserva una clave en la ruta", () => {
    assert.equal(redactEndpoint("https://api.mainnet-beta.solana.com"), "https://api.mainnet-beta.solana.com");
    const hidden = redactEndpoint("https://xxx.solana-mainnet.quiknode.pro/secreto-de-ruta/");
    assert.equal(hidden, "rpc-configurada");
    assert.equal(hidden.includes("secreto-de-ruta"), false);
  });
});

describe("texto, puntero y holders", () => {
  test("cleanText recorta el relleno nulo y marca el bidi", () => {
    assert.equal(cleanText("STUBX"), "STUBX");
    assert.equal(cleanText("USD Coin\0\0\0"), "USD Coin");
    assert.equal(cleanText("USDC\0"), "USDC");
    assert.equal(cleanText("\0\0\0"), "");
    const marked = cleanText("STUB\u202EX");
    assert.equal(marked.includes("\u202E"), false);
    assert.equal(marked.includes("\uFFFD"), true);
  });

  test("una dirección 0x no consulta la red y nombra la copia si está en la lista", () => {
    const clones = JSON.parse(readFileSync(path.join(root, "verify/registry/clones.json"), "utf8")) as {
      evm: Array<{ address: string }>;
    };
    const known = clones.evm.map((item) => item.address);
    const copy = validateMint("0xc99056c762f0802e4154e6322bd71ae928857777", known);
    assert.equal(copy.ok, false);
    if (!copy.ok) {
      assert.match(copy.message, /Copia conocida/);
      assert.match(copy.message, /El STUBX oficial solo existe en Solana/);
      assert.match(copy.message, /sin verificar en la cadena/);
    }
    const other = validateMint("0x0000000000000000000000000000000000000001", known);
    assert.equal(other.ok, false);
    if (!other.ok) {
      assert.match(other.message, /El STUBX oficial solo existe en Solana/);
      assert.equal(other.message.includes("Copia conocida"), false);
    }
    const loose = validateMint("0xhola", known);
    assert.equal(loose.ok, false);
    if (!loose.ok) {
      assert.match(loose.message, /El STUBX oficial solo existe en Solana/);
    }
  });

  test("getTokenLargestAccounts espera segundos y el 429 lee la curva", async () => {
    const sleeps: number[] = [];
    let attempts = 0;
    const rpc = new RpcClient({
      endpoint: "https://api.mainnet-beta.solana.com",
      minIntervalMs: 0,
      maxRetries: 2,
      backoffBaseMs: 500,
      random: () => 0,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      transport: async () => {
        attempts += 1;
        return { status: 429, body: JSON.stringify({ jsonrpc: "2.0", error: { code: 429, message: "Too many requests" }, id: 1 }) };
      },
    });
    const failed = await rpc.getTokenLargestAccounts("TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump");
    assert.equal(failed.ok, false);
    assert.deepEqual(sleeps, [1000, 2000]);
    assert.equal(attempts, 3);

    const fixture = JSON.parse(readFileSync(path.join(root, "verify/test/fixtures/revoked-mint.json"), "utf8")) as {
      mint: string;
      slot: number;
      mintAccount: { owner: string; executable: boolean; lamports: number; space: number; dataBase64: string };
    };
    const curve = bondingCurvePda(fixture.mint);
    const curveAta = associatedTokenAddress(curve, fixture.mint, TOKEN_PROGRAM);
    assert.ok(curveAta);
    const mintBytes = decodePubkey(fixture.mint);
    const curveBytes = decodePubkey(curve);
    assert.ok(mintBytes && curveBytes);
    const data = new Uint8Array(165);
    data.set(mintBytes, 0);
    data.set(curveBytes, 32);
    data[64] = 100;
    const transport: RpcTransport = async (_endpoint, body) => {
      const request = JSON.parse(body) as { method: string; params?: unknown[] };
      if (request.method === "getSlot") {
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: fixture.slot, id: 1 }) };
      }
      if (request.method === "getTokenLargestAccounts") {
        return { status: 429, body: JSON.stringify({ jsonrpc: "2.0", error: { code: 429, message: "Too many requests" }, id: 1 }) };
      }
      if (request.method === "getMultipleAccounts") {
        const addresses = Array.isArray(request.params?.[0]) ? request.params[0] : [];
        const value = addresses.map((address) => address === curveAta
          ? { data: [Buffer.from(data).toString("base64"), "base64"], executable: false, lamports: 1, owner: TOKEN_PROGRAM, space: data.length }
          : null);
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: fixture.slot }, value }, id: 1 }) };
      }
      if (request.method === "getAccountInfo") {
        const address = String(request.params?.[0] ?? "");
        if (address === curve) {
          const curveData = new Uint8Array(49);
          curveData.set(PUMP_DISCRIMINATOR, 0);
          return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: fixture.slot }, value: { data: [Buffer.from(curveData).toString("base64"), "base64"], executable: false, lamports: 1, owner: PUMP_PROGRAM, space: curveData.length } }, id: 1 }) };
        }
        const account = address === fixture.mint ? fixture.mintAccount : null;
        const value = account
          ? { data: [account.dataBase64, "base64"], executable: account.executable, lamports: account.lamports, owner: account.owner, space: account.space }
          : null;
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: fixture.slot }, value }, id: 1 }) };
      }
      if (request.method === "getTokenSupply") {
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: fixture.slot }, value: { amount: "1000000000000000", decimals: 6 } }, id: 1 }) };
      }
      return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: request.method }, id: 1 }) };
    };
    const client = new RpcClient({
      endpoint: "https://api.mainnet-beta.solana.com",
      transport,
      minIntervalMs: 0,
      maxRetries: 0,
      sleep: async () => {},
      random: () => 0,
      now: () => new Date("2026-10-09T12:00:00.000Z"),
    });
    const report = await buildReport({
      mint: fixture.mint,
      rpc: client,
      rpcEndpoint: "https://api.mainnet-beta.solana.com",
      registry,
      now: () => new Date("2026-10-09T12:00:00.000Z"),
      loadMetadata: async () => ({ ok: false, url: null, status: null, error: "sin uri", fetchedAt: "2026-10-09T12:00:00.000Z" }),
      loadImage: async () => ({ ok: false, url: null, status: null, error: "sin imagen", fetchedAt: "2026-10-09T12:00:00.000Z" }),
    });
    assert.equal(report.distribution.sample.status, "verificado");
    assert.match(String(report.distribution.sample.note), /no es un censo/i);
    const sample = report.distribution.sample.value;
    assert.ok(Array.isArray(sample) && sample.some((row) => row && typeof row === "object" && "tokenAccount" in row && row.tokenAccount === curveAta));
  });

  test("un MetadataPointer que no es el mint no verifica el nombre", async () => {
    const mint = JSON.parse(readFileSync(path.join(root, "verify/test/fixtures/revoked-mint.json"), "utf8")) as { mint: string; slot: number };
    const other = new Uint8Array(32);
    other.fill(9);
    const metadata = concat(new Uint8Array(64), borshString("OTRO"), borshString("OT"), borshString("ipfs://bafkreiew224xxf6ncagzzew5bfxlc6hejrib6jmxx66kxdrv5pkeoavd5e"), Uint8Array.of(0, 0, 0, 0));
    const pointer = new Uint8Array(64);
    pointer.set(other, 32);
    const body = concat(tlv(18, pointer), tlv(19, metadata));
    const bytes = new Uint8Array(166 + body.length);
    bytes[45] = 1;
    bytes[44] = 6;
    bytes[165] = 1;
    bytes.set(body, 166);
    const decoded = decodeMint(TOKEN_2022_PROGRAM, bytes);
    assert.ok(decoded?.metadataPointer);
    assert.equal(decoded.metadataPointer.address, encodeBase58(other));
    assert.notEqual(decoded.metadataPointer.address, mint.mint);
    const transport: RpcTransport = async (_endpoint, requestBody) => {
      const request = JSON.parse(requestBody) as { method: string; params?: unknown[] };
      if (request.method === "getSlot") {
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: mint.slot, id: 1 }) };
      }
      if (request.method === "getAccountInfo" && String(request.params?.[0] ?? "") === mint.mint) {
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: mint.slot }, value: { data: [Buffer.from(bytes).toString("base64"), "base64"], executable: false, lamports: 1, owner: TOKEN_2022_PROGRAM, space: bytes.length } }, id: 1 }) };
      }
      if (request.method === "getAccountInfo" || request.method === "getMultipleAccounts") {
        const empty = request.method === "getMultipleAccounts" ? [] : null;
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: mint.slot }, value: empty }, id: 1 }) };
      }
      if (request.method === "getTokenSupply") {
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: mint.slot }, value: { amount: "1000000", decimals: 6 } }, id: 1 }) };
      }
      if (request.method === "getTokenLargestAccounts") {
        return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", result: { context: { slot: mint.slot }, value: [] }, id: 1 }) };
      }
      return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: request.method }, id: 1 }) };
    };
    const report = await buildReport({
      mint: mint.mint,
      rpc: new RpcClient({
        endpoint: "https://api.mainnet-beta.solana.com",
        transport,
        minIntervalMs: 0,
        maxRetries: 0,
        sleep: async () => {},
        random: () => 0,
      }),
      rpcEndpoint: "https://api.mainnet-beta.solana.com",
      registry,
      now: () => new Date("2026-10-09T12:00:00.000Z"),
      loadMetadata: async () => ({ ok: false, url: null, status: null, error: "sin contenido", fetchedAt: "2026-10-09T12:00:00.000Z" }),
      loadImage: async () => ({ ok: false, url: null, status: null, error: "sin imagen", fetchedAt: "2026-10-09T12:00:00.000Z" }),
    });
    assert.equal(report.identity.onChainName.status, "no_disponible");
    assert.equal(report.findings.some((item) => item.id === "metadata-pointer" && item.level === "atención"), true);
  });
});

function borshString(value: string): Uint8Array {
  const raw = new TextEncoder().encode(value);
  const out = new Uint8Array(4 + raw.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, raw.length, true);
  out.set(raw, 4);
  return out;
}

function tlv(type: number, value: Uint8Array): Uint8Array {
  const out = new Uint8Array(4 + value.length);
  out[0] = type & 0xff;
  out[1] = (type >> 8) & 0xff;
  out[2] = value.length & 0xff;
  out[3] = (value.length >> 8) & 0xff;
  out.set(value, 4);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
