import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Original sculpted preview asset. Coordinates are authored for the approved silhouette. */
export function createMaleAsset() {
  const group = new THREE.Group();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const sphere = new THREE.SphereGeometry(1, 32, 20);
  const box = new RoundedBoxGeometry(1, 1, 1, 4, 0.22);
  const palette = {
    skin: 0xeeb17e,
    hair: 0x392b25,
    coat: 0xb96642,
    cuff: 0xd9a478,
    linen: 0xead8b5,
    pants: 0x53584a,
    boot: 0x875734,
    sole: 0x644b32,
    leather: 0xad7844,
    moss: 0x7c8250,
    brass: 0xdbad63,
  };
  const mesh = (
    geo: THREE.BufferGeometry,
    color: number,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) => {
    geometries.add(geo);
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
      materials.set(color, material);
    }
    const part = new THREE.Mesh(geo, material);
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    part.castShadow = true;
    part.receiveShadow = true;
    group.add(part);
    return part;
  };
  const ellipsoid = (
    c: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => mesh(sphere, c, x, y, z, sx, sy, sz);
  const rounded = (
    c: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => mesh(box, c, x, y, z, sx, sy, sz);
  // Curved tapered volumes rather than a chain of balls: hair locks, sleeves and limbs.
  const sweep = (c: number, points: number[][], radii: number[], depth = 1) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
    const frames = curve.computeFrenetFrames(24, false);
    const positions: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24,
        point = curve.getPointAt(t),
        sample = t * (radii.length - 1);
      const low = Math.min(radii.length - 2, Math.floor(sample));
      const radius = THREE.MathUtils.lerp(
        radii[low],
        radii[low + 1],
        sample - low,
      );
      for (let j = 0; j <= 12; j++) {
        const angle = (j / 12) * Math.PI * 2;
        const v = point
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(angle) * radius)
          .addScaledVector(
            frames.binormals[i],
            Math.sin(angle) * radius * depth,
          );
        positions.push(v.x, v.y, v.z);
        if (i < 24 && j < 12) {
          const a = i * 13 + j,
            b = a + 13;
          indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return mesh(geo, c, 0, 0, 0);
  };
  const panel = (c: number, points: number[][], z: number, depth = 0.05) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) =>
      i ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    return mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.025,
        bevelSegments: 3,
        steps: 1,
      }),
      c,
      0,
      0,
      z,
    );
  };
  const curveLine = (c: number, points: number[][], radius: number) =>
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          points.map(
            (p) => new THREE.Vector3(...(p as [number, number, number])),
          ),
        ),
        20,
        radius,
        8,
        false,
      ),
      c,
      0,
      0,
      0,
    );
  const rig = (
    parts: THREE.Object3D[],
    name: string,
    x: number,
    y: number,
    z: number,
  ) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(x, y, z);
    group.add(pivot);
    for (const part of parts) {
      part.position.sub(pivot.position);
      pivot.add(part);
    }
  };
  // Grounded chunky footwear and slightly bent trouser legs.
  for (const side of [-1, 1]) {
    const x = side * 0.26;
    const legStart = group.children.length;
    sweep(
      palette.pants,
      [
        [x, 1.42, 0],
        [x * 1.15, 0.96, 0.02],
        [x * 1.1, 0.47, 0.04],
      ],
      [0.2, 0.235, 0.17],
      1.12,
    );
    mesh(
      new THREE.LatheGeometry(
        [
          [0.17, -0.07],
          [0.205, -0.07],
          [0.22, -0.04],
          [0.22, 0.04],
          [0.205, 0.07],
          [0.17, 0.07],
          [0.17, -0.07],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        24,
      ),
      0x69715d,
      x * 1.1,
      0.48,
      0.035,
    );
    rounded(palette.sole, x * 1.1, 0.1, 0.17, 0.46, 0.16, 0.69);
    ellipsoid(palette.boot, x * 1.1, 0.24, 0.23, 0.235, 0.16, 0.36);
    rounded(palette.boot, x * 1.1, 0.4, -0.015, 0.35, 0.4, 0.38);
    rounded(0xab754b, x * 1.1, 0.56, -0.025, 0.37, 0.095, 0.4);
    for (const y of [0.32, 0.39, 0.46])
      curveLine(
        0xcba570,
        [
          [x - 0.1, y, 0.21],
          [x, y + 0.025, 0.245],
          [x + 0.1, y, 0.21],
        ],
        0.012,
      );
    rig(
      group.children.slice(legStart),
      side < 0 ? "left-leg" : "right-leg",
      x,
      1.42,
      0,
    );
  }
  ellipsoid(palette.coat, 0, 1.9, 0, 0.53, 0.67, 0.33);
  panel(
    palette.linen,
    [
      [-0.17, 1.34],
      [0.17, 1.34],
      [0.22, 2.36],
      [-0.22, 2.36],
    ],
    0.285,
  );
  for (const side of [-1, 1]) {
    panel(
      palette.coat,
      [
        [side * 0.17, 1.29],
        [side * 0.51, 1.32],
        [side * 0.49, 2.29],
        [side * 0.25, 2.41],
        [side * 0.17, 2.2],
      ],
      0.3,
    );
    panel(
      0xca7b50,
      [
        [side * 0.19, 2.17],
        [side * 0.34, 2.36],
        [side * 0.22, 2.45],
        [side * 0.14, 2.31],
      ],
      0.36,
    );
    rounded(0xa95838, side * 0.35, 1.64, 0.37, 0.22, 0.25, 0.07);
    rounded(0xcd885a, side * 0.35, 1.78, 0.41, 0.24, 0.075, 0.045);
    const armStart = group.children.length;
    sweep(
      palette.coat,
      [
        [side * 0.45, 2.27, 0],
        [side * 0.64, 2.04, 0.02],
        [side * 0.68, 1.77, 0.1],
      ],
      [0.12, 0.22, 0.2],
      0.95,
    );
    const cuff = rounded(
      palette.cuff,
      side * 0.68,
      1.8,
      0.105,
      0.44,
      0.13,
      0.4,
    );
    cuff.rotation.z = side * 0.15;
    if (side === -1) {
      sweep(
        palette.skin,
        [
          [-0.68, 1.78, 0.1],
          [-0.66, 1.73, 0.23],
          [-0.52, 1.89, 0.38],
          [-0.36, 2.02, 0.46],
        ],
        [0.155, 0.15, 0.125, 0.11],
      );
      ellipsoid(palette.skin, -0.32, 2.04, 0.46, 0.15, 0.16, 0.13);
      ellipsoid(palette.skin, -0.24, 2.13, 0.44, 0.06, 0.09, 0.08);
    } else {
      sweep(
        palette.skin,
        [
          [0.68, 1.78, 0.1],
          [0.72, 1.51, 0.16],
          [0.74, 1.29, 0.19],
        ],
        [0.16, 0.145, 0.12],
      );
      ellipsoid(palette.skin, 0.74, 1.2, 0.21, 0.15, 0.19, 0.12);
      ellipsoid(palette.skin, 0.62, 1.25, 0.24, 0.07, 0.11, 0.075);
    }
    rig(
      group.children.slice(armStart),
      side < 0 ? "left-arm" : "right-arm",
      side * 0.45,
      2.27,
      0,
    );
    rounded(0x8a623b, side * 0.3, 2.0, 0.38, 0.085, 0.68, 0.065).rotation.z =
      side * 0.08;
    rounded(palette.brass, side * 0.3, 1.98, 0.425, 0.12, 0.1, 0.035);
  }
  rounded(0x6f4e32, 0, 1.36, 0.34, 0.46, 0.095, 0.08);
  rounded(palette.brass, 0, 1.36, 0.39, 0.15, 0.12, 0.035);
  // A single substantial backpack, blanket and silhouette-readable hammer.
  rounded(palette.leather, 0, 1.95, -0.4, 0.76, 0.81, 0.36);
  rounded(0xbd8c56, 0, 2.29, -0.44, 0.81, 0.19, 0.39);
  for (const x of [-0.22, 0.22]) {
    rounded(0x8a5d35, x, 1.95, -0.6, 0.075, 0.65, 0.045);
    rounded(palette.brass, x, 1.88, -0.64, 0.13, 0.11, 0.04);
  }
  rounded(0xc18c50, 0, 1.77, -0.64, 0.54, 0.33, 0.15);
  const blanket = mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.87, 24),
    palette.moss,
    0,
    2.46,
    -0.4,
  );
  blanket.rotation.z = Math.PI / 2;
  for (const x of [-0.27, 0.27])
    rounded(0xae8050, x, 2.46, -0.58, 0.075, 0.33, 0.045);
  rounded(0xd3a36a, 0.5, 1.94, -0.37, 0.07, 0.61, 0.09).rotation.z = -0.12;
  rounded(0x859091, 0.53, 2.27, -0.37, 0.35, 0.13, 0.14);
  // Soft square-jawed face, not a round balloon: deform the sphere at the lower cheeks.
  const faceGeo = sphere.clone();
  const vertices = faceGeo.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) {
    const y = vertices.getY(i);
    vertices.setX(i, vertices.getX(i) * (y < 0 ? 1.07 : 1));
    if (y < -0.3) vertices.setY(i, -0.3 + (y + 0.3) * 0.82);
  }
  faceGeo.computeVertexNormals();
  mesh(faceGeo, palette.skin, 0, 2.99, 0.02, 0.56, 0.61, 0.48);
  for (const side of [-1, 1]) {
    ellipsoid(palette.skin, side * 0.55, 2.94, 0.015, 0.12, 0.16, 0.1);
    ellipsoid(0xd48c60, side * 0.58, 2.94, 0.088, 0.055, 0.095, 0.019);
    ellipsoid(0x2e2924, side * 0.19, 3.0, 0.473, 0.052, 0.098, 0.032);
    ellipsoid(0xf4e4c3, side * 0.19 - 0.01, 3.034, 0.501, 0.01, 0.015, 0.004);
    curveLine(
      palette.hair,
      [
        [side * 0.11, 3.2, 0.46],
        [side * 0.2, 3.23, 0.448],
        [side * 0.28, 3.2, 0.417],
      ],
      0.03,
    );
  }
  ellipsoid(0xe69b69, 0, 2.87, 0.51, 0.08, 0.072, 0.086);
  curveLine(
    0x905c42,
    [
      [-0.115, 2.75, 0.417],
      [-0.045, 2.712, 0.454],
      [0.04, 2.715, 0.455],
      [0.105, 2.756, 0.43],
    ],
    0.014,
  );
  // Broad flowing sculpted locks with pointed tips, layered over a fitted hair cap.
  mesh(
    new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, 1.8),
    palette.hair,
    0,
    3.29,
    -0.025,
    0.6,
    0.39,
    0.51,
  );
  for (const [points, radii] of [
    [
      [
        [0.23, 3.57, -0.07],
        [0.17, 3.57, 0.25],
        [-0.07, 3.4, 0.47],
        [-0.4, 3.21, 0.42],
      ],
      [0.035, 0.19, 0.2, 0.005],
    ],
    [
      [
        [0.42, 3.43, 0.0],
        [0.37, 3.52, 0.24],
        [0.15, 3.35, 0.5],
        [-0.03, 3.21, 0.5],
      ],
      [0.03, 0.16, 0.18, 0.003],
    ],
    [
      [
        [-0.3, 3.47, 0.0],
        [-0.4, 3.36, 0.2],
        [-0.5, 3.13, 0.25],
        [-0.51, 2.98, 0.17],
      ],
      [0.03, 0.16, 0.13, 0.005],
    ],
    [
      [
        [0.46, 3.42, -0.02],
        [0.53, 3.31, 0.12],
        [0.55, 3.07, 0.16],
        [0.51, 2.98, 0.12],
      ],
      [0.02, 0.14, 0.12, 0.005],
    ],
  ] as [number[][], number[]][])
    sweep(palette.hair, points, radii, 0.65);
  ellipsoid(palette.skin, 0, 2.47, 0, 0.18, 0.25, 0.17);
  const collar = mesh(
    new THREE.TorusGeometry(0.24, 0.105, 12, 32),
    palette.moss,
    0,
    2.47,
    0,
  );
  collar.rotation.x = Math.PI / 2;
  collar.scale.z = 0.75;
  const scarfShape = new THREE.Shape();
  scarfShape.moveTo(-0.3, 2.43);
  scarfShape.quadraticCurveTo(-0.02, 2.38, 0.27, 2.43);
  scarfShape.quadraticCurveTo(0.27, 2.28, 0.12, 2.2);
  scarfShape.quadraticCurveTo(0.02, 2.13, -0.05, 2.14);
  scarfShape.quadraticCurveTo(-0.21, 2.22, -0.3, 2.43);
  const scarfGeometry = new THREE.ExtrudeGeometry(scarfShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.025,
    bevelSegments: 4,
    curveSegments: 16,
  });
  mesh(scarfGeometry, palette.moss, 0, 0, 0.43);
  curveLine(
    0x8f9461,
    [
      [-0.22, 2.37, 0.51],
      [0, 2.32, 0.525],
      [0.19, 2.37, 0.51],
    ],
    0.014,
  );
  const body = new THREE.Group();
  body.name = "body";
  const parts = [...group.children];
  group.add(body);
  parts.forEach((part) => body.add(part));
  group.name = "male-cartoon-sculpt";
  let disposed = false;
  return {
    group,
    dispose() {
      if (disposed) return;
      disposed = true;
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      group.clear();
    },
  };
}
