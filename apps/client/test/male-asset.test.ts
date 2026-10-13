import { it, expect } from "vitest";
import * as THREE from "three";
import { createMaleAsset } from "../src/visual/male-asset.js";
import { animateFarmer } from "../src/visual/models.js";

it("keeps the reviewed model articulated for walking and rest", () => {
  const asset = createMaleAsset();
  for (const name of ["body", "left-leg", "right-leg", "left-arm", "right-arm"])
    expect(asset.group.getObjectByName(name), name).toBeDefined();
  animateFarmer(asset.group, 0.2, 1, 1 / 60);
  expect(
    Math.abs(asset.group.getObjectByName("left-leg")!.rotation.x),
  ).toBeGreaterThan(0.1);
  animateFarmer(asset.group, 0, 1, 1 / 60);
  expect(asset.group.getObjectByName("left-leg")!.rotation.x).toBe(0);
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
