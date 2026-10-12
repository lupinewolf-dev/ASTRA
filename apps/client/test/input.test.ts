import { it, expect } from "vitest";
import { InputState } from "../src/input.js";
import {
  toIso,
  fromIso,
  validBuild,
} from "../../../packages/shared/src/geometry.js";
import { createWorld } from "../../../packages/shared/src/world.js";
it("stops firing on touch release blur or menu and cannot send offline", () => {
  const s = new InputState();
  s.connected = true;
  s.setAim(1, 0, true);
  expect(s.snapshot().firing).toBe(true);
  s.releaseAim();
  expect(s.snapshot().firing).toBe(false);
  s.setAim(0, 1, true);
  s.blur();
  expect(s.snapshot().firing).toBe(false);
  s.setAim(1, 0, true);
  s.openMenu();
  expect(s.snapshot().firing).toBe(false);
  s.closeMenu();
  s.connected = false;
  s.setAim(1, 0, true);
  expect(s.snapshot().firing).toBe(false);
  expect(s.canSend).toBe(false);
});
it("round-trips isometric coordinates and rejects outside placement", () => {
  for (const [x, y] of [
    [0, 0],
    [3, 8],
    [12, 19],
  ]) {
    const iso = toIso(x, y);
    expect(fromIso(iso.x, iso.y)).toEqual({ x, y });
  }
  expect(validBuild(createWorld("w"), -1, 3)).toBe(false);
});
it("updates keyboard movement immediately without render frames and clears on release", () => {
  const s = new InputState();
  s.connected = true;
  s.pressKey("KeyA");
  expect(s.snapshot().move.x).toBeLessThan(0);
  expect(s.snapshot().move.y).toBeGreaterThan(0);
  s.releaseKey("KeyA");
  expect(s.snapshot().move).toEqual({ x: 0, y: 0 });
  s.pressKey("ArrowUp");
  s.blur();
  expect(s.snapshot().move).toEqual({ x: 0, y: 0 });
  s.openMenu();
  s.pressKey("KeyD");
  s.closeMenu();
  expect(s.snapshot().move).toEqual({ x: 0, y: 0 });
});
