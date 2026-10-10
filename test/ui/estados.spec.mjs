import { test, expect } from "@playwright/test";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const STUBX = "TNWwnzecb37272ZoySDE6D2UcmqNnU12EqtycNSpump";

function mintBytes(supply) {
  const data = Buffer.alloc(82);
  data.writeBigUInt64LE(supply, 36);
  data[44] = 6;
  data[45] = 1;
  return data.toString("base64");
}

function account(data) {
  return {
    lamports: 1,
    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    executable: false,
    rentEpoch: 0,
    data: [data, "base64"],
  };
}

function rpcResult(value, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(
      status === 200
        ? { jsonrpc: "2.0", id: 1, result: { context: { slot: 455334034 }, value } }
        : { jsonrpc: "2.0", id: 1, error: { code: status, message: status === 403 ? "Request blocked" : "Too many requests" } },
    ),
  };
}

async function mockRpc(page, mode) {
  await page.route(/solana-rpc\.publicnode\.com|api\.mainnet-beta\.solana\.com/, async (route) => {
    const body = route.request().postDataJSON();
    const method = body?.method;
    if (mode === "ausente") {
      if (method === "getMultipleAccounts") return route.fulfill(rpcResult([null, null, null]));
      return route.fulfill(rpcResult(null, 403));
    }
    if (mode === "403") {
      if (method === "getMultipleAccounts") return route.fulfill(rpcResult([account(mintBytes(1_000_000n)), null, null]));
      return route.fulfill(rpcResult(null, 403));
    }
    if (method === "getMultipleAccounts") return route.fulfill(rpcResult([account(mintBytes(1_000_000n)), null, null]));
    if (method === "getTokenSupply") {
      return route.fulfill(rpcResult({ amount: "1000000", decimals: 6, uiAmountString: "1" }));
    }
    if (method === "getTokenLargestAccounts") return route.fulfill(rpcResult([]));
    return route.fulfill(rpcResult(1));
  });
}

for (const mint of [STUBX, USDC]) {
  test(`verify ${mint} muestra ok, 403 y ausencia`, async ({ page }) => {
    await mockRpc(page, "ok");
    await page.goto("/verify/");
    await page.locator("#direccion-token").fill(mint);
    await page.locator("#consulta button[type='submit']").click();
    await expect(page.locator("#resultado")).toContainText(/Hay 1 tokens/);
    await expect(page.locator(".resumen-datos")).toContainText(/ausente comprobado|No falta/);
    await expect(page.locator("#resultado")).not.toContainText(/no disponible · verificado|verificado · no disponible/i);

    await mockRpc(page, "403");
    await page.locator("#direccion-token").fill(mint);
    await page.locator("#consulta button[type='submit']").click();
    await expect(page.locator("#resultado")).toContainText(/consulta fallida/);
    await expect(page.locator("#resultado")).not.toContainText(/no disponible · verificado/i);

    await mockRpc(page, "ausente");
    await page.locator("#direccion-token").fill(mint);
    await page.locator("#consulta button[type='submit']").click();
    await expect(page.locator("#resultado")).toContainText(/ausente comprobado|no existe/i);
    if (mint !== STUBX) await expect(page.locator(".franja-identidad")).toContainText(STUBX);
  });
}
