import * as THREE from "three";

/** Same geometry/material/flags become one draw. Caller owns the returned instances. */
export function batchStatic(
  root: THREE.Group,
  excluded = new Set<THREE.Object3D>(),
): THREE.InstancedMesh[] {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map<string, THREE.Mesh[]>();
  root.traverse((part) => {
    if (
      !(part instanceof THREE.Mesh) ||
      part instanceof THREE.InstancedMesh ||
      Array.isArray(part.material)
    )
      return;
    for (
      let ancestor: THREE.Object3D | null = part;
      ancestor && ancestor !== root;
      ancestor = ancestor.parent
    )
      if (excluded.has(ancestor)) return;
    const key = `${part.geometry.uuid}:${part.material.uuid}:${part.castShadow}:${part.receiveShadow}`;
    const list = groups.get(key) ?? [];
    list.push(part);
    groups.set(key, list);
  });
  const result: THREE.InstancedMesh[] = [];
  for (const parts of groups.values()) {
    if (parts.length < 2) continue;
    const first = parts[0],
      instance = new THREE.InstancedMesh(
        first.geometry,
        first.material,
        parts.length,
      );
    instance.castShadow = first.castShadow;
    instance.receiveShadow = first.receiveShadow;
    parts.forEach((part, i) => {
      instance.setMatrixAt(
        i,
        new THREE.Matrix4().multiplyMatrices(inverse, part.matrixWorld),
      );
      part.removeFromParent();
    });
    instance.instanceMatrix.needsUpdate = true;
    instance.computeBoundingBox();
    instance.computeBoundingSphere();
    root.add(instance);
    result.push(instance);
  }
  return result;
}
