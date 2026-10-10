import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const shots = "/opt/cursor/artifacts/screenshots";
const FOOTER_ES = "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.";
const FOOTER_EN = "High-risk crypto · You could lose everything · Not investment advice.";

test.beforeAll(() => {
  mkdirSync(shots, { recursive: true });
});

test("el tablero explica los estados y cambia de idioma", async ({ page }, info) => {
  const project = info.project.name;
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Abrir el tablero" })).toBeVisible();
  await page.goto("/tablero/");
  await expect(page.locator("h1")).toContainText("Tablero de construcción");
  await expect(page.locator("#como-leerlo")).toContainText("No es un plazo");
  await expect(page.locator("#plantilla")).toContainText("no avala ningún token");
  await expect(page.locator('#plantilla a[href="/modules/tablero/plantilla.json"]')).toBeVisible();
  await expect(page.locator("footer")).toContainText(FOOTER_ES);
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator('[data-web="si"]')).toHaveCount(0);
  await page.screenshot({ path: `${shots}/u03-tablero-${project}-es.png`, fullPage: project === "desktop" });

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lang", "en");
  await expect(page.locator("h1")).toContainText("Construction board");
  await expect(page.locator("#como-leerlo")).toContainText("It is not a deadline");
  await expect(page.locator("footer")).toContainText(FOOTER_EN);
  await page.locator('a[href="#grupo-propuesta"]').click();
  await expect(page.locator("#grupo-propuesta")).toBeInViewport();
  await page.screenshot({ path: `${shots}/u03-tablero-${project}-en.png`, fullPage: false });
});
