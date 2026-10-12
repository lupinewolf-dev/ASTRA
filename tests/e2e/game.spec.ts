import { test, expect, type Page } from "@playwright/test";
async function register(page: Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Nombre de jugador").fill(name);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("test-password-123");
  await page
    .getByRole("button", { name: "Crear mi personaje", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Crear nuestra granja" }),
  ).toBeVisible();
}
async function player(page: Page) {
  return page.evaluate(() => {
    const b = window.astraTest!;
    return b.world()!.players[b.playerId];
  });
}
async function walk(page: Page, x: number, y: number) {
  await page.bringToFront();
  const stop = Date.now() + 20000;
  while (Date.now() < stop) {
    const p = await player(page);
    const dx = x - p.x,
      dy = y - p.y;
    if (Math.hypot(dx, dy) < 0.45) return;
    const choices = [
      { key: "d", score: dx - dy },
      { key: "a", score: -dx + dy },
      { key: "s", score: dx + dy },
      { key: "w", score: -dx - dy },
    ];
    const key = choices.sort((a, b) => b.score - a.score)[0].key;
    await page.keyboard.down(key);
    await page.waitForTimeout(150);
    await page.keyboard.up(key);
    await page.waitForTimeout(180);
  }
  throw Error(
    `Cannot walk to ${x},${y}; last state: ${JSON.stringify(await player(page))}`,
  );
}
async function stateReady(page: Page) {
  await expect
    .poll(() => page.evaluate(() => !!window.astraTest?.world()))
    .toBe(true);
}
test("two people share a farm, craft, grow, build, defend and reconnect", async ({
  browser,
}) => {
  const contextA = await browser.newContext(),
    contextB = await browser.newContext();
  const a = await contextA.newPage(),
    b = await contextB.newPage();
  await register(a, "Ana");
  await a.getByRole("button", { name: "Crear nuestra granja" }).click();
  await stateReady(a);
  await a.getByRole("button", { name: "Invitar pareja" }).click();
  await expect(a.getByLabel("Código de invitación")).toBeVisible();
  await expect(a.getByLabel("Código de invitación")).toHaveValue(
    /^[a-f0-9]{64}$/,
  );
  const code = await a.getByLabel("Código de invitación").inputValue();
  await a.getByRole("button", { name: "Cerrar", exact: true }).click();
  await register(b, "Bea");
  await b.getByPlaceholder("Pega aquí el código").fill(code);
  await b.getByRole("button", { name: "Unirme a su granja" }).click();
  await stateReady(b);
  await expect(b.locator("#members")).toContainText("Ana & Bea");
  await a.getByRole("button", { name: "Mesa de trabajo" }).click();
  await a.getByRole("button", { name: "Fabricar 12 balas" }).click();
  await expect(a.locator('[data-resource="ammo"]')).toHaveText("42");
  await a.getByRole("button", { name: "Mejorar pistola" }).click();
  await expect.poll(async () => (await player(a)).gunLevel).toBe(2);
  await a.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(a.locator("#storage")).toContainText("Madera: 1");
  await a.getByRole("button", { name: "Cerrar", exact: true }).click();
  await walk(a, 7, 12.8);
  await a.getByRole("button", { name: "Interactuar", exact: false }).click();
  await expect
    .poll(() =>
      a.evaluate(() =>
        window.astraTest!.world()!.crops.some((c) => c.stage === "growing"),
      ),
    )
    .toBe(true);
  await a.getByRole("button", { name: "Interactuar", exact: false }).click();
  await expect
    .poll(() =>
      a.evaluate(() => window.astraTest!.world()!.crops.some((c) => c.watered)),
    )
    .toBe(true);
  await a
    .getByRole("button", { name: "Cerca", exact: false })
    .filter({ hasText: "3 madera" })
    .click();
  const point = await a.evaluate(() => window.astraTest!.screenPoint(8, 13));
  await a.mouse.click(point.x, point.y);
  await expect
    .poll(() => a.evaluate(() => window.astraTest!.world()!.fences.length))
    .toBe(1);
  await a.locator("#build").click();
  await expect
    .poll(() => b.evaluate(() => window.astraTest!.world()!.fences.length))
    .toBe(1);
  await a.locator("#upgrade-fence").click();
  await expect
    .poll(() => a.evaluate(() => window.astraTest!.world()!.fences[0].level))
    .toBe(2);
  await walk(a, 5, 10);
  const wood = (await player(a)).inventory.wood;
  await a.locator("#interact").click();
  await expect
    .poll(async () => (await player(a)).inventory.wood)
    .toBe(wood + 3);
  await expect
    .poll(
      () =>
        a.evaluate(() =>
          window.astraTest!.world()!.crops.some((c) => c.stage === "ready"),
        ),
      { timeout: 50000 },
    )
    .toBe(true);
  await walk(a, 7, 12.8);
  const food = (await player(a)).inventory.food;
  await a.locator("#interact").click();
  await expect
    .poll(async () => (await player(a)).inventory.food)
    .toBe(food + 3);
  const ammo = (await player(a)).inventory.ammo;
  await a.reload();
  await stateReady(a);
  expect((await player(a)).inventory.ammo).toBe(ammo);
  await expect(b.locator("#members")).toContainText("Ana & Bea");
  await a.screenshot({ path: "test-results/farm-desktop.png" });
  await contextA.close();
  await contextB.close();
});
test("mobile has separate movement and aim controls and stops on release", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await register(page, "Movil");
  await page.getByRole("button", { name: "Crear nuestra granja" }).click();
  await stateReady(page);
  await expect(page.locator("#move-pad")).toBeVisible();
  await expect(page.locator("#aim-pad")).toBeVisible();
  const rect = await page.locator("#aim-pad").boundingBox();
  const ammo = (await player(page)).inventory.ammo;
  await page.mouse.move(
    rect!.x + rect!.width * 0.8,
    rect!.y + rect!.height * 0.5,
  );
  await page.mouse.down();
  await expect
    .poll(async () => (await player(page)).inventory.ammo)
    .toBeLessThan(ammo);
  await page.mouse.up();
  await expect.poll(async () => (await player(page)).firing).toBe(false);
  await page.screenshot({ path: "test-results/farm-mobile.png" });
  await context.close();
});

