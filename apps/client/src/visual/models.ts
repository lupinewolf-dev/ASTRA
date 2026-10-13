import * as THREE from "three";
export class ModelKit {
  readonly box = new THREE.BoxGeometry(1, 1, 1);
  readonly ball = new THREE.IcosahedronGeometry(1, 1);
  readonly cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
  readonly cone = new THREE.ConeGeometry(1, 1, 8);
  readonly materials = new Map<number, THREE.MeshStandardMaterial>();
  readonly extra: THREE.BufferGeometry[] = [];
  material(color: number) {
    let m = this.materials.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.95,
        flatShading: true,
      });
      this.materials.set(color, m);
    }
    return m;
  }
  mesh(
    group: THREE.Group,
    geometry: THREE.BufferGeometry,
    color: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    const m = new THREE.Mesh(geometry, this.material(color));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }
  block(
    g: THREE.Group,
    c: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    return this.mesh(g, this.box, c, x, y, z, sx, sy, sz);
  }
  orb(
    g: THREE.Group,
    c: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    return this.mesh(g, this.ball, c, x, y, z, sx, sy, sz);
  }
  pole(
    g: THREE.Group,
    c: number,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
  ) {
    return this.mesh(g, this.cylinder, c, x, y, z, r, h, r);
  }
  dispose() {
    for (const g of [
      this.box,
      this.ball,
      this.cylinder,
      this.cone,
      ...this.extra,
    ])
      g.dispose();
    for (const m of this.materials.values()) m.dispose();
  }
}
export function createHouse(k = new ModelKit()) {
  const g = new THREE.Group(),
    cream = 0xe6ce9e,
    timber = 0x725035,
    roof = 0xad5437;
  k.block(g, 0x8c8970, 0, 0.18, 0, 4.85, 0.36, 3.7);
  k.block(g, cream, 0, 1.55, 0, 4.6, 2.75, 3.4);
  for (const x of [-2.28, 2.28])
    for (const z of [-1.69, 1.69])
      k.block(g, timber, x, 1.58, z, 0.16, 2.8, 0.16);
  // The roof is an original gabled prism; its broad planes keep the silhouette legible.
  const shape = new THREE.Shape();
  shape.moveTo(-2.65, 0);
  shape.lineTo(0, 1.7);
  shape.lineTo(2.65, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 3.95,
    bevelEnabled: false,
  });
  k.extra.push(geo);
  const roofMesh = new THREE.Mesh(geo, k.material(roof));
  roofMesh.position.set(0, 2.97, -1.975);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  g.add(roofMesh);
  // Rows of roof tiles and ridge caps give detail without image textures.
  const slope = Math.atan2(1.7, 2.65);
  for (const side of [-1, 1])
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 9; col++) {
        const x = side * (0.23 + row * 0.43),
          y = 4.67 - (Math.abs(x) * 1.7) / 2.65;
        const tile = k.block(
          g,
          (row + col) % 3 === 0 ? 0xc87951 : 0xb96040,
          x,
          y + 0.055,
          -1.8 + col * 0.45,
          0.44,
          0.08,
          0.42,
        );
        tile.rotation.z = -side * slope;
      }
  for (let z = -1.85; z < 2; z += 0.37) {
    const cap = k.pole(g, 0xc1764d, 0, 4.76, z, 0.12, 0.38);
    cap.rotation.x = Math.PI / 2;
  }
  k.block(g, 0xaf9e85, 1.05, 4.28, -0.9, 0.48, 1.4, 0.53);
  k.block(g, 0xd6c2a0, 1.05, 4.96, -0.9, 0.66, 0.18, 0.7);
  k.block(g, 0x5b5347, 1.05, 5.065, -0.9, 0.37, 0.02, 0.41);
  // Door, glazed windows, frames, shutters.
  k.block(g, timber, -0.1, 1.17, 1.735, 0.84, 1.95, 0.12);
  k.block(g, 0x997146, -0.1, 1.16, 1.81, 0.65, 1.75, 0.06);
  k.orb(g, 0xe5b560, 0.15, 1.12, 1.86, 0.045, 0.045, 0.045);
  const window = (x: number, y: number, z: number, side = false) => {
    const frame = new THREE.Group();
    k.block(frame, timber, 0, 0, 0, 0.96, 1.05, 0.12);
    k.block(frame, 0xf9d58b, 0, 0, 0.065, 0.77, 0.85, 0.025);
    k.block(frame, 0x91643c, 0, 0, 0.09, 0.06, 0.87, 0.03);
    k.block(frame, 0x91643c, 0, 0, 0.09, 0.8, 0.06, 0.03);
    for (const sign of [-1, 1]) {
      k.block(frame, 0x7c9165, sign * 0.64, 0, 0.02, 0.28, 1.05, 0.08);
      for (let i = 0; i < 4; i++)
        k.block(
          frame,
          0x506548,
          sign * 0.64,
          -0.35 + i * 0.23,
          0.065,
          0.24,
          0.035,
          0.025,
        );
    }
    frame.position.set(x, y, z);
    if (side) frame.rotation.y = Math.PI / 2;
    g.add(frame);
  };
  window(-1.48, 1.85, 1.74);
  window(1.32, 1.85, 1.74);
  window(2.33, 1.8, 0.3, true);
  k.block(g, 0x94734e, 0, 0.31, 2.3, 3.9, 0.18, 1.2);
  for (let i = 0; i < 3; i++)
    k.block(
      g,
      0xb59b74,
      -0.12,
      0.1 + i * 0.065,
      3.12 - i * 0.22,
      1.22,
      0.14,
      0.35,
    );
  for (const x of [-1.85, 1.85]) {
    k.pole(g, timber, x, 1.54, 2.74, 0.075, 2.5);
    k.block(g, 0x806448, x, 0.67, 2.3, 0.07, 0.07, 1.1);
  }
  k.block(g, 0x9c6947, 0, 2.9, 2.24, 4.02, 0.15, 1.37);
  for (const x of [-1.1, 1.25]) {
    k.block(g, timber, x, 1.77, 2.74, 0.08, 0.7, 0.08);
    k.block(g, 0x483e2c, x, 1.4, 2.74, 0.22, 0.35, 0.22);
    k.block(g, 0xffd08a, x, 1.4, 2.76, 0.15, 0.22, 0.15);
  }
  for (const x of [-1.95, 1.82]) {
    k.pole(g, 0xb16740, x, 0.44, 3, 0.23, 0.62);
    k.orb(g, 0x52784a, x, 0.81, 3, 0.33, 0.26, 0.3);
    for (const dx of [-0.15, 0.15])
      k.orb(g, 0xedc982, x + dx, 0.95, 3, 0.07, 0.07, 0.07);
  }
  return g;
}
export function createTree(k = new ModelKit(), variant = 0) {
  const g = new THREE.Group();
  k.pole(g, 0x796040, 0, 1.1, 0, 0.18, 2.2);
  const branch = k.pole(g, 0x796040, 0.26, 1.52, 0, 0.09, 0.85);
  branch.rotation.z = -0.7;
  const colors = [0x7b9550, 0x6f8c49, 0x8c9d54, 0x849344];
  for (const [x, y, z, r] of [
    [0, 2.9, 0, 1.07],
    [-0.72, 2.45, 0.05, 0.77],
    [0.72, 2.65, 0.2, 0.82],
    [0.08, 2.7, -0.73, 0.82],
    [-0.22, 3.35, 0.3, 0.78],
  ])
    k.orb(g, colors[variant % 4], x, y, z, r, r * 0.88, r);
  return g;
}
export function createPine(k: ModelKit) {
  const g = new THREE.Group();
  k.pole(g, 0x70563b, 0, 0.6, 0, 0.14, 1.2);
  for (let i = 0; i < 3; i++)
    k.mesh(
      g,
      k.cone,
      [0x486d57, 0x50765b, 0x5f8060][i],
      0,
      1.25 + i * 0.8,
      0,
      1.1 - i * 0.2,
      1.9,
      1.1 - i * 0.2,
    );
  return g;
}
export function createFarmer(color: number, k = new ModelKit()) {
  const g = new THREE.Group();
  for (const x of [-0.15, 0.15]) {
    k.block(g, 0x4c5143, x, 0.4, 0, 0.2, 0.53, 0.24);
    k.block(g, 0x554333, x, 0.13, 0.09, 0.23, 0.17, 0.4);
  }
  k.orb(g, color, 0, 0.83, 0, 0.33, 0.41, 0.25);
  k.block(g, 0x7b633f, 0, 0.93, -0.28, 0.4, 0.45, 0.2);
  const roll = k.pole(g, 0x8d9b78, 0, 1.22, -0.29, 0.1, 0.42);
  roll.rotation.z = Math.PI / 2;
  for (const x of [-0.35, 0.35]) {
    const arm = k.pole(g, color, x, 0.76, 0.04, 0.105, 0.49);
    arm.rotation.z = x > 0 ? -0.16 : 0.16;
    k.orb(g, 0xd9af85, x, 0.48, 0.1, 0.1, 0.12, 0.1);
  }
  k.orb(g, 0xe5bc90, 0, 1.42, 0.035, 0.255, 0.29, 0.235);
  k.orb(g, 0x66503a, 0, 1.62, -0.02, 0.265, 0.17, 0.24);
  for (const x of [-0.095, 0.095])
    k.orb(g, 0x413b30, x, 1.46, 0.252, 0.024, 0.03, 0.018);
  k.orb(g, 0xd1a275, 0, 1.38, 0.272, 0.035, 0.04, 0.03);
  for (const x of [-0.17, 0.17])
    k.block(g, 0x9d8256, x, 0.96, 0.215, 0.055, 0.58, 0.025);
  k.block(g, 0x383f3b, 0.35, 0.39, 0.17, 0.09, 0.23, 0.13);
  k.block(g, 0x515e55, 0.35, 0.4, 0.26, 0.1, 0.13, 0.28);
  return g;
}
export function createCropPlot(k = new ModelKit(), variant = 0) {
  const g = new THREE.Group();
  k.block(g, 0x70563a, 0, 0.035, 0, 1.45, 0.075, 2.1);
  for (const x of [-0.75, 0.75])
    k.block(g, 0xa18a5b, x, 0.12, 0, 0.07, 0.2, 2.22);
  for (const z of [-1.08, 1.08])
    k.block(g, 0xa18a5b, 0, 0.12, z, 1.5, 0.2, 0.07);
  for (let row = 0; row < 4; row++)
    for (const x of [-0.4, 0, 0.4]) {
      const z = -0.72 + row * 0.47;
      k.orb(g, 0x4f7f42, x, 0.2, z, 0.18, 0.18, 0.22);
      k.orb(g, 0x739748, x + 0.08, 0.31, z - 0.06, 0.12, 0.18, 0.13);
      k.orb(
        g,
        variant % 2 ? 0xd19b42 : 0xba7046,
        x - 0.05,
        0.25,
        z + 0.05,
        0.11,
        0.09,
        0.11,
      );
    }
  return g;
}
export function createFence(k: ModelKit, length = 2.0) {
  const g = new THREE.Group();
  for (const x of [-length / 2, length / 2]) {
    k.block(g, 0x917144, x, 0.46, 0, 0.14, 0.92, 0.16);
    k.mesh(g, k.cone, 0xb2915b, x, 0.97, 0, 0.13, 0.13, 0.13);
  }
  for (const y of [0.32, 0.68])
    k.block(g, 0xb69b66, 0, y, 0, length, 0.11, 0.12);
  return g;
}
export function createWorkbench(k: ModelKit) {
  const g = new THREE.Group();
  k.block(g, 0xb29160, 0, 0.8, 0, 1.5, 0.16, 0.72);
  for (const x of [-0.58, 0.58])
    for (const z of [-0.25, 0.25])
      k.block(g, 0x806142, x, 0.38, z, 0.09, 0.76, 0.09);
  k.block(g, 0x8d7751, 0, 0.9, 0, 0.47, 0.14, 0.34);
  k.block(g, 0xdfd4b0, 0.35, 0.905, 0.08, 0.29, 0.015, 0.22);
  k.block(g, 0x505a50, -0.43, 0.93, 0.02, 0.34, 0.08, 0.12);
  return g;
}
export function createBarrel(k: ModelKit) {
  const g = new THREE.Group();
  k.pole(g, 0x937147, 0, 0.4, 0, 0.34, 0.78);
  for (const y of [0.14, 0.65]) k.pole(g, 0x51594b, 0, y, 0, 0.35, 0.07);
  k.pole(g, 0x6c5032, 0, 0.8, 0, 0.3, 0.02);
  return g;
}
