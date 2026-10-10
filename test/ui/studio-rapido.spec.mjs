import { expect, test } from "@playwright/test";

test("móvil: el cambio de fondo y de formato responde sin bloquear", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile", "solo el móvil emulado");
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/studio/");
  await expect(page.locator("#descargar")).toBeEnabled({ timeout: 60_000 });

  async function change(selector) {
    return page.evaluate(async (sel) => {
      const button = document.querySelector(sel);
      const canvas = document.querySelector("#vista");
      const loading = document.querySelector("#vista-carga");
      const sample = () => {
        const pixel = canvas.getContext("2d").getImageData(6, 6, 1, 1).data;
        return `${canvas.width}x${canvas.height}:${pixel[0]},${pixel[1]},${pixel[2]}`;
      };
      const before = sample();
      const start = performance.now();
      button.click();
      const response = performance.now() - start;
      const busy = canvas.getAttribute("aria-busy") === "true" || loading.hidden === false;
      let paint = 0;
      await new Promise((resolve) => {
        const tick = () => {
          const now = performance.now() - start;
          if (sample() !== before) {
            paint = now;
            resolve();
            return;
          }
          if (now > 8000) resolve();
          else setTimeout(tick, 16);
        };
        setTimeout(tick, 16);
      });
      return {
        response: Math.round(response),
        busy,
        paint: Math.round(paint),
        width: canvas.width,
        height: canvas.height,
      };
    }, selector);
  }

  await page.locator("#tab-fondo").click();
  const fondo = await change("#opcion-fondo button:nth-child(2)");
  const fondo2 = await change("#opcion-fondo button:nth-child(4)");
  await page.locator("#tab-formato").click();
  const story = await change("[data-format='story']");
  const square = await change("[data-format='square']");
  const times = { fondo, fondo2, story, square };
  console.log(JSON.stringify(times));
  for (const [name, item] of Object.entries(times)) {
    expect(item.response, name).toBeLessThan(100);
    expect(item.busy, name).toBe(true);
    expect(item.paint, name).toBeGreaterThan(0);
    expect(item.paint, name).toBeLessThan(8000);
    expect(item.width, name).toBeLessThanOrEqual(540);
    expect(item.height, name).toBeLessThanOrEqual(540);
  }
  expect(story.height / story.width).toBeGreaterThan(1.7);
  expect(square.width).toBe(square.height);
});
