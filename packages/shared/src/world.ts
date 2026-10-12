import { CONFIG } from "./config.js";
import { blocked, distance, isHouse, validBuild } from "./geometry.js";
import type {
  Command,
  Difficulty,
  Inventory,
  Player,
  Resource,
  Result,
  World,
} from "./types.js";
export const emptyInventory = (): Inventory => ({
  wood: 0,
  stone: 0,
  ammo: 0,
  food: 0,
  seed: 0,
});
const next = (w: World, prefix: string) => `${prefix}${++w.serial}`;
export function createWorld(id: string): World {
  return {
    version: 1,
    id,
    timeMs: 0,
    serial: 0,
    difficulty: "normal",
    activeDifficulty: "normal",
    phase: "preparation",
    remainingMs: 600000,
    warning: false,
    wave: 0,
    players: {},
    crops: [
      { id: "crop1", x: 6, y: 13, stage: "empty", watered: false, growth: 0 },
      { id: "crop2", x: 7, y: 13, stage: "empty", watered: false, growth: 0 },
      { id: "crop3", x: 6, y: 14, stage: "empty", watered: false, growth: 0 },
      { id: "crop4", x: 7, y: 14, stage: "empty", watered: false, growth: 0 },
    ],
    fences: [],
    zombies: [],
    nodes: [
      { id: "tree1", x: 5, y: 10, kind: "wood", remaining: 5, renewMs: 0 },
      { id: "tree2", x: 14, y: 13, kind: "wood", remaining: 5, renewMs: 0 },
      { id: "rock1", x: 13, y: 15, kind: "stone", remaining: 5, renewMs: 0 },
      { id: "rock2", x: 6, y: 8, kind: "stone", remaining: 5, renewMs: 0 },
      { id: "supply1", x: 15, y: 7, kind: "supply", remaining: 5, renewMs: 0 },
    ],
    backpacks: [],
    storage: emptyInventory(),
    processed: {},
    shots: [],
  };
}
export function addPlayer(w: World, id: string, name: string) {
  if (w.players[id]) return w.players[id];
  return (w.players[id] = {
    id,
    name,
    ...CONFIG.spawn,
    hp: 100,
    inventory: { wood: 18, stone: 12, ammo: 30, food: 3, seed: 6 },
    gunLevel: 1,
    weapon: "pistol",
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    firing: false,
    cooldown: 0,
    inputAge: 0,
    invulnerable: 3000,
  });
}
const fail = (error: string): Result => ({ ok: false, error });
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const near = (p: Player, t: { x: number; y: number }) =>
  distance(p, t) <= CONFIG.reach;
