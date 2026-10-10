import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { canonicalJson as verifyCanonical } from "../verify/bytes.js";
import { repoRoot } from "../src/paths.js";

const reportUrl = pathToFileURL(path.join(repoRoot(), "web/v2/modules/pair-report.mjs")).href;
const readUrl = pathToFileURL(path.join(repoRoot(), "web/v2/modules/chain-read.mjs")).href;
const OFFICIAL = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
const OTHER = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const FOOTER_ES = "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.";
const FOOTER_EN = "High-risk crypto · You could lose everything · Not investment advice.";

function curve(quoteSol: boolean, complete = false, quoteMint: string | null = null) {
  return { quoteSol, complete, quoteMint };
}

function fakeContext() {
  const texts: string[] = [];
  const ctx = {
    fillStyle: "",
    font: "",
    canvas: undefined as undefined,
    fillRect() {},
    fillText(text: string) {
      texts.push(text);
    },
    measureText(text: string) {
      return { width: text.length * 8 };
    },
  };
  return { ctx, texts };
}

describe("informe de pares", () => {
  test("la moneda base y la ruta no se inventan", async () => {
    const { describePair } = await import(reportUrl);
    assert.equal(describePair({ ok: false }).route, "no_compatible");
    assert.equal(describePair({ ok: false }).connector, "no_disponible");
    assert.notEqual(describePair({ ok: false }).route, "un_paso");
    const missing = describePair({ ok: true, curve: null, fees: null });
    assert.equal(missing.connector, "sin_curva");
    assert.equal(missing.base, "desconocida");
    assert.equal(missing.route, "no_compatible");
    const closed = describePair({ ok: true, curve: curve(true, true), fees: null });
    assert.equal(closed.connector, "completa");
    assert.equal(closed.base, "SOL");
    assert.equal(closed.route, "no_compatible");
    const other = describePair({ ok: true, curve: curve(false, false, OTHER), fees: null });
    assert.equal(other.connector, "abierta");
    assert.equal(other.base, OTHER);
    assert.equal(other.route, "no_compatible");
    const open = describePair({
      ok: true,
      curve: curve(true, false, null),
      fees: { protocol: { status: "leida", bps: 95n }, creator: { status: "leida", bps: 5n } },
    });
    assert.equal(open.route, "un_paso");
    assert.equal(open.protocolFeeBps, 95);
    assert.equal(open.creatorFeeBps, 5);
    const absent = describePair({
      ok: true,
      curve: curve(true),
      fees: { protocol: { status: "ausente" }, creator: { status: "ilegible" } },
    });
    assert.equal(absent.protocolFeeBps, null);
    assert.equal(absent.creatorFeeBps, null);
    const zero = describePair({
      ok: true,
      curve: curve(true),
      fees: { protocol: { status: "leida", bps: 0n }, creator: { status: "ausente" } },
    });
    assert.equal(zero.protocolFeeBps, 0);
  });

  test("el hash cambia si cambia la evidencia y no certifica verdad", async () => {
    const { canonicalJson, evidenceRecord, sha256Hex, snapshotLines, drawSnapshot } = await import(reportUrl);
    const sample = { version: "u09-pares-1", mint: OTHER, nested: { b: 1, a: null } };
    assert.equal(canonicalJson(sample), verifyCanonical(sample));
    const evidence = evidenceRecord({
      mint: OTHER,
      name: "<script>alert(1)</script>",
      uri: "https://evil.example/meta.json",
      base: "SOL",
      connector: "abierta",
      route: "un_paso",
      protocolFeeBps: 95,
      creatorFeeBps: null,
      slot: 454936125,
      source: "solana-rpc.publicnode.com",
      readAt: "2026-10-10T10:00:00.000Z",
    });
    const digest = await sha256Hex(canonicalJson(evidence));
    const copy = { ...evidence, mint: OFFICIAL, official: false };
    assert.notEqual(await sha256Hex(canonicalJson(copy)), digest);
    assert.equal(await sha256Hex(canonicalJson({ ...evidence })), digest);
    const { ctx, texts } = fakeContext();
    const lines = snapshotLines(evidence, "es");
    drawSnapshot(ctx, lines);
    const card = texts.join("\n");
    assert.match(card, /2026-10-10T10:00:00.000Z/);
    assert.match(card, /Instantánea: puede haber cambiado/);
    assert.match(card, /No es una auditoría ni una recomendación\./);
    assert.match(card, /STUBX no revisa ni respalda este token\./);
    assert.match(card, /Un emparejamiento no es una colaboración ni un respaldo\./);
    assert.match(card, /<script>alert\(1\)<\/script>/);
    assert.match(card, new RegExp(FOOTER_ES.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(card, /generado con stubxai.com\/verify/);
    assert.equal(/\b(verificado|seguro|aprobado|socio)\b/i.test(card), false);
    const official = snapshotLines(evidenceRecord({ ...evidence, mint: OFFICIAL }), "en");
    const english = official.map((line: { text: string }) => line.text).join("\n");
    assert.match(english, /This address matches the published STUBX CA\./);
    assert.match(english, new RegExp(FOOTER_EN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(english.includes("STUBX does not review or endorse this token."), false);
    assert.equal(/\b(verified|safe|approved|partner)\b/i.test(english), false);
  });

  test("los metadatos con script siguen siendo texto", async () => {
    const { METADATA_PROGRAM, decodeMetadata, encodeMetadataAccount } = await import(readUrl);
    const name = "<script>alert(1)</script>";
    const data = encodeMetadataAccount(OTHER, name, "X", "https://evil.example/meta.json");
    const decoded = decodeMetadata(METADATA_PROGRAM, data, OTHER);
    assert.equal(decoded?.name, name);
    assert.equal(decoded?.uri, "https://evil.example/meta.json");
    const sources = ["web/v2/modules/pair-report.mjs", "web/v2/modules/chain-read.mjs", "web/v2/assets/pares.mjs"]
      .map((file) => readFileSync(path.join(repoRoot(), file), "utf8"))
      .join("\n");
    assert.equal(sources.includes("sendTransaction"), false);
    assert.equal(sources.includes("signTransaction"), false);
    assert.equal(sources.includes("simulateTransaction"), false);
    assert.equal(sources.includes("innerHTML"), false);
  });
});
