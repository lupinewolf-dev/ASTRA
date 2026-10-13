import { it, expect } from "vitest";
import * as THREE from "three";
import { batchStatic } from "../src/visual/batch-static.js";
it("reduces static draw objects while preserving transformed world bounds and shared ownership", () => {
  expect(batchStatic).toBeTypeOf("function");
  const root = new THREE.Group();
  root.position.set(2, 0, 3);
  const sub = new THREE.Group();
  sub.position.y = 1;
  root.add(sub);
  const geo = new THREE.BoxGeometry(1, 1, 1),
    mat = new THREE.MeshStandardMaterial();
  for (const x of [-2, 2]) {
    const m = new THREE.Mesh(geo, mat);
    m.position.x = x;
    sub.add(m);
  }
  const before = new THREE.Box3().setFromObject(root);
  const batches = batchStatic(root);
  expect(batches).toHaveLength(1);
  expect(batches[0].count).toBe(2);
  const after = new THREE.Box3().setFromObject(root);
  expect(after.min.distanceTo(before.min)).toBeLessThan(0.0001);
  expect(after.max.distanceTo(before.max)).toBeLessThan(0.0001);
  let disposed = false;
  geo.addEventListener("dispose", () => (disposed = true));
  batches.forEach((b) => b.dispose());
  expect(disposed).toBe(false);
  geo.dispose();
  mat.dispose();
});
it("keeps animated objects excluded from static batching", () => {
  expect(batchStatic).toBeTypeOf("function");
  const root = new THREE.Group(),
    actor = new THREE.Group();
  root.add(actor);
  const geo = new THREE.BoxGeometry(),
    mat = new THREE.MeshStandardMaterial();
  actor.add(new THREE.Mesh(geo, mat), new THREE.Mesh(geo, mat));
  expect(batchStatic(root, new Set([actor]))).toHaveLength(0);
  expect(actor.children).toHaveLength(2);
  geo.dispose();
  mat.dispose();
});
