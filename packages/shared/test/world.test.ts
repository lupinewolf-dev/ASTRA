import { describe, it, expect } from "vitest";
import {
  createWorld,
  addPlayer,
  applyCommand,
  tickWorld,
} from "../src/world.js";
import { CONFIG } from "../src/config.js";
import type { Command, World } from "../src/types.js";
const setup = () => {
  const w = createWorld("test");
  addPlayer(w, "a", "Ana");
  return w;
};
let seq = 0;
const act = (
  w: World,
  type: string,
  payload: Record<string, unknown> = {},
  player = "a",
) => applyCommand(w, player, { id: `c${++seq}`, type, payload } as Command);
describe("world rules", () => {
  it("pauses all simulation without connections", () => {
    const w = setup();
    w.crops[0].stage = "growing";
    w.crops[0].watered = true;
    w.zombies.push({ id: "z", x: 1, y: 1, hp: 30, cooldown: 0 });
    const copy = structuredClone(w);
    tickWorld(w, 10000, []);
    expect(w).toEqual(copy);
  });
  it("warns and spawns only once with population fixed at wave start", () => {
    const w = setup();
    expect(w.remainingMs).toBe(600000);
    tickWorld(w, 540000, ["a"]);
    expect(w.warning).toBe(true);
    tickWorld(w, 60000, ["a"]);
    expect(w.phase).toBe("wave");
    expect(w.zombies).toHaveLength(CONFIG.difficulties.normal.count);
    addPlayer(w, "b", "Bea");
    tickWorld(w, 1, ["a", "b"]);
    expect(w.zombies).toHaveLength(CONFIG.difficulties.normal.count);
  });
  it("uses two-player population and defers difficulty change", () => {
    const w = setup();
    addPlayer(w, "b", "Bea");
    act(w, "difficulty", { value: "hard" });
    expect(w.remainingMs).toBe(600000);
    tickWorld(w, 600000, ["a", "b"]);
    expect(w.zombies).toHaveLength(CONFIG.difficulties.normal.count * 2);
    w.zombies = [];
    tickWorld(w, 1, ["a"]);
    expect(w.remainingMs).toBe(300000);
  });
  it("seeds waters grows and harvests only once within reach", () => {
    const w = setup();
    const p = w.players.a;
    p.x = w.crops[0].x;
    p.y = w.crops[0].y;
    expect(act(w, "crop", { target: w.crops[0].id }).ok).toBe(true);
    expect(act(w, "crop", { target: w.crops[0].id }).ok).toBe(true);
    tickWorld(w, CONFIG.growMs, ["a"]);
    expect(w.crops[0].stage).toBe("ready");
    const food = p.inventory.food;
    act(w, "crop", { target: w.crops[0].id });
    expect(p.inventory.food).toBe(food + 3);
    act(w, "crop", { target: w.crops[0].id });
    expect(p.inventory.food).toBe(food + 3);
  });
  it("charges crafting costs and rejects insufficient funds unchanged", () => {
    const w = setup();
    const p = w.players.a;
    const ammo = p.inventory.ammo;
    const wood = p.inventory.wood;
    expect(act(w, "craft").ok).toBe(true);
    expect(p.inventory.ammo).toBe(ammo + CONFIG.craftAmmo);
    expect(p.inventory.wood).toBe(wood - CONFIG.craftWood);
    p.inventory.stone = 0;
    const before = structuredClone(w);
    expect(act(w, "craft").ok).toBe(false);
    expect(w).toEqual(before);
  });
  it("rejects invalid fences, charges repairs and upgrades", () => {
    const w = setup();
    expect(act(w, "build", { x: 10, y: 10 }).ok).toBe(false);
    expect(act(w, "build", { x: -1, y: 5 }).ok).toBe(false);
    w.players.a.x = 7;
    w.players.a.y = 10;
    expect(act(w, "build", { x: 6, y: 10 }).ok).toBe(true);
    const f = w.fences[0];
    f.hp = 1;
    expect(act(w, "repair", { target: f.id }).ok).toBe(true);
    expect(f.hp).toBe(f.maxHp);
    expect(act(w, "upgradeFence", { target: f.id }).ok).toBe(true);
    expect(f.maxHp).toBe(CONFIG.fenceHp * 2);
    w.players.a.x = 10;
    w.players.a.y = 12;
    expect(act(w, "upgradeGun").ok).toBe(true);
    expect(w.players.a.gunLevel).toBe(2);
  });
  it("fires with authoritative cadence and ammo, validates finite input", () => {
    const w = setup();
    const p = w.players.a;
    p.x = 5;
    p.y = 5;
    w.zombies.push({ id: "z", x: 6, y: 5, hp: 100, cooldown: 0 });
    expect(act(w, "aim", { x: 1, y: 0, firing: true }).ok).toBe(true);
    const ammo = p.inventory.ammo;
    tickWorld(w, 50, ["a"]);
    expect(p.inventory.ammo).toBe(ammo - 1);
    expect(w.zombies[0].hp).toBeLessThan(100);
    tickWorld(w, 50, ["a"]);
    expect(p.inventory.ammo).toBe(ammo - 1);
    const copy = structuredClone(w);
    expect(act(w, "move", { x: NaN, y: 0 }).ok).toBe(false);
    expect(
      act(w, "transfer", {
        resource: "wood",
        quantity: -1,
        direction: "deposit",
      }).ok,
    ).toBe(false);
    expect(w).toEqual(copy);
  });
  it("drops half on death retains upgrades and allows partner recovery", () => {
    const w = setup();
    addPlayer(w, "b", "Bea");
    const p = w.players.a;
    p.x = 4;
    p.y = 4;
    p.hp = 1;
    p.invulnerable = 0;
    p.inventory.wood = 7;
    p.gunLevel = 2;
    w.zombies = [{ id: "z", x: 4, y: 4, hp: 30, cooldown: 0 }];
    tickWorld(w, 50, ["a", "b"]);
    expect(p.hp).toBe(100);
    expect(p.gunLevel).toBe(2);
    expect(p.inventory.wood).toBe(4);
    expect(w.backpacks[0].inventory.wood).toBe(3);
    w.players.b.x = 4;
    w.players.b.y = 4;
    const previous = w.players.b.inventory.wood;
    expect(act(w, "recover", { target: w.backpacks[0].id }, "b").ok).toBe(true);
    expect(w.players.b.inventory.wood).toBe(previous + 3);
  });
  it("rejects remote interaction and duplicates without effect", () => {
    const w = setup();
    w.players.a.x = 1;
    w.players.a.y = 1;
    expect(act(w, "craft").ok).toBe(false);
    w.players.a.x = 10;
    w.players.a.y = 12;
    const cmd = { id: "same", type: "craft", payload: {} } as Command;
    expect(applyCommand(w, "a", cmd).ok).toBe(true);
    const snapshot = structuredClone(w);
    expect(applyCommand(w, "a", cmd).ok).toBe(false);
    expect(w).toEqual(snapshot);
  });
  it("heals with food, collects renewable resources and transfers shared storage", () => {
    const w = setup();
    const p = w.players.a;
    p.hp = 50;
    expect(act(w, "eat").ok).toBe(true);
    expect(p.hp).toBe(75);
    p.x = w.nodes[0].x;
    p.y = w.nodes[0].y;
    expect(act(w, "gather", { target: w.nodes[0].id }).ok).toBe(true);
    expect(w.nodes[0].remaining).toBeLessThan(CONFIG.nodeStock);
    p.x = 10;
    p.y = 12;
    const old = p.inventory.wood;
    expect(
      act(w, "transfer", {
        resource: "wood",
        quantity: 2,
        direction: "deposit",
      }).ok,
    ).toBe(true);
    expect(w.storage.wood).toBe(2);
    expect(p.inventory.wood).toBe(old - 2);
    expect(
      act(w, "transfer", {
        resource: "wood",
        quantity: 2,
        direction: "withdraw",
      }).ok,
    ).toBe(true);
    expect(p.inventory.wood).toBe(old);
  });
});
it("keeps active difficulty through wave and applies changes at next preparation", () => {
  const w = setup();
  tickWorld(w, 600000, ["a"]);
  const hp = w.zombies[0].hp;
  act(w, "difficulty", { value: "hard" });
  expect(w.activeDifficulty).toBe("normal");
  tickWorld(w, 50, ["a"]);
  expect(w.zombies[0].hp).toBe(hp);
  w.zombies = [];
  tickWorld(w, 1, ["a"]);
  expect(w.activeDifficulty).toBe("hard");
  expect(w.remainingMs).toBe(300000);
});
it("rejects non-string difficulty without changing or pausing the world", () => {
  const w = setup();
  const before = structuredClone(w);
  expect(act(w, "difficulty", { value: ["hard"] }).ok).toBe(false);
  expect(w).toEqual(before);
});
