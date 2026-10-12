import Phaser from "phaser";
import { CONFIG } from "../../../packages/shared/src/config.js";
import {
  toIso,
  fromIso,
  validBuild,
  distance,
} from "../../../packages/shared/src/geometry.js";
import type { World } from "../../../packages/shared/src/types.js";
import { Connection, type User } from "./api.js";
import { InputState } from "./input.js";
import type { GameUi } from "./hud.js";
export class GameScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.Graphics;
  private objects!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private cursor: { x: number; y: number } | null = null;
  private cleanups: (() => void)[] = [];
  constructor(
    private conn: Connection,
    private user: User,
    private controls: InputState,
    private ui: GameUi,
  ) {
    super("farm");
  }
  create() {
    this.ground = this.add.graphics();
    this.objects = this.add.graphics();
    this.cameras.main.setBackgroundColor("#253e32");
    this.paintGround();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) =>
      this.pointer(p, false),
    );
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) =>
      this.pointer(p, true),
    );
    this.input.on("pointerup", () => {
      this.controls.releaseAim();
      this.conn.send("aim", { ...this.controls.aim, firing: false });
    });
    this.input.on("pointerupoutside", () => this.controls.releaseAim());
    const blur = () => {
      this.controls.blur();
      this.conn.send("aim", { ...this.controls.aim, firing: false });
      this.conn.send("move", { x: 0, y: 0 });
    };
    window.addEventListener("blur", blur);
    const visibility = () => {
      if (document.hidden) blur();
    };
    document.addEventListener("visibilitychange", visibility);
    this.cleanups.push(
      () => window.removeEventListener("blur", blur),
      () => document.removeEventListener("visibilitychange", visibility),
    );
    const sendInputs = () => {
      if (!this.controls.connected) return;
      const s = this.controls.snapshot();
      this.conn.send("move", s.move);
      this.conn.send("aim", { ...s.aim, firing: s.firing && !this.ui.build });
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      ) {
        if (this.controls.canSend) e.preventDefault();
        this.controls.pressKey(e.code);
        sendInputs();
      }
    };
    const keyup = (e: KeyboardEvent) => {
      this.controls.releaseKey(e.code);
      sendInputs();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    const inputTimer = window.setInterval(sendInputs, 100);
    this.cleanups.push(() => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.clearInterval(inputTimer);
    });
    this.setupPad("move-pad", false);
    this.setupPad("aim-pad", true);
    this.events.once("shutdown", () => this.cleanups.forEach((f) => f()));
  }
  private pointer(pointer: Phaser.Input.Pointer, down: boolean) {
    if (!this.controls.canSend) return;
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const map = fromIso(point.x, point.y);
    this.cursor = { x: Math.round(map.x), y: Math.round(map.y) };
    const world = this.conn.world,
      p = world?.players[this.user.id];
    if (!p) return;
    if (this.ui.build) {
      if (down && world) {
        if (
          validBuild(world, this.cursor.x, this.cursor.y) &&
          distance(p, this.cursor) <= CONFIG.reach
        )
          this.conn.send("build", this.cursor);
        else this.ui.status("Elige una casilla libre cercana a tu personaje");
      }
      return;
    }
    if (!pointer.wasTouch)
      this.controls.setAim(
        map.x - p.x,
        map.y - p.y,
        down || this.controls.firing,
      );
  }
  private setupPad(id: string, aim: boolean) {
    const pad = document.getElementById(id)!;
    const knob = pad.querySelector<HTMLElement>("i")!;
    let active: number | undefined;
    const move = (event: PointerEvent) => {
      if (event.pointerId !== active) return;
      const rect = pad.getBoundingClientRect();
      let dx =
          (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.35),
        dy =
          (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.35);
      const length = Math.hypot(dx, dy);
      if (length > 1) {
        dx /= length;
        dy /= length;
      }
      knob.style.transform = `translate(${dx * 28}px,${dy * 28}px)`;
      const map = fromIso(dx * 32, dy * 32),
        l = Math.hypot(map.x, map.y);
      const v = {
        x: l > 0 ? (map.x / l) * Math.min(length, 1) : 0,
        y: l > 0 ? (map.y / l) * Math.min(length, 1) : 0,
      };
      if (aim) this.controls.setAim(v.x, v.y, length > 0.12);
      else this.controls.move = v;
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      active = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      move(e);
    };
    const release = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      active = undefined;
      knob.style.transform = "translate(0,0)";
      if (aim) {
        this.controls.releaseAim();
        this.conn.send("aim", { ...this.controls.aim, firing: false });
      } else {
        this.controls.move = { x: 0, y: 0 };
        this.conn.send("move", { x: 0, y: 0 });
      }
    };
    pad.addEventListener("pointerdown", down);
    pad.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("lostpointercapture", release);
    this.cleanups.push(() => {
      pad.removeEventListener("pointerdown", down);
      pad.removeEventListener("pointermove", move);
      pad.removeEventListener("pointerup", release);
      pad.removeEventListener("pointercancel", release);
      pad.removeEventListener("lostpointercapture", release);
    });
  }
  update(_time: number, dt: number) {
    const w = this.conn.world,
      p = w?.players[this.user.id];
    if (!w || !p) return;
    const iso = toIso(p.x, p.y),
      cam = this.cameras.main;
    const compact = this.scale.width < 900;
    const centerOffset = compact ? 0 : 130;
    cam.setZoom(compact ? 0.8 : 1);
    cam.scrollX = Phaser.Math.Linear(
      cam.scrollX,
      iso.x - this.scale.width / 2 - centerOffset,
      0.12,
    );
    cam.scrollY = Phaser.Math.Linear(
      cam.scrollY,
      iso.y - this.scale.height / 2 - (compact ? 60 : 0),
      0.12,
    );
    this.paintWorld(w);
  }
  private diamond(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    scale = 1,
  ) {
    g.fillStyle(color);
    g.fillPoints(
      [
        { x: x - 32 * scale, y },
        { x, y: y - 16 * scale },
        { x: x + 32 * scale, y },
        { x, y: y + 16 * scale },
      ],
      true,
    );
  }
  private paintGround() {
    const g = this.ground;
    for (let y = 0; y < CONFIG.size; y++)
      for (let x = 0; x < CONFIG.size; x++) {
        const p = toIso(x, y);
        const path =
          (x >= 9 && x <= 11 && y >= 11) || (y === 12 && x >= 5 && x <= 14);
        const color = path
          ? (x + y) % 2
            ? 0xb8a47a
            : 0xc3ae80
          : [0x708856, 0x748d5b, 0x7a9160, 0x6e8354][(x * 7 + y * 3) % 4];
        this.diamond(g, p.x, p.y, color);
        g.lineStyle(1, 0xffffff, 0.025);
        g.strokePoints(
          [
            { x: p.x - 32, y: p.y },
            { x: p.x, y: p.y - 16 },
            { x: p.x + 32, y: p.y },
            { x: p.x, y: p.y + 16 },
          ],
          true,
        );
        if (!path && (x * 13 + y * 9) % 7 === 0) {
          g.fillStyle(0xd6d392, 0.6);
          g.fillCircle(p.x + 8, p.y - 3, 1.5);
          g.fillStyle(0x385c3c, 0.5);
          g.fillRect(p.x - 9, p.y - 1, 2, 4);
        }
      }
  }
  private paintWorld(w: World) {
    const g = this.objects;
    g.clear();
    let labelIndex = 0;
    const jobs: { depth: number; draw: () => void }[] = [];
    const label = (x: number, y: number, text: string, color = "#e7e5c9") => {
      let t = this.labels[labelIndex];
      if (!t) {
        t = this.add
          .text(x, y, text, {
            fontFamily: "system-ui",
            fontSize: "11px",
            color,
            backgroundColor: "#20352bd9",
            padding: { x: 5, y: 3 },
          })
          .setOrigin(0.5);
        this.labels.push(t);
      } else {
        if (t.text !== text) t.setText(text);
        if (t.style.color !== color) t.setColor(color);
        t.setPosition(x, y);
        t.setVisible(true);
      }
      labelIndex++;
    };
    for (const c of w.crops) {
      const p = toIso(c.x, c.y);
      this.diamond(g, p.x, p.y, 0x674b35, 0.88);
      g.lineStyle(2, 0x947052);
      for (let i = -1; i <= 1; i++) {
        g.lineBetween(
          p.x - 15 + i * 5,
          p.y + i * 5,
          p.x + 10 + i * 5,
          p.y - 10 + i * 5,
        );
      }
      if (c.watered) this.diamond(g, p.x, p.y, 0x4c634e, 0.6);
      if (c.stage !== "empty")
        jobs.push({
          depth: p.y,
          draw: () => {
            for (const [dx, dy] of [
              [-8, 0],
              [8, 0],
              [0, 6],
            ]) {
              g.lineStyle(3, 0x406b38);
              g.lineBetween(p.x + dx, p.y + dy, p.x + dx, p.y + dy - 12);
              g.fillStyle(c.stage === "ready" ? 0xdfb94e : 0x95b65a);
              g.fillEllipse(p.x + dx - 4, p.y + dy - 9, 9, 5);
              g.fillEllipse(p.x + dx + 4, p.y + dy - 14, 9, 6);
            }
            if (c.stage === "ready") label(p.x, p.y - 29, "Cosechar");
          },
        });
    }
    const house = toIso(10, 10);
    jobs.push({
      depth: house.y + 25,
      draw: () => {
        const x = house.x,
          y = house.y;
        g.fillStyle(0x22382b, 0.25);
        g.fillEllipse(x, y + 28, 210, 70);
        g.fillStyle(0xd8c59d);
        g.fillPoints(
          [
            { x: x - 96, y: y - 24 },
            { x, y: y + 24 },
            { x, y: y - 52 },
            { x: x - 96, y: y - 100 },
          ],
          true,
        );
        g.fillStyle(0xbca580);
        g.fillPoints(
          [
            { x, y: y + 24 },
            { x: x + 96, y: y - 24 },
            { x: x + 96, y: y - 100 },
            { x, y: y - 52 },
          ],
          true,
        );
        g.fillStyle(0x8b5c4d);
        g.fillPoints(
          [
            { x: x - 108, y: y - 98 },
            { x, y: y - 162 },
            { x: x + 108, y: y - 98 },
            { x, y: y - 43 },
          ],
          true,
        );
        g.fillStyle(0xa86f58);
        g.fillPoints(
          [
            { x: x - 108, y: y - 98 },
            { x, y: y - 162 },
            { x, y: y - 105 },
            { x: x - 25, y: y - 55 },
          ],
          true,
        );
        g.lineStyle(3, 0x68473c);
        g.lineBetween(x, y - 162, x + 108, y - 98);
        g.fillStyle(0x574536);
        g.fillRoundedRect(x - 26, y - 51, 27, 55, 3);
        g.fillStyle(0xf1d887);
        g.fillRect(x - 70, y - 67, 24, 23);
        g.fillRect(x + 39, y - 71, 24, 22);
        g.lineStyle(3, 0x725b45);
        g.lineBetween(x - 58, y - 67, x - 58, y - 44);
        g.fillStyle(0x785548);
        g.fillRect(x + 40, y - 161, 19, 38);
        label(x, y - 180, "⌂ Nuestro refugio");
        const bench = toIso(10, 12);
        g.fillStyle(0x70563d);
        g.fillRect(bench.x - 16, bench.y - 16, 32, 14);
        g.fillRect(bench.x - 12, bench.y - 2, 4, 12);
        g.fillRect(bench.x + 8, bench.y - 2, 4, 12);
        label(bench.x, bench.y + 19, "Mesa · almacén");
      },
    });
    for (const n of w.nodes) {
      const p = toIso(n.x, n.y);
      jobs.push({
        depth: p.y,
        draw: () => {
          g.fillStyle(0x223b2a, 0.2);
          g.fillEllipse(p.x, p.y + 6, 42, 17);
          if (n.kind === "wood") {
            g.fillStyle(0x846446);
            g.fillRect(p.x - 5, p.y - 44, 10, 46);
            g.fillStyle(n.remaining ? 0x456c43 : 0x586e45);
            g.fillCircle(p.x, p.y - 52, 25);
            g.fillStyle(0x5f884b);
            g.fillCircle(p.x - 13, p.y - 59, 18);
            g.fillStyle(0x799452);
            g.fillCircle(p.x + 5, p.y - 67, 18);
          } else if (n.kind === "stone") {
            g.fillStyle(0x8d9491);
            g.fillPoints(
              [
                { x: p.x - 20, y: p.y + 2 },
                { x: p.x - 15, y: p.y - 17 },
                { x: p.x + 1, y: p.y - 26 },
                { x: p.x + 21, y: p.y - 8 },
                { x: p.x + 15, y: p.y + 5 },
              ],
              true,
            );
            g.fillStyle(0xabb3a9);
            g.fillTriangle(
              p.x - 15,
              p.y - 17,
              p.x + 1,
              p.y - 26,
              p.x + 4,
              p.y - 4,
            );
          } else {
            g.fillStyle(0x977546);
            g.fillRoundedRect(p.x - 17, p.y - 22, 34, 25, 3);
            g.lineStyle(3, 0xc2aa6c);
            g.strokeRect(p.x - 17, p.y - 22, 34, 25);
            g.fillStyle(0x4b6254);
            g.fillRect(p.x - 4, p.y - 17, 8, 13);
          }
          label(
            p.x,
            p.y + 21,
            n.remaining
              ? `${n.kind === "wood" ? "Madera" : n.kind === "stone" ? "Piedra" : "Suministros"} · ${n.remaining}`
              : "Regenerándose",
          );
        },
      });
    }
    for (const f of w.fences) {
      const p = toIso(f.x, f.y);
      jobs.push({
        depth: p.y,
        draw: () => {
          g.lineStyle(7, f.level > 1 ? 0xa98c58 : 0x947043);
          g.lineBetween(p.x - 23, p.y - 11, p.x + 23, p.y + 11);
          g.lineBetween(p.x - 23, p.y - 22, p.x + 23, p.y);
          for (const x of [-23, 0, 23]) {
            g.fillStyle(0xc2a374);
            g.fillRect(p.x + x - 3, p.y + x / 2 - 30, 6, 36);
          }
          if (f.hp < f.maxHp) {
            g.fillStyle(0x403c30);
            g.fillRect(p.x - 18, p.y - 39, 36, 4);
            g.fillStyle(0xd3a658);
            g.fillRect(p.x - 18, p.y - 39, (36 * f.hp) / f.maxHp, 4);
          }
        },
      });
    }
    for (const b of w.backpacks) {
      const p = toIso(b.x, b.y);
      jobs.push({
        depth: p.y,
        draw: () => {
          g.fillStyle(0xc8a363);
          g.fillRoundedRect(p.x - 9, p.y - 16, 18, 20, 4);
          label(p.x, p.y - 30, "Mochila");
        },
      });
    }
    for (const [index, p] of Object.values(w.players).entries()) {
      const pos = toIso(p.x, p.y);
      jobs.push({
        depth: pos.y,
        draw: () => {
          const mine = p.id === this.user.id;
          g.fillStyle(0x183629, 0.3);
          g.fillEllipse(pos.x, pos.y + 3, 25, 11);
          if (mine) {
            g.lineStyle(2, 0xf0dba0, 0.7);
            g.strokeEllipse(pos.x, pos.y + 3, 31, 15);
          }
          g.fillStyle(index === 0 ? 0xc38c5f : 0x88a8ac);
          g.fillRoundedRect(pos.x - 8, pos.y - 25, 16, 22, 5);
          g.fillStyle(0x3f4840);
          g.fillRect(pos.x - 7, pos.y - 7, 5, 10);
          g.fillRect(pos.x + 2, pos.y - 7, 5, 10);
          g.fillStyle(0xe6b788);
          g.fillCircle(pos.x, pos.y - 32, 8);
          g.fillStyle(index === 0 ? 0x584632 : 0x624b43);
          g.fillEllipse(pos.x, pos.y - 37, 17, 10);
          const aim = toIso(p.aim.x, p.aim.y),
            len = Math.hypot(aim.x, aim.y);
          g.lineStyle(
            p.weapon === "pistol" ? 4 : 5,
            p.weapon === "pistol" ? 0x424e48 : 0xb9b5a0,
          );
          g.lineBetween(
            pos.x,
            pos.y - 17,
            pos.x + (aim.x / len) * 20,
            pos.y - 17 + (aim.y / len) * 20,
          );
          label(pos.x, pos.y - 53, p.name, mine ? "#f7db91" : "#c8e0d9");
        },
      });
    }
    for (const z of w.zombies) {
      const p = toIso(z.x, z.y);
      jobs.push({
        depth: p.y,
        draw: () => {
          g.fillStyle(0x233728, 0.35);
          g.fillEllipse(p.x, p.y + 3, 24, 10);
          g.fillStyle(0x746f68);
          g.fillRoundedRect(p.x - 8, p.y - 24, 16, 24, 3);
          g.fillStyle(0x9ba873);
          g.fillCircle(p.x, p.y - 30, 8);
          g.fillStyle(0xce6456);
          g.fillCircle(p.x - 3, p.y - 31, 2);
          g.fillCircle(p.x + 3, p.y - 31, 2);
          g.lineStyle(4, 0x9ba873);
          g.lineBetween(p.x - 8, p.y - 21, p.x - 18, p.y - 14);
          g.lineBetween(p.x + 8, p.y - 21, p.x + 18, p.y - 14);
        },
      });
    }
    jobs.sort((a, b) => a.depth - b.depth).forEach((j) => j.draw());
    for (let i = labelIndex; i < this.labels.length; i++)
      this.labels[i].setVisible(false);
    for (const s of w.shots) {
      const a = toIso(s.x, s.y),
        b = toIso(s.toX, s.toY);
      g.lineStyle(2, 0xffde8c, 0.8);
      g.lineBetween(a.x, a.y - 17, b.x, b.y - 17);
      g.fillStyle(0xffe2a0);
      g.fillCircle(b.x, b.y - 17, 3);
    }
    if (this.ui.build && this.cursor) {
      const p = toIso(this.cursor.x, this.cursor.y);
      this.diamond(
        g,
        p.x,
        p.y,
        validBuild(w, this.cursor.x, this.cursor.y) &&
          distance(w.players[this.user.id], this.cursor) <= CONFIG.reach
          ? 0xadc781
          : 0xd57e6a,
        0.95,
      );
    }
  }
}
