import { it, expect } from "vitest";
import * as THREE from "three";
import { createMaleAsset } from "../src/visual/male-asset.js";
import { animateFarmer } from "../src/visual/models.js";

it("keeps the reviewed model articulated for walking and rest", () => {
  const asset = createMaleAsset();
  for (const name of ["body", "left-leg", "right-leg", "left-arm", "right-arm"])
    expect(asset.group.getObjectByName(name), name).toBeDefined();
  for (let i = 0; i < 12; i++) animateFarmer(asset.group, 0.04, 1, 1 / 60);
  expect(
    Math.abs(asset.group.getObjectByName("left-leg")!.rotation.x),
  ).toBeGreaterThan(0.1);
  for (let i = 0; i < 150; i++) animateFarmer(asset.group, 0, 1, 1 / 60);
  expect(
    Math.abs(asset.group.getObjectByName("left-leg")!.rotation.x),
  ).toBeLessThan(0.001);
  asset.dispose();
});
it("releases unique geometries and materials once when disposed repeatedly", () => {
  const asset = createMaleAsset();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  asset.group.traverse((p) => {
    if (p instanceof THREE.Mesh) {
      geometries.add(p.geometry);
      materials.add(p.material as THREE.Material);
    }
  });
  let geometryCount = 0,
    materialCount = 0;
  geometries.forEach((g) =>
    g.addEventListener("dispose", () => geometryCount++),
  );
  materials.forEach((m) =>
    m.addEventListener("dispose", () => materialCount++),
  );
  asset.dispose();
  asset.dispose();
  expect(geometryCount).toBe(geometries.size);
  expect(materialCount).toBe(materials.size);
  expect(asset.group.children).toHaveLength(0);
});
it("has nested knees, ankles, elbows, wrists and an independently turning head", () => {
  const asset = createMaleAsset();
  for (const side of ["left", "right"]) {
    expect(asset.group.getObjectByName(`${side}-knee`)?.parent?.name).toBe(
      `${side}-leg`,
    );
    expect(asset.group.getObjectByName(`${side}-ankle`)?.parent?.name).toBe(
      `${side}-knee`,
    );
    expect(asset.group.getObjectByName(`${side}-elbow`)?.parent?.name).toBe(
      `${side}-arm`,
    );
    expect(asset.group.getObjectByName(`${side}-wrist`)?.parent?.name).toBe(
      `${side}-elbow`,
    );
  }
  expect(asset.group.getObjectByName("head")?.parent?.name).toBe("torso");
  expect(asset.group.getObjectByName("weapon-socket")?.parent?.name).toBe(
    "right-wrist",
  );
  asset.dispose();
});
it("bends knees while walking and settles smoothly back into a breathing idle", () => {
  const asset = createMaleAsset();
  for (let i = 0; i < 15; i++) animateFarmer(asset.group, 0.04, 0, 1 / 60);
  expect(
    Math.max(
      ...["left-knee", "right-knee"].map(
        (n) => asset.group.getObjectByName(n)!.rotation.x,
      ),
    ),
  ).toBeGreaterThan(0.2);
  for (let i = 0; i < 150; i++) animateFarmer(asset.group, 0, 0, 1 / 60);
  expect(
    Math.abs(asset.group.getObjectByName("left-leg")!.rotation.x),
  ).toBeLessThan(0.02);
  const chest = asset.group.getObjectByName("torso")!;
  const before = chest.position.y;
  for (let i = 0; i < 20; i++) animateFarmer(asset.group, 0, 0, 1 / 60);
  expect(chest.position.y).not.toBe(before);
  asset.dispose();
});
