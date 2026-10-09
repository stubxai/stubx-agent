import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { loadCards, loadFuentes } from "../mission/load.js";
import { repoRootFromMeta } from "../paths.js";
import { bannedHits } from "../text.js";
import { classifyAddress, emptyView, pendingView } from "../verify/lookup.js";

const root = repoRootFromMeta(import.meta.url);
const cards = loadCards(root, loadFuentes(root));
const official = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
const clone = "DjEjb6bxQ3Hjej9CzUAVeRqyt7k1tevHgcS37t41PUhQ";
const usdc = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const wrappedSol = "So11111111111111111111111111111111111111112";

describe("lectura de una dirección", () => {
  test("el vacío, la dirección inválida y la espera no dejan la pantalla en blanco", () => {
    const empty = emptyView();
    assert.equal(empty.kind, "vacio");
    assert.equal(empty.title.es, "La lectura aparece aquí");
    assert.ok(empty.support.es.length > 0);
    const invalid = classifyAddress("<script>alert(1)</script>", cards, "lista");
    assert.equal(invalid.kind, "invalida");
    assert.equal(invalid.title.es, "Esta dirección no es válida");
    assert.equal(invalid.mint, null);
    const spaces = classifyAddress("   hola mundo  ", cards, "lista");
    assert.equal(spaces.kind, "invalida");
    const pending = pendingView(`  ${official}  `);
    assert.equal(pending.kind, "comprobando");
    assert.equal(pending.title.es, "Comprobando esta dirección…");
    assert.equal(pending.mint, official);
    assert.equal(pending.support.es.includes("no se envía"), true);
  });

  test("la oficial, la copia y otra ficha no se confunden", () => {
    const known = classifyAddress(` \n${official}\n `, cards, "lista");
    assert.equal(known.kind, "oficial");
    assert.equal(known.light, "ok");
    assert.equal(known.title.es, "Parece el STUBX oficial");
    assert.equal(known.partialNote?.es.includes("no se rellena con un cero"), true);
    const copy = classifyAddress(clone, cards, "lista");
    assert.equal(copy.kind, "copia");
    assert.equal(copy.light, "riesgo");
    assert.equal(copy.title.es, "Cuidado: posible copia");
    assert.equal(copy.rows.find((row) => row.label.es === "Señal de copia")?.value.es, "Sí");
    const other = classifyAddress(usdc, cards, "lista");
    assert.equal(other.kind, "otra");
    assert.equal(other.title.es, "No es el STUBX oficial");
    assert.notEqual(other.light, "riesgo");
    const curve = other.rows.find((row) => row.label.es === "Avance de la curva");
    assert.equal(curve?.value.es, "No aplica");
    assert.equal(curve?.value.es.includes("0"), false);
  });

  test("sin ficha y con la lectura caída se dice que no se pudo comprobar", () => {
    const missing = classifyAddress(wrappedSol, cards, "lista");
    assert.equal(missing.kind, "sin_ficha");
    assert.equal(missing.title.es, "No se pudo comprobar");
    assert.match(missing.support.es, /no consulta la red/);
    assert.equal(missing.rows.length, 0);
    const down = classifyAddress(official, cards, "caida");
    assert.equal(down.kind, "lectura_caida");
    assert.equal(down.title.es, "No se pudo comprobar");
    assert.match(down.support.es, /no responde/);
    assert.notEqual(down.kind, "oficial");
    const stillInvalid = classifyAddress("no-es-una-direccion", [], "caida");
    assert.equal(stillInvalid.kind, "invalida");
  });

  test("el texto de la lectura no promete rentabilidad ni urgencia", () => {
    const views = [
      emptyView(),
      pendingView(official),
      classifyAddress(official, cards, "lista"),
      classifyAddress(clone, cards, "lista"),
      classifyAddress(usdc, cards, "lista"),
      classifyAddress(wrappedSol, cards, "lista"),
      classifyAddress(official, cards, "caida"),
      classifyAddress("???", cards, "lista"),
    ];
    assert.deepEqual(bannedHits(views), []);
  });
});
