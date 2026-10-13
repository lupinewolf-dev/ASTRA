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
  await expect.poll(() => canvas.getAttribute("data-gait")).not.toBe("0.000");
  await page.keyboard.up("d");
  await expect(canvas).toHaveAttribute("data-gait", "0.000");
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

test("shows the rebuilt male character in a separate close-up viewer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto("/visual.html?personaje=1");
  await expect(page.getByText("PERSONAJE · MODELO 3D REAL")).toBeVisible();
  await expect(page.locator('canvas[data-ready="true"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver espalda" })).toBeVisible();
  await page.screenshot({ path: "test-results/character-front.png" });
  await page.getByRole("button", { name: "Ver espalda" }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-view", "back");
  await page.screenshot({ path: "test-results/character-back.png" });
  expect(errors).toEqual([]);
  await page.evaluate(() => window.astraVisual!.dispose());
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ver espalda" })).toHaveCount(
    0,
  );
});

test("plays the local crop loop and can request a zombie wave", async ({
  page,
}) => {
  await page.goto("/visual.html");
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: /Cosechar/ }).click();
  await expect(canvas).toHaveAttribute("data-harvested", "1");
  await page.getByRole("button", { name: /Sembrar/ }).click();
  await page.getByRole("button", { name: /Regar/ }).click();
  await expect(page.getByRole("button", { name: /Creciendo/ })).toBeDisabled();
  await page.getByRole("button", { name: "Adelantar oleada" }).click();
  await expect(canvas).toHaveAttribute("data-phase", "wave");
  await expect(
    page.getByRole("status", { name: "Estado de la granja" }),
  ).toContainText("Zombis");
  await page.getByRole("button", { name: "Ver mapa [M]" }).click();
  await page.screenshot({ path: "test-results/playable-map.png" });
  await page.getByRole("button", { name: "Ver mapa [M]" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(
    page.getByRole("status", { name: "Estado de la granja" }),
  ).toContainText("Pausa");
  const time = await canvas.getAttribute("data-time");
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute("data-time")).toBe(time);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => canvas.getAttribute("data-time")).not.toBe(time);
});

test("mobile farming supports two independent touch sticks and portrait layout", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5180/visual.html");
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: /Cosechar/ }).click();
  await expect(canvas).toHaveAttribute("data-harvested", "1");
  const move = page.getByRole("slider", { name: "Mover personaje" }),
    aim = page.getByRole("slider", { name: "Apuntar", exact: true });
  const mb = (await move.boundingBox())!,
    ab = (await aim.boundingBox())!;
  await move.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    clientX: mb.x + mb.width / 2,
    clientY: mb.y + mb.height / 2,
  });
  await move.dispatchEvent("pointermove", {
    pointerId: 1,
    pointerType: "touch",
    clientX: mb.x,
    clientY: mb.y + mb.height / 2,
  });
  await aim.dispatchEvent("pointerdown", {
    pointerId: 2,
    pointerType: "touch",
    clientX: ab.x + ab.width / 2,
    clientY: ab.y + ab.height / 2,
  });
  await aim.dispatchEvent("pointermove", {
    pointerId: 2,
    pointerType: "touch",
    clientX: ab.x + ab.width,
    clientY: ab.y + ab.height / 2,
  });
  await expect(canvas).toHaveAttribute("data-aiming", "true");
  await move.dispatchEvent("pointercancel", { pointerId: 1 });
  await expect(canvas).toHaveAttribute("data-aiming", "true");
  await aim.dispatchEvent("pointercancel", { pointerId: 2 });
  await expect(canvas).toHaveAttribute("data-aiming", "false");
  await page.screenshot({ path: "test-results/playable-mobile.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(move).toBeVisible();
  await expect(aim).toBeVisible();
  await page.screenshot({ path: "test-results/playable-portrait.png" });
  expect(errors).toEqual([]);
  await context.close();
});
