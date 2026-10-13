import { describe, expect, it } from "vitest";
import * as THREE from "three";
import * as models from "../src/visual/models.js";
// Real model transforms: freezing limbs or snapping heading breaks these assertions.
const animate = (
  farmer: THREE.Group,
  distance: number,
  heading: number,
  seconds: number,
) => {
  const update = (
    models as unknown as {
      animateFarmer?: (g: THREE.Group, d: number, h: number, s: number) => void;
    }
  ).animateFarmer;
  expect(update, "farmer animation must be available").toBeTypeOf("function");
  update!(farmer, distance, heading, seconds);
};
describe("farmer walking pose", () => {
  it("has pivoted legs and arms, with boots and hands attached", () => {
    const farmer = models.createFarmer(0xbd704d);
    for (const name of ["left-leg", "right-leg", "left-arm", "right-arm"]) {
      expect(farmer.getObjectByName(name), name).toBeDefined();
      expect(
        farmer.getObjectByName(name)!.children.length,
      ).toBeGreaterThanOrEqual(2);
    }
  });
  it("swings opposite limbs and returns exactly to a standing pose", () => {
    const farmer = models.createFarmer(0xbd704d);
    animate(farmer, 0.2, 1, 1 / 60);
    const left = farmer.getObjectByName("left-leg")!;
    const right = farmer.getObjectByName("right-leg")!;
    expect(Math.abs(left.rotation.x)).toBeGreaterThan(0.1);
    expect(right.rotation.x).toBeCloseTo(-left.rotation.x);
    expect(farmer.getObjectByName("left-arm")!.rotation.x).toBeCloseTo(
      -left.rotation.x * 0.7,
    );
    animate(farmer, 0, 1, 1 / 60);
    expect(left.rotation.x).toBe(0);
    expect(right.rotation.x).toBe(0);
    expect(farmer.getObjectByName("body")!.position.y).toBe(0);
  });
  it("turns gradually along the shortest arc across the angle boundary", () => {
    const farmer = models.createFarmer(0xbd704d);
    farmer.rotation.y = Math.PI - 0.1;
    animate(farmer, 0.04, -Math.PI + 0.1, 1 / 60);
    expect(farmer.rotation.y).toBeGreaterThan(Math.PI - 0.1);
    expect(farmer.rotation.y).toBeLessThan(Math.PI + 0.1);
  });
  it("does not keep stepping when stopped at a boundary", () => {
    const farmer = models.createFarmer(0xbd704d);
    animate(farmer, 0.2, 0, 0.05);
    animate(farmer, 0, 0, 0.05);
    expect(farmer.getObjectByName("left-leg")!.rotation.x).toBe(0);
    expect(farmer.getObjectByName("right-arm")!.rotation.x).toBe(0);
  });
});

describe("invented character assets", () => {
  it("builds distinct hairstyles and accessories for both characters", () => {
    const kit = new models.ModelKit();
    const male = models.createFarmer(0xbd704d, kit, "masculine");
    const female = models.createFarmer(0x638d8b, kit, "feminine");
    expect(male.getObjectByName("tool-backpack")).toBeDefined();
    expect(male.getObjectByName("tousled-hair")).toBeDefined();
    expect(female.getObjectByName("tied-hair")).toBeDefined();
    expect(female.getObjectByName("seed-bag")).toBeDefined();
    expect(female.getObjectByName("overalls")).toBeDefined();
    kit.dispose();
  });
  it("preserves walking and attached accessories for the feminine asset", () => {
    const kit = new models.ModelKit();
    const female = models.createFarmer(0x638d8b, kit, "feminine");
    const bag = female.getObjectByName("seed-bag");
    expect(bag).toBeDefined();
    animate(female, 0.2, 1, 1 / 60);
    expect(
      Math.abs(female.getObjectByName("left-leg")!.rotation.x),
    ).toBeGreaterThan(0.1);
    expect(bag!.parent?.name).toBe("body");
    animate(female, 0, 1, 1 / 60);
    expect(female.getObjectByName("left-leg")!.rotation.x).toBe(0);
    kit.dispose();
  });
});
