import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import {
  PUMP_PROGRAM,
  TOKEN_PROGRAM,
  bytesToBase64,
  encodeCurveAccount,
  encodeGlobalAccount,
  encodeMintAccount,
} from "../../web/v2/modules/chain-read.mjs";

const shots = "/opt/cursor/artifacts/screenshots";
const FOOTER_ES = "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.";
const FOOTER_EN = "High-risk crypto · You could lose everything · Not investment advice.";
const MINT = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";
const RAW = "3438699491302";

function accounts() {
  const rows = [
    { owner: TOKEN_PROGRAM, data: encodeMintAccount(1000000000000000n, 6) },
    {
      owner: PUMP_PROGRAM,
      data: encodeCurveAccount({
        virtualToken: 1059122445097276n,
        virtualQuote: 30393086421n,
        realToken: 779222445097276n,
        realQuote: 393086421n,
        supply: 1000000000000000n,
        complete: false,
      }),
    },
    null,
    { owner: PUMP_PROGRAM, data: encodeGlobalAccount(95n, 5n) },
  ];
  return {
    jsonrpc: "2.0",
    id: 1,
    result: {
      context: { slot: 454936125 },
      value: rows.map((row) =>
        row
          ? { data: [bytesToBase64(row.data), "base64"], executable: false, lamports: 1, owner: row.owner, space: row.data.length }
          : null,
      ),
    },
  };
}

async function answer(route, status) {
  const request = route.request().postDataJSON();
  if (status !== 200) {
    await route.fulfill({ status, body: "no", contentType: "text/plain" });
    return;
  }
  if (request.method === "getSlot") {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id: 1, result: 454936125 }) });
    return;
  }
  if (request.method !== "getMultipleAccounts") {
    await route.fulfill({ status: 400, body: "metodo" });
    return;
  }
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(accounts()) });
}

test.beforeAll(() => {
  mkdirSync(shots, { recursive: true });
});

test("la calculadora estima un paso y cambia de idioma", async ({ page }, info) => {
  test.setTimeout(60000);
  const project = info.project.name;
  let calls = 0;
  page.on("request", (request) => {
    if (request.url().includes("solana")) calls += 1;
  });
  await page.goto("/comparar/");
  await expect(page.locator("h1")).toContainText("Calculadora educativa de la curva");
  await expect(page.locator("footer")).toContainText(FOOTER_ES);
  await page.getByRole("button", { name: "Estimar" }).click();
  await expect(page.locator("#resultado")).toContainText("Esa dirección no es válida");
  expect(calls).toBe(0);

  await page.route(/solana-rpc\.publicnode\.com/, (route) => answer(route, 200));
  await page.route(/api\.mainnet-beta\.solana\.com/, (route) => answer(route, 500));
  await page.locator("#direccion-token").fill(MINT);
  await page.locator("#cantidad").fill("0,1");
  await page.getByRole("button", { name: "Estimar" }).click();
  await expect(page.locator("#resultado")).toContainText(RAW, { timeout: 15000 });
  await expect(page.locator("#resultado")).toContainText("no disponible");
  await expect(page.locator("#resultado")).toContainText("Estimación educativa");
  await page.screenshot({ path: `${shots}/u07-comparar-${project}-es.png`, fullPage: project === "desktop" });

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lang", "en");
  await expect(page.locator("h1")).toContainText("Educational curve calculator");
  await expect(page.locator("footer")).toContainText(FOOTER_EN);
  await expect(page.locator("#resultado")).toContainText("Educational estimate");
  await page.screenshot({ path: `${shots}/u07-comparar-${project}-en.png`, fullPage: false });
});

test("si el primer servicio limita, se usa el respaldo", async ({ page }) => {
  const hosts = [];
  page.on("request", (request) => {
    if (request.url().includes("solana")) hosts.push(new URL(request.url()).host);
  });
  await page.route(/solana-rpc\.publicnode\.com/, (route) => answer(route, 429));
  await page.route(/api\.mainnet-beta\.solana\.com/, (route) => answer(route, 200));
  await page.goto("/comparar/");
  await page.locator("#direccion-token").fill(MINT);
  await page.locator("#cantidad").fill("0.1");
  await page.getByRole("button", { name: "Estimar" }).click();
  await expect(page.locator("#resultado")).toContainText("api.mainnet-beta.solana.com", { timeout: 20000 });
  await expect(page.locator("#resultado")).toContainText(RAW);
  expect(hosts[0]).toBe("solana-rpc.publicnode.com");
  expect(hosts.some((host) => host === "api.mainnet-beta.solana.com")).toBe(true);
});
