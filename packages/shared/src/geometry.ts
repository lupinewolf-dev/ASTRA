import { CONFIG } from "./config.js";
import type { Point, World } from "./types.js";
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const isHouse = (x: number, y: number) =>
  x >= 8 && x <= 12 && y >= 8 && y <= 11;
export function validBuild(w: World, x: number, y: number) {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 1 &&
    y >= 1 &&
    x < CONFIG.size - 1 &&
    y < CONFIG.size - 1 &&
    !isHouse(x, y) &&
    distance({ x, y }, CONFIG.spawn) > 1.2 &&
    !w.fences.some((f) => f.x === x && f.y === y) &&
    !w.crops.some((c) => c.x === x && c.y === y) &&
    !w.nodes.some((n) => n.x === x && n.y === y) &&
    !Object.values(w.players).some((p) => distance(p, { x, y }) < 0.65)
  );
}
export function blocked(w: World, x: number, y: number) {
  return (
    x < 0.5 ||
    y < 0.5 ||
    x > CONFIG.size - 1.5 ||
    y > CONFIG.size - 1.5 ||
    isHouse(x, y) ||
    w.fences.some((f) => Math.abs(f.x - x) < 0.55 && Math.abs(f.y - y) < 0.55)
  );
}
export const toIso = (x: number, y: number) => ({
  x: (x - y) * 32,
  y: (x + y) * 16,
});
export const fromIso = (x: number, y: number) => ({
  x: x / 64 + y / 32,
  y: y / 32 - x / 64,
});
