import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { bannedHits } from "../lab/text.js";
import { repoRoot } from "../src/paths.js";

const STATES = ["propuesta", "en_curso", "en_revision", "publicada"];

describe("plantilla del tablero", () => {
  test("está vacía, no nombra un token y no promete fechas", () => {
    const file = path.join(repoRoot(), "lab/tablero/plantilla.json");
    const raw = readFileSync(file, "utf8");
    const template = JSON.parse(raw) as {
      tasks: Array<{ id: string; status: string; webPublished: boolean; exampleMint: string | null; evidence: unknown[] }>;
      states: string[];
      exampleMintNote: { es: string; en: string };
    };
    assert.deepEqual(template.states, STATES);
    assert.equal(template.tasks.length, 1);
    assert.equal(template.tasks[0]?.id, "EJEMPLO");
    assert.equal(template.tasks[0]?.status, "propuesta");
    assert.equal(template.tasks[0]?.webPublished, false);
    assert.equal(template.tasks[0]?.exampleMint, null);
    assert.deepEqual(template.tasks[0]?.evidence, []);
    assert.match(template.exampleMintNote.es, /no dice que el token sea bueno/);
    assert.match(template.exampleMintNote.en, /does not say the token is good/);
    assert.equal(/TNWw|EPjF|pump\b/i.test(raw), false);
    assert.deepEqual(bannedHits(template), []);
    const folded = raw.toLowerCase();
    for (const part of ["cri" + "stian", "par" + "do", "cama" + "cho"]) {
      assert.equal(folded.includes(part), false);
    }
  });
});
