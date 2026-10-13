import type {
  World,
  Point,
  Result,
} from "../../../../packages/shared/src/types.js";
import {
  applyCommand,
  tickWorld,
} from "../../../../packages/shared/src/world.js";
import { CONFIG } from "../../../../packages/shared/src/config.js";
import { distance, isHouse } from "../../../../packages/shared/src/geometry.js";
import { insideTerrain, TREE_POSITIONS, DECOR_FENCES } from "./play-map.js";

/** Disposable single-player sandbox, sharing the real game's commands and combat rules. */
export class LocalFarmGame {
  readonly world: World;
  readonly playerId: string;
  harvested = 0;
  survived = 0;
  paused = false;
  message = "Cosecha tres parcelas y sobrevive una oleada.";
  private serial = 0;
  private velocity: Point = { x: 0, y: 0 };
  private profiles = new Map<
    string,
    { kind: "walker" | "runner" | "armored"; maxHp: number; speed: number }
  >();
  profileFor(id: string) {
    return (
      this.profiles.get(id) ?? {
        kind: "walker" as const,
        maxHp: 70,
        speed: 0.9,
      }
    );
  }
  private motion: Point = { x: 0, y: 0 };
  private direction: Point = { x: 1, y: 0 };
  private firing = false;
  constructor(source: World) {
    this.world = structuredClone(source);
    this.playerId = Object.keys(this.world.players)[0];
    if (!this.playerId) throw new Error("Falta el jugador local");
    this.world.difficulty = this.world.activeDifficulty = "normal";
    this.world.remainingMs = 90000;
    this.world.crops.push(
      {
        id: "orchard1",
        x: 21,
        y: 16,
        stage: "empty",
        watered: false,
        growth: 0,
      },
      {
        id: "orchard2",
        x: 21,
        y: 19,
        stage: "empty",
        watered: false,
        growth: 0,
      },
    );
    DECOR_FENCES.forEach(([x, y, rotation], i) => {
      for (const side of [-1, 1])
        this.world.fences.push({
          id: `decor-${i}-${side}`,
          x: x + (rotation ? 0 : side * 0.5),
          y: y + (rotation ? side * 0.5 : 0),
          hp: CONFIG.fenceHp,
          maxHp: CONFIG.fenceHp,
          level: 1,
        });
    });
    const positions = [
      [5, 5],
      [23, 10],
      [18.5, 13],
      [23, 17],
      [23, 21],
    ];
    this.world.nodes.forEach((n, i) => {
      n.x = positions[i][0];
      n.y = positions[i][1];
    });
  }
  get player() {
    return this.world.players[this.playerId];
  }
  get aiming() {
    return this.firing;
  }
  get complete() {
    return this.harvested >= 3 && this.survived >= 1;
  }
  move(x: number, y: number) {
    const length = Math.max(1, Math.hypot(x, y));
    this.motion = { x: x / length, y: y / length };
  }
  aim(x: number, y: number, firing: boolean) {
    const length = Math.hypot(x, y);
    this.direction = length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
    this.firing = firing && length > 0;
  }
  pause(value: boolean) {
    this.paused = value;
    if (value) {
      this.velocity = { x: 0, y: 0 };
      this.move(0, 0);
      this.aim(0, 0, false);
      this.player.move = { x: 0, y: 0 };
      this.player.firing = false;
    }
  }
  private blocked(x: number, y: number) {
    if (x < 1 || y < 1 || x > 28.5 || y > 26 || !insideTerrain(x, y))
      return true;
    if (x > 7.45 && x < 12.55 && y > 7.2 && y < 11.65) return true;
    if (
      this.world.nodes.some(
        (n) => n.kind !== "wood" && Math.hypot(x - n.x, y - n.y) < 0.55,
      )
    )
      return true;
    if (TREE_POSITIONS.some(([tx, ty]) => Math.hypot(x - tx, y - ty) < 0.65))
      return true;
    const riverPoints = [
      [1.5, 2.9],
      [5, 3.65],
      [8, 3.4],
      [12, 4],
      [15, 3.65],
      [19, 4.4],
      [21, 4.75],
    ];
    let river = riverPoints[0][1];
    for (let i = 1; i < riverPoints.length; i++)
      if (y <= riverPoints[i][0]) {
        const a = riverPoints[i - 1],
          b = riverPoints[i];
        river = a[1] + (b[1] - a[1]) * Math.max(0, (y - a[0]) / (b[0] - a[0]));
        break;
      }
    if (
      y > 1.5 &&
      y < 21 &&
      Math.abs(x - river) < 0.65 &&
      !(y > 13.4 && y < 15.2)
    )
      return true;
    return this.world.fences.some(
      (f) => Math.abs(f.x - x) < 0.55 && Math.abs(f.y - y) < 0.55,
    );
  }
  tick(milliseconds: number) {
    if (this.paused || !Number.isFinite(milliseconds) || milliseconds <= 0)
      return;
    const dt = Math.min(milliseconds, 100),
      p = this.player;
    const braking =
      !Math.hypot(this.motion.x, this.motion.y) ||
      this.motion.x * this.velocity.x + this.motion.y * this.velocity.y < 0;
    const step = ((braking ? 36 : 20) * dt) / 1000;
    for (const axis of ["x", "y"] as const) {
      const target = this.motion[axis] * CONFIG.moveSpeed;
      const difference = target - this.velocity[axis];
      this.velocity[axis] +=
        Math.sign(difference) * Math.min(Math.abs(difference), step);
    }
    const nx = p.x + (this.velocity.x * dt) / 1000,
      ny = p.y + (this.velocity.y * dt) / 1000;
    if (!this.blocked(nx, p.y)) p.x = nx;
    else this.velocity.x = 0;
    if (!this.blocked(p.x, ny)) p.y = ny;
    else this.velocity.y = 0;
    p.move = { x: 0, y: 0 };
    p.inputAge = 0;
    p.aim = this.direction;
    p.weapon = p.inventory.ammo > 0 ? "pistol" : "melee";
    p.firing =
      this.firing &&
      this.world.zombies.some(
        (z) =>
          distance(p, z) <=
          (p.weapon === "pistol" ? CONFIG.gunRange : CONFIG.meleeRange),
      );
    const phase = this.world.phase;
    const previous = new Map(
      this.world.zombies.map((z) => [z.id, { x: z.x, y: z.y }]),
    );
    const backpacks = this.world.backpacks.length;
    tickWorld(this.world, dt, [this.playerId]);
    if (this.world.backpacks.length > backpacks) {
      this.velocity = { x: 0, y: 0 };
      this.move(0, 0);
      this.aim(0, 0, false);
    }
    for (const z of this.world.zombies) {
      const before = previous.get(z.id);
      if (!before) continue;
      const factor = this.profileFor(z.id).speed / 0.9;
      const x = before.x + (z.x - before.x) * factor;
      const y = before.y + (z.y - before.y) * factor;
      if (
        !isHouse(x, y) &&
        !this.world.fences.some(
          (f) => Math.abs(f.x - x) < 0.7 && Math.abs(f.y - y) < 0.7,
        )
      ) {
        z.x = x;
        z.y = y;
      }
    }
    for (const id of this.profiles.keys())
      if (!this.world.zombies.some((z) => z.id === id))
        this.profiles.delete(id);
    if (phase === "preparation" && this.world.phase === "wave") {
      const count = Math.min(13, 5 + this.survived * 2);
      while (this.world.zombies.length < count)
        this.world.zombies.push({
          id: `local-z-${++this.serial}`,
          x: 1,
          y: 2,
          hp: 70,
          cooldown: 0,
        });
      this.world.zombies.forEach((z, i) => {
        const kind =
          i % 5 === 2 ? "runner" : i % 5 === 4 ? "armored" : "walker";
        const maxHp =
          (kind === "armored" ? 140 : kind === "runner" ? 45 : 70) +
          this.survived * 8;
        this.profiles.set(z.id, {
          kind,
          maxHp,
          speed: kind === "runner" ? 2 : kind === "armored" ? 0.55 : 0.9,
        });
        z.hp = maxHp;
        z.x = i % 4 === 0 ? 1 : 4 + ((i * 3) % 21);
        z.y = i % 4 === 2 ? 1 : 3 + ((i * 3) % 19);
        if (i % 4 === 1) z.x = 28;
        if (i % 4 === 3) z.y = 25;
      });
      this.message =
        "¡Oleada! Corredores rápidos y blindados resistentes. Apunta para disparar.";
    }
    if (phase === "wave" && this.world.phase === "preparation") {
      this.survived++;
      this.world.remainingMs = 90000;
      this.message = this.complete
        ? "¡Objetivo completo! Tu refugio sigue creciendo."
        : "Oleada superada. Cosecha y prepara munición.";
    }
  }
  private command(type: string, payload: Record<string, unknown> = {}): Result {
    if (this.paused) return { ok: false, error: "La granja está pausada" };
    return applyCommand(this.world, this.playerId, {
      id: `local-${++this.serial}`,
      type,
      payload,
    });
  }
  context() {
    const p = this.player;
    const candidates = [
      ...this.world.crops.map((c) => ({
        type: "crop",
        id: c.id,
        x: c.x,
        y: c.y,
        label:
          c.stage === "ready"
            ? "Cosechar"
            : c.stage === "empty"
              ? "Sembrar"
              : c.watered
                ? `Creciendo · ${Math.ceil((CONFIG.growMs - c.growth) / 1000)} s`
                : "Regar",
        enabled: c.stage !== "growing" || !c.watered,
      })),
      ...this.world.nodes.map((n) => ({
        type: "gather",
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.remaining
          ? n.kind === "wood"
            ? "Recoger madera"
            : n.kind === "stone"
              ? "Recoger piedra"
              : "Abrir provisiones"
          : "Regenerándose",
        enabled: n.remaining > 0,
      })),
      ...this.world.fences
        .filter((f) => f.hp < f.maxHp)
        .map((f) => ({
          type: "repair",
          id: f.id,
          x: f.x,
          y: f.y,
          label: "Reparar cerca",
          enabled: this.player.inventory.wood >= 1,
        })),
      ...this.world.backpacks.map((b) => ({
        type: "recover",
        id: b.id,
        x: b.x,
        y: b.y,
        label: "Recuperar mochila",
        enabled: true,
      })),
      {
        type: "craft",
        id: "bench",
        ...CONFIG.bench,
        label: "Fabricar 12 balas",
        enabled: true,
      },
    ]
      .filter((t) => distance(p, t) <= CONFIG.reach)
      .sort((a, b) => distance(p, a) - distance(p, b));
    return candidates[0];
  }
  interact(): Result {
    const target = this.context();
    if (!target) {
      this.message = "Acércate a la huerta, un recurso o la mesa del refugio.";
      return { ok: false, error: this.message };
    }
    if (!target.enabled) {
      this.message = target.label;
      return { ok: false, error: this.message };
    }
    const wasReady =
      target.type === "crop" &&
      this.world.crops.find((c) => c.id === target.id)?.stage === "ready";
    const result = this.command(
      target.type,
      target.type === "craft" ? {} : { target: target.id },
    );
    if (result.ok && wasReady) this.harvested++;
    this.message = result.ok ? `${target.label}: listo.` : result.error!;
    return result;
  }
  craft() {
    const result = this.command("craft");
    this.message = result.ok ? "12 balas fabricadas." : result.error!;
    return result;
  }
  eat() {
    const result = this.command("eat");
    this.message = result.ok ? "Recuperaste 25 de vida." : result.error!;
    return result;
  }
  startWave() {
    if (!this.paused && this.world.phase === "preparation")
      this.world.remainingMs = 0;
  }
}
