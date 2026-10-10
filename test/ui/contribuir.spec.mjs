import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const shots = "/opt/cursor/artifacts/screenshots";
const FOOTER_ES = "Cripto de alto riesgo · Puedes perderlo todo · No es consejo de inversión.";
const FOOTER_EN = "High-risk crypto · You could lose everything · Not investment advice.";

test.beforeAll(() => {
  mkdirSync(shots, { recursive: true });
});

test("contribuciones abre GitHub y cambia de idioma", async ({ page }, info) => {
  const project = info.project.name;
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Abrir contribuciones" })).toBeVisible();
  await page.goto("/contribuir/");
  await expect(page.locator("h1")).toContainText("Contribuir");
  await expect(page.getByRole("link", { name: "Informar un fallo" })).toHaveAttribute(
    "href",
    "https://github.com/stubxai/stubx-agent/issues/new?template=informe-fallo.yml",
  );
  await expect(page.getByRole("link", { name: "Proponer una mejora" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Descargar la plantilla" })).toHaveAttribute("href", "/contribuir/plantilla.md");
  await expect(page.locator("footer")).toContainText(FOOTER_ES);
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator("input, textarea")).toHaveCount(0);
  await page.screenshot({ path: `${shots}/u04-contribuir-${project}-es.png`, fullPage: project === "desktop" });

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lang", "en");
  await expect(page.locator("h1")).toContainText("Contribute");
  await expect(page.getByRole("link", { name: "Report a bug" })).toBeVisible();
  await expect(page.locator("footer")).toContainText(FOOTER_EN);
  await page.screenshot({ path: `${shots}/u04-contribuir-${project}-en.png`, fullPage: false });
});
