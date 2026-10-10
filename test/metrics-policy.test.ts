import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { repoRoot } from "../src/paths.js";
import { ANALYTICS_MARKERS, METRICS_POLICY, analyticsHits } from "../src/metrics-policy.js";

const ROOTS = ["web/v2", "web/current", "site-drafts"];
const EXTENSIONS = new Set([".html", ".js", ".mjs", ".css"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...filesUnder(full));
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

describe("usage measurement stays off", () => {
  test("the policy refuses every form of collection", () => {
    assert.equal(METRICS_POLICY.clientMeasurement, false);
    assert.equal(METRICS_POLICY.cookies, false);
    assert.equal(METRICS_POLICY.thirdParties, false);
    assert.equal(METRICS_POLICY.storeIp, false);
    assert.equal(METRICS_POLICY.cloudflareWebAnalytics, false);
    assert.equal(METRICS_POLICY.aggregatedHitCounter, false);
    assert.deepEqual(METRICS_POLICY.allowedPublicSignals, ["github_stars", "github_forks", "github_watchers"]);
    assert.ok(ANALYTICS_MARKERS.length >= 10);
  });

  test("the website files do not contain a beacon, a cookie, or a counter", () => {
    const root = repoRoot();
    const misses: string[] = [];
    for (const rel of ROOTS) {
      for (const file of filesUnder(path.join(root, rel))) {
        const text = readFileSync(file, "utf8");
        const hits = analyticsHits(text);
        if (hits.length > 0) {
          misses.push(`${path.relative(root, file)}: ${hits.join(", ")}`);
        }
      }
    }
    assert.deepEqual(misses, []);
  });

  test("headers do not set a cookie and the service worker only refetches the page request", () => {
    const root = repoRoot();
    for (const rel of ["web/v2/_headers", "web/current/_headers"]) {
      const file = path.join(root, rel);
      if (!statSync(file, { throwIfNoEntry: false })?.isFile()) continue;
      const text = readFileSync(file, "utf8");
      assert.deepEqual(analyticsHits(text), [], rel);
    }
    const worker = readFileSync(path.join(root, "web/v2/lab/sw.js"), "utf8");
    assert.match(worker, /fetch\(event\.request\)/);
    assert.equal(/https?:\/\//.test(worker), false);
  });

  test("the decision document names the refusal and the public repo figures", () => {
    const doc = readFileSync(path.join(repoRoot(), "docs/medicion-uso.md"), "utf8");
    assert.match(doc, /No medimos el uso en el cliente/);
    assert.match(doc, /There is no client-side measurement/);
    assert.match(doc, /Cloudflare Web Analytics/);
    assert.match(doc, /github_stars|estrellas/);
    assert.match(doc, /Este proyecto no guarda la IP\. Cloudflare, como alojamiento, recibe la IP de cada visita/);
    assert.match(doc, /This project does not store the IP address\. Cloudflare, as the host, receives each visitor's IP/);
    assert.match(doc, /el HTML servido el 2026-10-10 no lleva la baliza/);
    assert.match(doc, /the HTML served on 2026-10-10 does not contain the beacon/);
    assert.match(doc, /Datos que se quedan en el navegador o salen a terceros/);
    assert.match(doc, /api\.mainnet-beta\.solana\.com/);
    const legal = readFileSync(path.join(repoRoot(), "web/v2/legal/index.html"), "utf8");
    assert.match(legal, /Cloudflare, como alojamiento, recibe la IP de cada visita/);
    assert.match(legal, /Cloudflare, as the host, receives each visitor's IP/);
    assert.equal(doc.includes("You can lose"), false);
  });
});
