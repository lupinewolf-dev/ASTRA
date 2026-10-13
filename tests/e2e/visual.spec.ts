import { test, expect } from "@playwright/test";
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 844, height: 390 },
])
  test(`3D farm renders at ${viewport.width}x${viewport.height} without mutating World`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/visual.html");
    await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
    await expect(page.locator(".farm-panel")).toHaveCount(0);
    expect(await page.evaluate(() => window.astraVisual!.worldUnchanged)).toBe(
      true,
    );
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/visual-${viewport.width}.png`,
    });
    await page.setViewportSize({
      width: viewport.width - 80,
      height: viewport.height + 30,
    });
    await expect
      .poll(() =>
        page.locator("canvas").evaluate((c) => c.getBoundingClientRect().width),
      )
      .toBe(viewport.width - 80);
    await page.evaluate(() => window.astraVisual!.dispose());
    expect(await page.evaluate(() => window.astraVisual!.disposed())).toBe(
      true,
    );
    await expect(page.locator("canvas")).toHaveCount(0);
  });
test("readable fallback when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (original as Function).call(this, type, ...args);
    } as typeof original;
  });
  await page.goto("/visual.html");
  await expect(page.getByRole("alert")).toContainText("3D");
  await expect(page.getByRole("alert")).toContainText("WebGL");
});
test("existing game entry still loads separately", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByLabel("Nombre de jugador")).toBeVisible();
  await expect(page.locator("#visual-scene")).toHaveCount(0);
  expect(errors).toEqual([]);
});
