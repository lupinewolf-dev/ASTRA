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
test("keeps preview when browser caches and restores the document", async ({
  page,
}) => {
  await page.goto("/visual.html");
  await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await expect(page.locator("canvas")).toBeVisible();
  expect(await page.evaluate(() => window.astraVisual!.disposed())).toBe(false);
});
for (const phase of ["initial", "resize"])
  test(`render failure during ${phase} cleans up and shows fallback`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const failDraw = () => {
      WebGL2RenderingContext.prototype.drawElements = function () {
        throw new Error("Injected renderer failure");
      };
    };
    if (phase === "initial") await page.addInitScript(failDraw);
    await page.goto("/visual.html");
    if (phase === "resize") {
      await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
      await page.evaluate(failDraw);
    }
    await page.setViewportSize({ width: 900, height: 550 });
    await expect(page.getByRole("alert")).toBeVisible();
    await page.setViewportSize({ width: 780, height: 480 });
    await page.waitForTimeout(150);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
test("keyboard walking moves the farmer and stops after releasing", async ({
  page,
}) => {
  await page.goto("/visual.html");
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  const start = await canvas.getAttribute("data-player-x");
  await page.keyboard.down("d");
  await expect.poll(() => canvas.getAttribute("data-player-x")).not.toBe(start);
  await page.keyboard.up("d");
  await page.waitForTimeout(100);
  const stopped = await canvas.getAttribute("data-player-x");
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute("data-player-x")).toBe(stopped);
  expect(await page.evaluate(() => window.astraVisual!.worldUnchanged)).toBe(
    true,
  );
});
test("touch joystick moves and stops on release", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5180/visual.html");
  const joystick = page.getByRole("slider", { name: "Mover personaje" });
  await expect(joystick).toBeVisible();
  const canvas = page.locator("canvas");
  const start = await canvas.getAttribute("data-player-x");
  const box = (await joystick.boundingBox())!;
  await joystick.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2,
  });
  await joystick.dispatchEvent("pointermove", {
    pointerId: 1,
    pointerType: "touch",
    clientX: box.x + box.width,
    clientY: box.y + box.height / 2,
  });
  await expect.poll(() => canvas.getAttribute("data-player-x")).not.toBe(start);
  await joystick.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.waitForTimeout(100);
  const stopped = await canvas.getAttribute("data-player-x");
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute("data-player-x")).toBe(stopped);
  await context.close();
});
