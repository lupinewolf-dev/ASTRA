import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export class ModelKit {
  readonly characterBall = new THREE.SphereGeometry(1, 16, 10);
  readonly roundedBox = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  readonly characterMaterials = new Map<number, THREE.MeshStandardMaterial>();
  characterMaterial(color: number) {
    let m = this.characterMaterials.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 1 });
      this.characterMaterials.set(color, m);
    }
    return m;
  }
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
      this.characterBall,
      this.roundedBox,
      this.box,
      this.ball,
      this.cylinder,
      this.cone,
      ...this.extra,
    ])
      g.dispose();
    for (const m of [
      ...this.materials.values(),
      ...this.characterMaterials.values(),
    ])
      m.dispose();
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
export type FarmerStyle = "masculine" | "feminine";
export function createFarmer(
  color: number,
  k = new ModelKit(),
  style: FarmerStyle = "masculine",
) {
  const rounded = (
    g: THREE.Group,
    color: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const m = k.mesh(g, k.roundedBox, color, x, y, z, sx, sy, sz);
    m.material = k.characterMaterial(color);
    return m;
  };
  const soft = (
    g: THREE.Group,
    color: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const m = k.mesh(g, k.characterBall, color, x, y, z, sx, sy, sz);
    m.material = k.characterMaterial(color);
    return m;
  };
  const feminine = style === "feminine";
  const shirt = feminine ? 0xeee0bd : color;
  const hairColor = feminine ? 0x593b2b : 0x302d2a;
  const shoulder = feminine ? 0.31 : 0.37;
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.name = "body";
  g.add(body);
  for (const [index, x] of [-0.15, 0.15].entries()) {
    const leg = new THREE.Group();
    leg.name = index === 0 ? "left-leg" : "right-leg";
    leg.position.set(x, 0.66, 0);
    body.add(leg);
    rounded(
      leg,
      feminine ? color : 0x394a49,
      0,
      -0.26,
      0,
      feminine ? 0.19 : 0.22,
      0.53,
      0.25,
    );
    rounded(leg, 0x49382c, 0, -0.53, 0.09, 0.25, 0.18, 0.41);
    rounded(leg, 0xc3a477, 0, -0.61, 0.09, 0.26, 0.04, 0.42);
  }
  soft(body, shirt, 0, 0.83, 0, feminine ? 0.31 : 0.37, 0.42, 0.27);
  if (feminine) {
    const overalls = new THREE.Group();
    overalls.name = "overalls";
    body.add(overalls);
    rounded(overalls, color, 0, 0.86, 0.23, 0.39, 0.4, 0.1);
    rounded(overalls, color, 0, 0.63, 0, 0.51, 0.19, 0.36);
    for (const x of [-0.15, 0.15]) {
      rounded(overalls, color, x, 1.04, 0.18, 0.075, 0.32, 0.085);
      soft(overalls, 0xe3be71, x, 0.99, 0.295, 0.026, 0.026, 0.016);
    }
    rounded(overalls, 0x476f70, 0, 0.82, 0.3, 0.23, 0.14, 0.026);
    const bag = new THREE.Group();
    bag.name = "seed-bag";
    body.add(bag);
    rounded(bag, 0xb28b55, -0.38, 0.7, 0.08, 0.27, 0.33, 0.28);
    rounded(bag, 0xd4b57c, -0.38, 0.84, 0.12, 0.29, 0.11, 0.3);
    rounded(bag, 0x786347, -0.38, 0.72, 0.235, 0.07, 0.15, 0.025);
    const strap = rounded(bag, 0xb9945b, -0.08, 0.98, 0.3, 0.06, 0.65, 0.04);
    strap.rotation.z = -0.65;
    // A small seed packet peeking out of the bag.
    rounded(bag, 0xe9ddaf, -0.38, 0.98, 0.07, 0.13, 0.16, 0.035);
    soft(bag, 0x799352, -0.38, 0.99, 0.1, 0.035, 0.04, 0.018);
  } else {
    const pack = new THREE.Group();
    pack.name = "tool-backpack";
    body.add(pack);
    rounded(pack, 0x78603d, 0, 0.93, -0.3, 0.46, 0.51, 0.25);
    rounded(pack, 0xb3965b, 0, 1.14, -0.33, 0.48, 0.13, 0.27);
    for (const x of [-0.16, 0.16])
      rounded(pack, 0x473f30, x, 0.94, -0.44, 0.055, 0.48, 0.025);
    const roll = k.pole(pack, 0x8d9b78, 0, 1.27, -0.32, 0.12, 0.49);
    roll.rotation.z = Math.PI / 2;
    k.pole(pack, 0xbda071, 0.31, 1.02, -0.3, 0.035, 0.58);
    rounded(pack, 0x6f7f80, 0.31, 1.32, -0.3, 0.25, 0.1, 0.12);
    rounded(body, 0x654936, 0, 0.66, 0.2, 0.56, 0.075, 0.065);
    rounded(body, 0xd6b267, 0.07, 0.66, 0.25, 0.08, 0.08, 0.025);
    for (const x of [-0.13, 0.13])
      rounded(body, 0xa95b3e, x, 0.87, 0.25, 0.13, 0.14, 0.04);
    for (const y of [0.78, 0.93, 1.08])
      soft(body, 0xe0bb77, 0, y, 0.28, 0.022, 0.022, 0.018);
  }
  for (const [index, x] of [-shoulder, shoulder].entries()) {
    const arm = new THREE.Group();
    arm.name = index === 0 ? "left-arm" : "right-arm";
    arm.position.set(x, 0.99, 0.04);
    arm.rotation.z = x > 0 ? -0.16 : 0.16;
    body.add(arm);
    k.pole(arm, shirt, 0, -0.23, 0, feminine ? 0.095 : 0.115, 0.49);
    k.pole(arm, feminine ? 0xd6c79e : 0x9c533d, 0, -0.43, 0, 0.12, 0.085);
    soft(arm, 0xd9af85, 0, -0.51, 0.06, 0.105, 0.12, 0.105);
  }
  const headPartsStart = body.children.length;
  soft(body, 0xe5bc90, 0, 1.43, 0.035, 0.34, 0.33, 0.29);
  for (const x of [-0.33, 0.33])
    soft(body, 0xe5bc90, x, 1.43, 0.025, 0.075, 0.1, 0.065);
  const hair = new THREE.Group();
  hair.name = feminine ? "tied-hair" : "tousled-hair";
  body.add(hair);
  soft(hair, hairColor, 0, 1.66, -0.04, 0.305, 0.19, 0.275);
  if (feminine) {
    soft(hair, hairColor, 0, 1.48, -0.21, 0.28, 0.25, 0.15);
    soft(hair, hairColor, 0.23, 1.6, -0.28, 0.19, 0.21, 0.17);
    soft(hair, hairColor, 0.27, 1.36, -0.29, 0.12, 0.2, 0.12);
    soft(hair, 0xe4b368, 0.24, 1.49, -0.29, 0.14, 0.045, 0.13);
    const fringe = soft(hair, hairColor, -0.11, 1.62, 0.2, 0.2, 0.12, 0.09);
    fringe.rotation.z = -0.35;
    soft(body, 0xd28e73, -0.18, 1.36, 0.25, 0.045, 0.025, 0.015);
    soft(body, 0xd28e73, 0.18, 1.36, 0.25, 0.045, 0.025, 0.015);
  } else {
    for (const [x, y, z] of [
      [-0.18, 1.77, 0.03],
      [0.03, 1.82, -0.02],
      [0.19, 1.73, 0.1],
      [-0.12, 1.63, 0.22],
    ])
      soft(hair, hairColor, x, y, z, 0.13, 0.11, 0.14);
    for (const x of [-0.11, 0.11])
      rounded(body, hairColor, x, 1.53, 0.276, 0.095, 0.022, 0.026);
  }
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.07, 1.33, 0.296),
    new THREE.Vector3(0, 1.3, 0.31),
    new THREE.Vector3(0.07, 1.33, 0.296),
  ]);
  const smileGeometry = new THREE.TubeGeometry(smileCurve, 8, 0.008, 4, false);
  k.extra.push(smileGeometry);
  const smile = k.mesh(body, smileGeometry, 0x965f48, 0, 0, 0, 1, 1, 1);
  smile.name = "smile";
  const headParts = body.children.slice(headPartsStart);
  // Warm cloth and a broad face keep the characters readable from above.
  rounded(body, feminine ? 0xf0d5a0 : 0x789281, 0, 1.17, 0.09, 0.4, 0.1, 0.33);
  rounded(
    body,
    feminine ? 0xf0d5a0 : 0x789281,
    -0.16,
    1.04,
    0.25,
    0.1,
    0.27,
    0.06,
  );
  for (const x of [-0.105, 0.105])
    soft(body, 0x302f29, x * 1.3, 1.46, 0.31, 0.033, 0.05, 0.02);
  soft(body, 0xd1a275, 0, 1.39, 0.33, 0.045, 0.04, 0.04);
  // Include eyes and nose, but leave scarves attached to the torso.
  headParts.push(...body.children.slice(-3));
  const head = new THREE.Group();
  head.name = "cartoon-head";
  head.position.y = 1.46;
  head.scale.setScalar(1.35);
  body.add(head);
  for (const part of headParts) {
    part.position.y -= 1.46;
    head.add(part);
  }
  if (!feminine)
    for (const x of [-0.17, 0.17])
      rounded(body, 0x9d8256, x, 0.96, 0.235, 0.055, 0.58, 0.025);
  return g;
}

const walkingPhases = new WeakMap<THREE.Group, number>();
/** Distance-driven gait; zero displacement restores the resting pose. */
export function animateFarmer(
  g: THREE.Group,
  distance: number,
  heading: number,
  seconds: number,
) {
  const moving = distance > 0.00001;
  const phase = moving ? (walkingPhases.get(g) ?? 0) + distance * 8 : 0;
  walkingPhases.set(g, phase);
  const swing = moving ? Math.sin(phase) * 0.55 : 0;
  g.getObjectByName("left-leg")!.rotation.x = swing;
  g.getObjectByName("right-leg")!.rotation.x = -swing || 0;
  g.getObjectByName("left-arm")!.rotation.x = -swing * 0.7 || 0;
  g.getObjectByName("right-arm")!.rotation.x = swing * 0.7;
  g.getObjectByName("body")!.position.y = moving
    ? Math.abs(Math.sin(phase)) * 0.025
    : 0;
  if (moving) {
    const delta = Math.atan2(
      Math.sin(heading - g.rotation.y),
      Math.cos(heading - g.rotation.y),
    );
    g.rotation.y +=
      delta * (1 - Math.exp(-12 * Math.min(Math.max(seconds, 0), 0.05)));
  }
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
