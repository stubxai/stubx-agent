import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { repoRootFrom } from "../root.js";
import { labFixtures } from "../test/layouts.js";

const dir = path.join(repoRootFrom(import.meta.url), "verify", "test", "fixtures");
mkdirSync(dir, { recursive: true });
for (const fixture of labFixtures()) {
  writeFileSync(path.join(dir, `${fixture.id}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
}
console.log(`fixtures: ${labFixtures().length}`);