export function applyCommand(w: World, id: string, c: Command): Result {
  const p = w.players[id];
  if (
    !p ||
    !c ||
    typeof c.id !== "string" ||
    c.id.length < 1 ||
    c.id.length > 80 ||
    typeof c.type !== "string" ||
    !c.payload ||
    typeof c.payload !== "object" ||
    Array.isArray(c.payload)
  )
    return fail("Comando inválido");
  if (w.processed[id]?.includes(c.id)) return fail("Comando ya procesado");
  const a = c.payload;
  const station = () => near(p, CONFIG.bench);
  const pay = (wood: number, stone = 0) => {
    if (p.inventory.wood < wood || p.inventory.stone < stone) return false;
    p.inventory.wood -= wood;
    p.inventory.stone -= stone;
    return true;
  };
  switch (c.type) {
    case "move":
    case "aim": {
      if (
        !finite(a.x) ||
        !finite(a.y) ||
        Math.abs(a.x) > 1 ||
        Math.abs(a.y) > 1
      )
        return fail("Dirección inválida");
      const l = Math.hypot(a.x, a.y);
      const dir = { x: l > 1 ? a.x / l : a.x, y: l > 1 ? a.y / l : a.y };
      if (c.type === "move") p.move = dir;
      else {
        if (typeof a.firing !== "boolean") return fail("Disparo inválido");
        p.aim = dir;
        p.firing = a.firing && l > 0;
      }
      p.inputAge = 0;
      break;
    }
    case "weapon":
      if (a.value !== "pistol" && a.value !== "melee")
        return fail("Arma inválida");
      p.weapon = a.value;
      p.firing = false;
      break;
    case "crop": {
      const crop = w.crops.find((crop) => crop.id === a.target);
      if (!crop || !near(p, crop)) return fail("Acércate a la parcela");
      if (crop.stage === "empty") {
        if (p.inventory.seed < 1) return fail("Faltan semillas");
        p.inventory.seed--;
        crop.stage = "growing";
      } else if (crop.stage === "growing") {
        crop.watered = true;
      } else {
        p.inventory.food += 3;
        p.inventory.seed += 2;
        crop.stage = "empty";
        crop.growth = 0;
        crop.watered = false;
      }
      break;
    }
    case "gather": {
      const n = w.nodes.find((n) => n.id === a.target);
      if (!n || !near(p, n)) return fail("Acércate al recurso");
      if (n.remaining < 1) return fail("Recurso regenerándose");
      n.remaining--;
      if (n.kind === "supply") {
        p.inventory.ammo += 6;
        p.inventory.seed++;
      } else p.inventory[n.kind] += 3;
      break;
    }
    case "craft":
      if (!station()) return fail("Acércate a la mesa del refugio");
      if (!pay(CONFIG.craftWood, CONFIG.craftStone))
        return fail("Faltan madera o piedra");
      p.inventory.ammo += CONFIG.craftAmmo;
      break;
    case "build": {
      if (
        !finite(a.x) ||
        !finite(a.y) ||
        !validBuild(w, a.x, a.y) ||
        !near(p, { x: a.x, y: a.y })
      )
        return fail("No puedes construir aquí");
      if (!pay(CONFIG.buildWood)) return fail("Falta madera");
      w.fences.push({
        id: next(w, "f"),
        x: a.x,
        y: a.y,
        hp: CONFIG.fenceHp,
        maxHp: CONFIG.fenceHp,
        level: 1,
      });
      break;
    }
    case "repair":
    case "upgradeFence": {
      const f = w.fences.find((f) => f.id === a.target);
      if (!f || !near(p, f)) return fail("Acércate a la cerca");
      if (c.type === "repair") {
        if (f.hp === f.maxHp) return fail("La cerca está sana");
        if (!pay(CONFIG.repairWood)) return fail("Falta madera");
        f.hp = f.maxHp;
      } else {
        if (f.level >= 3) return fail("Mejora máxima");
        if (!pay(CONFIG.upgradeWood, CONFIG.upgradeStone))
          return fail("Faltan recursos");
        f.level++;
        f.maxHp = CONFIG.fenceHp * f.level;
        f.hp = f.maxHp;
      }
      break;
    }
    case "upgradeGun":
      if (!station()) return fail("Acércate al refugio");
      if (p.gunLevel >= 3) return fail("Mejora máxima");
      if (!pay(CONFIG.upgradeWood, CONFIG.upgradeStone))
        return fail("Faltan recursos");
      p.gunLevel++;
      break;
    case "eat":
      if (p.inventory.food < 1 || p.hp >= 100)
        return fail("No necesitas comida o no tienes");
      p.inventory.food--;
      p.hp = Math.min(100, p.hp + 25);
      break;
    case "recover": {
      const b = w.backpacks.find((b) => b.id === a.target);
      if (!b || !near(p, b)) return fail("Acércate a la mochila");
      for (const k of Object.keys(b.inventory) as Resource[])
        p.inventory[k] += b.inventory[k];
      w.backpacks = w.backpacks.filter((x) => x !== b);
      break;
    }
    case "transfer": {
      const r = a.resource as Resource;
      if (
        !station() ||
        !Object.hasOwn(w.storage, r) ||
        !finite(a.quantity) ||
        !Number.isInteger(a.quantity) ||
        a.quantity <= 0 ||
        a.quantity > 100000 ||
        (a.direction !== "deposit" && a.direction !== "withdraw")
      )
        return fail("Transferencia inválida");
      const [src, dst] =
        a.direction === "deposit"
          ? [p.inventory, w.storage]
          : [w.storage, p.inventory];
      if (src[r] < a.quantity) return fail("Recursos insuficientes");
      src[r] -= a.quantity;
      dst[r] += a.quantity;
      break;
    }
    case "difficulty":
      if (!["tranquil", "normal", "hard"].includes(String(a.value)))
        return fail("Dificultad inválida");
      w.difficulty = a.value as Difficulty;
      break;
    default:
      return fail("Acción desconocida");
  }
  // Input messages are ephemeral; durable commands stay deduplicated in SQLite.
  if (c.type !== "move" && c.type !== "aim") {
    const list = (w.processed[id] ??= []);
    list.push(c.id);
    if (list.length > 128) list.shift();
  }
  return { ok: true };
}
export function tickWorld(w: World, dt: number, connected: string[]) {
  if (!connected.length || !Number.isFinite(dt) || dt <= 0) return;
  const active = connected
    .map((id) => w.players[id])
    .filter((p): p is Player => !!p);
  if (!active.length) return;
  w.timeMs += dt;
  w.shots = w.shots
    .map((s) => ({ ...s, ttl: s.ttl - dt }))
    .filter((s) => s.ttl > 0);
  for (const c of w.crops)
    if (c.stage === "growing" && c.watered) {
      c.growth += dt;
      if (c.growth >= CONFIG.growMs) c.stage = "ready";
    }
  for (const n of w.nodes) {
    if (n.remaining < CONFIG.nodeStock) {
      n.renewMs += dt;
      while (
        n.renewMs >= CONFIG.nodeRenewMs &&
        n.remaining < CONFIG.nodeStock
      ) {
        n.remaining++;
        n.renewMs -= CONFIG.nodeRenewMs;
      }
    }
  }
  for (const p of Object.values(w.players))
    if (!connected.includes(p.id)) {
      p.firing = false;
      p.move = { x: 0, y: 0 };
    }
  // Motion is bounded even when a test jumps the preparation clock forward.
  const motionDt = Math.min(dt, 100);
  for (const p of active) {
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.inputAge += dt;
    if (p.inputAge > CONFIG.inputTimeoutMs) {
      p.move = { x: 0, y: 0 };
      p.firing = false;
    }
    const nx = p.x + (p.move.x * CONFIG.moveSpeed * motionDt) / 1000,
      ny = p.y + (p.move.y * CONFIG.moveSpeed * motionDt) / 1000;
    if (!blocked(w, nx, p.y)) p.x = nx;
    if (!blocked(w, p.x, ny)) p.y = ny;
    if (
      p.firing &&
      p.cooldown <= 0 &&
      (p.weapon === "melee" || p.inventory.ammo > 0)
    ) {
      const range = p.weapon === "pistol" ? CONFIG.gunRange : CONFIG.meleeRange;
      const target = w.zombies
        .filter((z) => {
          const d = distance(p, z);
          const dot = (z.x - p.x) * p.aim.x + (z.y - p.y) * p.aim.y;
          const cross = Math.abs((z.x - p.x) * p.aim.y - (z.y - p.y) * p.aim.x);
          return (
            d <= range && dot > 0 && cross < (p.weapon === "melee" ? 1 : 0.65)
          );
        })
        .sort((a, b) => distance(p, a) - distance(p, b))[0];
      if (p.weapon === "pistol") p.inventory.ammo--;
      p.cooldown = CONFIG.shotMs;
      if (target)
        target.hp -=
          p.weapon === "pistol"
            ? CONFIG.gunDamage * p.gunLevel
            : CONFIG.meleeDamage;
      w.shots.push({
        x: p.x,
        y: p.y,
        toX: target?.x ?? p.x + p.aim.x * range,
        toY: target?.y ?? p.y + p.aim.y * range,
        ttl: 140,
      });
    }
  }
  w.zombies = w.zombies.filter((z) => z.hp > 0);
  const difficulty = CONFIG.difficulties[w.activeDifficulty];
  for (const z of w.zombies) {
    z.cooldown = Math.max(0, z.cooldown - dt);
    const target = [...active].sort(
      (a, b) => distance(z, a) - distance(z, b),
    )[0];
    const len = distance(z, target);
    if (len < 0.8) {
      if (z.cooldown === 0 && target.invulnerable === 0) {
        target.hp -= difficulty.damage;
        z.cooldown = 1000;
        if (target.hp <= 0) {
          const inv = emptyInventory();
          for (const k of Object.keys(inv) as Resource[]) {
            inv[k] = Math.floor(target.inventory[k] / 2);
            target.inventory[k] -= inv[k];
          }
          w.backpacks.push({
            id: next(w, "b"),
            x: target.x,
            y: target.y,
            inventory: inv,
          });
          Object.assign(target, CONFIG.spawn, {
            hp: 100,
            firing: false,
            move: { x: 0, y: 0 },
            invulnerable: 5000,
          });
        }
      }
      continue;
    }
    const nx =
        z.x + (((target.x - z.x) / len) * difficulty.speed * motionDt) / 1000,
      ny =
        z.y + (((target.y - z.y) / len) * difficulty.speed * motionDt) / 1000;
    const fence = w.fences.find(
      (f) => Math.abs(f.x - nx) < 0.7 && Math.abs(f.y - ny) < 0.7,
    );
    if (fence) {
      if (z.cooldown === 0) {
        fence.hp -= difficulty.damage;
        z.cooldown = 1000;
      }
    } else if (!isHouse(nx, ny)) {
      z.x = nx;
      z.y = ny;
    } else {
      const side = z.x < 10 ? -1 : 1;
      z.x += (side * difficulty.speed * motionDt) / 1000;
      z.y += (difficulty.speed * motionDt) / 1000;
    }
  }
  w.fences = w.fences.filter((f) => f.hp > 0);
  if (w.phase === "preparation") {
    w.remainingMs = Math.max(0, w.remainingMs - dt);
    w.warning = w.remainingMs <= 60000;
    if (w.remainingMs === 0) {
      w.phase = "wave";
      w.wave++;
      w.warning = false;
      for (let i = 0; i < difficulty.count * active.length; i++) {
        const edge = i % 4;
        const n = 2 + ((i * 3) % 17);
        w.zombies.push({
          id: next(w, "z"),
          x: edge === 0 ? 1 : edge === 1 ? 20 : n,
          y: edge === 2 ? 1 : edge === 3 ? 20 : n,
          hp: difficulty.hp,
          cooldown: 0,
        });
      }
    }
  } else if (w.zombies.length === 0) {
    w.phase = "preparation";
    w.activeDifficulty = w.difficulty;
    w.remainingMs = CONFIG.difficulties[w.activeDifficulty].prepareMs;
    w.warning = false;
  }
}