test("announced wave, soft death, backpack recovery and automatic aimed defense", async ({
  page,
}) => {
  await register(page, "Defensa");
  await page.getByRole("button", { name: "Crear nuestra granja" }).click();
  await stateReady(page);
  await expect(page.locator("#wave-label")).toContainText(
    "Los zombis se acercan",
  );
  await expect(page.locator("#wave-label")).toContainText("Defiendan", {
    timeout: 6000,
  });
  await expect
    .poll(
      () => page.evaluate(() => window.astraTest!.world()!.backpacks.length),
      { timeout: 40000 },
    )
    .toBe(1);
  expect((await player(page)).hp).toBeGreaterThan(0);
  await page.locator("#interact").click();
  await expect
    .poll(() =>
      page.evaluate(() => window.astraTest!.world()!.backpacks.length),
    )
    .toBe(0);
  const end = Date.now() + 40000;
  while (Date.now() < end) {
    const data = await page.evaluate(() => {
      const bridge = window.astraTest!,
        w = bridge.world()!,
        p = w.players[bridge.playerId];
      const target = [...w.zombies].sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
      )[0];
      return {
        phase: w.phase,
        ammo: p.inventory.ammo,
        weapon: p.weapon,
        distance: target ? Math.hypot(target.x - p.x, target.y - p.y) : 0,
        target: target ? bridge.screenPoint(target.x, target.y) : null,
      };
    });
    if (data.phase === "preparation") break;
    if (data.target && data.distance < 7.7) {
      await page.mouse.move(data.target.x, data.target.y);
      if (data.ammo === 0 && data.weapon === "pistol")
        await page.locator("#melee").click();
      await page.mouse.down();
      await page.waitForTimeout(150);
    } else await page.waitForTimeout(100);
  }
  await page.mouse.up();
  await expect(page.locator("#wave-label")).toHaveText("Tiempo para crecer");
  expect((await player(page)).inventory.ammo).toBeLessThan(30);
  await page.screenshot({ path: "test-results/after-wave.png" });
});
