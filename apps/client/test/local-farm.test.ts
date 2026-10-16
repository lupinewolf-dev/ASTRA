import { describe, expect, it } from "vitest";
import { createWorld, addPlayer } from "../../../packages/shared/src/world.js";
import * as local from "../src/visual/local-game.js";
const setup = () => {
  expect(local.LocalFarmGame).toBeTypeOf("function");
  const source = createWorld("demo");
  addPlayer(source, "a", "A");
  source.players.a.x = 8;
  source.players.a.y = 14;
  source.crops[0].stage = "ready";
  source.crops[0].watered = true;
  source.crops[0].x = 7;
  source.crops[0].y = 14;
  return { source, game: new local.LocalFarmGame(source) };
};
const advance = (game: local.LocalFarmGame, ms: number) => {
  for (let t = 0; t < ms; t += 100) game.tick(Math.min(100, ms - t));
};
describe("local playable farm", () => {
  it("allows travel beyond the old yard into the expanded map without mutating the source", () => {
    const { source, game } = setup();
    const before = JSON.stringify(source);
    game.player.x = 21;
    game.player.y = 16;
    game.move(1, 0);
    advance(game, 1000);
    expect(game.player.x).toBeGreaterThan(22);
    expect(JSON.stringify(source)).toBe(before);
  });
  it("blocks the cottage and map edge while preserving movement along an obstacle", () => {
    const { game } = setup();
    game.player.x = 10;
    game.player.y = 12.1;
    game.move(0, -1);
    advance(game, 1000);
    expect(game.player.y).toBeGreaterThan(11.65);
    game.player.x = 43;
    game.player.y = 16;
    game.move(1, 0);
    advance(game, 1000);
    expect(game.player.x).toBeLessThanOrEqual(43.5);
  });
  it("harvests, plants, waters and grows using the shared crop rules", () => {
    const { game } = setup();
    const initial = game.player.inventory.food;
    game.interact();
    expect(game.player.inventory.food).toBe(initial + 3);
    expect(game.harvested).toBe(1);
    game.interact();
    expect(game.world.crops[0].stage).toBe("growing");
    game.interact();
    expect(game.world.crops[0].watered).toBe(true);
    advance(game, 45000);
    expect(game.world.crops[0].stage).toBe("ready");
  });
  it("pauses growth and waves and clears input while paused", () => {
    const { game } = setup();
    game.move(1, 0);
    game.pause(true);
    const before = JSON.stringify(game.world);
    advance(game, 2000);
    expect(JSON.stringify(game.world)).toBe(before);
    game.pause(false);
    advance(game, 100);
    expect(game.player.x).toBe(8);
  });
  it("starts a wave on request and defeats enemies with two manual shots", () => {
    const { game } = setup();
    game.startWave();
    game.tick(100);
    expect(game.world.phase).toBe("wave");
    expect(game.world.zombies.length).toBeGreaterThan(0);
    game.world.zombies = [
      {
        id: "near",
        x: game.player.x + 2,
        y: game.player.y,
        hp: 35,
        cooldown: 0,
      },
    ];
    const ammo = game.player.inventory.ammo;
    game.aim(1, 0, true);
    expect(game.shoot()).toBe(true);
    advance(game, 600);
    expect(game.shoot()).toBe(true);
    advance(game, 500);
    expect(game.world.zombies).toHaveLength(0);
    expect(game.player.inventory.ammo).toBeLessThan(ammo);
    expect(game.survived).toBe(1);
    expect(game.world.remainingMs).toBeLessThanOrEqual(90000);
  });
  it("gathers supplies and crafts ammunition at the actual workshop", () => {
    const { game } = setup();
    const node = game.world.nodes.find((n) => n.kind === "supply")!;
    game.player.x = node.x;
    game.player.y = node.y;
    const ammo = game.player.inventory.ammo;
    game.interact();
    expect(game.player.inventory.ammo).toBe(ammo + 6);
    game.player.x = 10;
    game.player.y = 12;
    expect(game.craft().ok).toBe(true);
    expect(game.player.inventory.ammo).toBe(ammo + 18);
  });
});
it("does not spend ammunition when aiming at enemies outside weapon range", () => {
  const { game } = setup();
  game.player.x = 15;
  game.player.y = 15;
  game.startWave();
  game.tick(1);
  const ammo = game.player.inventory.ammo;
  game.aim(1, 0, true);
  advance(game, 500);
  expect(game.player.inventory.ammo).toBe(ammo);
});
it("lets defensive fences absorb damage and repairs them with harvested wood", () => {
  const { game } = setup();
  expect(game.world.fences.length).toBeGreaterThan(0);
  const fence = game.world.fences[0];
  game.player.x = fence.x;
  game.player.y = fence.y + 1;
  game.world.phase = "wave";
  game.world.zombies = [
    { id: "attack", x: fence.x, y: fence.y - 0.85, hp: 35, cooldown: 0 },
  ];
  advance(game, 2000);
  expect(fence.hp).toBeLessThan(fence.maxHp);
  expect(game.player.hp).toBe(100);
  game.world.zombies = [];
  const wood = game.player.inventory.wood;
  game.interact();
  expect(fence.hp).toBe(fence.maxHp);
  expect(game.player.inventory.wood).toBe(wood - 1);
});
it("blocks the visible river bank but lets the player cross on the bridge", () => {
  const { game } = setup();
  game.player.x = 4.9;
  game.player.y = 12;
  game.move(-1, 0);
  advance(game, 1000);
  expect(game.player.x).toBeGreaterThanOrEqual(4.65);
  game.player.x = 5;
  game.player.y = 14.3;
  game.move(-1, 0);
  advance(game, 1000);
  expect(game.player.x).toBeLessThan(2.5);
});
it("accelerates into walking, brakes promptly and clears momentum on pause", () => {
  const { game } = setup();
  game.player.x = 21;
  game.player.y = 16;
  game.move(1, 0);
  const start = game.player.x;
  game.tick(16);
  expect(game.player.x - start).toBeGreaterThan(0);
  expect(game.player.x - start).toBeLessThan(0.04);
  advance(game, 500);
  game.move(0, 0);
  advance(game, 150);
  const stopped = game.player.x;
  advance(game, 200);
  expect(game.player.x).toBe(stopped);
  game.move(1, 0);
  advance(game, 200);
  game.pause(true);
  game.pause(false);
  const paused = game.player.x;
  advance(game, 200);
  expect(game.player.x).toBe(paused);
});
it("reverses direction through a short braking transition instead of snapping", () => {
  const { game } = setup();
  game.player.x = 21;
  game.player.y = 16;
  game.move(1, 0);
  advance(game, 500);
  const start = game.player.x;
  game.move(-1, 0);
  game.tick(16);
  expect(game.player.x).toBeGreaterThan(start);
  advance(game, 400);
  expect(game.player.x).toBeLessThan(start);
});
it("spawns a tougher varied first wave and increases later waves", () => {
  const { game } = setup();
  game.startWave();
  game.tick(16);
  expect(game.world.zombies.length).toBeGreaterThanOrEqual(5);
  expect(
    new Set(game.world.zombies.map((z) => game.profileFor(z.id).kind)),
  ).toEqual(new Set(["walker", "runner", "armored"]));
  expect(
    Math.max(...game.world.zombies.map((z) => z.hp)),
  ).toBeGreaterThanOrEqual(120);
  const first = game.world.zombies.length;
  game.world.zombies = [];
  game.tick(16);
  game.startWave();
  game.tick(16);
  expect(game.world.zombies.length).toBeGreaterThan(first);
});
it("makes runners close in faster than regular zombies", () => {
  const { game } = setup();
  expect(game.profileFor).toBeTypeOf("function");
  game.startWave();
  game.tick(16);
  const runner = game.world.zombies.find(
    (z) => game.profileFor(z.id).kind === "runner",
  )!;
  const walker = game.world.zombies.find(
    (z) => game.profileFor(z.id).kind === "walker",
  )!;
  game.world.zombies = [runner, walker];
  game.player.x = 15;
  game.player.y = 15;
  for (const z of game.world.zombies) {
    z.x = 22;
    z.y = 15;
  }
  advance(game, 300);
  expect(22 - runner.x).toBeGreaterThan((22 - walker.x) * 1.7);
});
it("dodges with a cooldown, brief protection and no motion after pausing", () => {
  const { game } = setup();
  game.player.x = 20;
  game.player.y = 16;
  game.player.invulnerable = 0;
  game.move(1, 0);
  expect(game.dodge()).toBe(true);
  expect(game.dodge()).toBe(false);
  advance(game, 180);
  expect(game.player.x).toBeGreaterThan(21);
  expect(game.player.invulnerable).toBeGreaterThan(0);
  game.pause(true);
  game.pause(false);
  game.move(0, 0);
  const x = game.player.x;
  advance(game, 300);
  expect(game.player.x).toBe(x);
  expect(game.player.invulnerable).toBe(0);
  advance(game, 2000);
  expect(game.dodge()).toBe(true);
});
it("cannot dodge through the cottage, fences or while paused", () => {
  const { game } = setup();
  game.player.x = 10;
  game.player.y = 12.1;
  game.move(0, -1);
  game.dodge();
  advance(game, 200);
  expect(game.player.y).toBeGreaterThanOrEqual(11.65);
  advance(game, 2000);
  const fence = game.world.fences[0];
  game.player.x = fence.x;
  game.player.y = fence.y + 0.8;
  game.dodge();
  advance(game, 200);
  expect(game.player.y).toBeGreaterThan(fence.y + 0.55);
  game.pause(true);
  expect(game.dodge()).toBe(false);
});
it("aiming does not fire; each manual click fires at most one round", () => {
  const { game } = setup();
  game.player.x = 15;
  game.player.y = 15;
  game.world.phase = "wave";
  game.world.zombies = [{ id: "target", x: 18, y: 15, hp: 200, cooldown: 0 }];
  game.aim(1, 0, true);
  const ammo = game.player.inventory.ammo;
  advance(game, 1200);
  expect(game.player.inventory.ammo).toBe(ammo);
  expect(game.world.zombies[0].hp).toBe(200);
  expect(game.shoot()).toBe(true);
  advance(game, 100);
  expect(game.player.inventory.ammo).toBe(ammo - 1);
  advance(game, 1200);
  expect(game.player.inventory.ammo).toBe(ammo - 1);
  expect(game.shoot()).toBe(true);
  advance(game, 100);
  expect(game.player.inventory.ammo).toBe(ammo - 2);
});
it("rejects shooting during cooldown or without bullets and allows a manual melee hit", () => {
  const { game } = setup();
  game.player.x = 15;
  game.player.y = 15;
  game.world.phase = "wave";
  game.world.zombies = [{ id: "near", x: 16, y: 15, hp: 100, cooldown: 0 }];
  game.aim(1, 0, true);
  expect(game.shoot()).toBe(true);
  game.tick(16);
  const ammo = game.player.inventory.ammo;
  expect(game.shoot()).toBe(false);
  advance(game, 700);
  expect(game.player.inventory.ammo).toBe(ammo);
  game.player.inventory.ammo = 0;
  expect(game.shoot()).toBe(false);
  expect(game.melee()).toBe(true);
  game.tick(16);
  expect(game.world.zombies[0].hp).toBeLessThan(76);
});
it("explores the eastern meadow and uses its cache and well with cooldowns", () => {
  const { game } = setup();
  game.player.x = 32;
  game.player.y = 16;
  game.move(1, 0);
  advance(game, 2200);
  expect(game.player.x).toBeGreaterThan(36);
  game.move(0, 0);
  game.player.x = 39;
  game.player.y = 21;
  const ammo = game.player.inventory.ammo;
  expect(game.interact().ok).toBe(true);
  expect(game.player.inventory.ammo).toBe(ammo + 8);
  expect(game.interact().ok).toBe(false);
  game.player.x = 34;
  game.player.y = 20;
  game.player.hp = 50;
  expect(game.interact().ok).toBe(true);
  expect(game.player.hp).toBeGreaterThan(50);
  expect(game.interact().ok).toBe(false);
});
