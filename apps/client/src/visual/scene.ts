import * as THREE from "three";
import type { World } from "../../../../packages/shared/src/types.js";
import {
  ModelKit,
  createHouse,
  createTree,
  createPine,
  createFarmer,
  createCropPlot,
  createFence,
  createWorkbench,
  createBarrel,
} from "./models.js";
export interface VisualScene {
  resize(): void;
  dispose(): void;
}
export function createVisualScene(
  container: HTMLElement,
  world: World,
): VisualScene {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.append(renderer.domElement);
  const scene = new THREE.Scene(),
    kit = new ModelKit();
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 120);
  camera.position.set(30, 27, 35);
  camera.lookAt(9.8, 1, 11.8);
  scene.add(new THREE.HemisphereLight(0xffedc9, 0x597455, 2.0));
  const sun = new THREE.DirectionalLight(0xffd89d, 3.0);
  sun.position.set(-3, 19, 6);
  sun.target.position.set(10, 0, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -17,
    right: 17,
    top: 17,
    bottom: -17,
    near: 0.1,
    far: 50,
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const root = new THREE.Group();
  scene.add(root);
  const place = (
    g: THREE.Group,
    x: number,
    z: number,
    rotation = 0,
    scale = 1,
  ) => {
    g.position.set(x, 0, z);
    g.rotation.y = rotation;
    g.scale.setScalar(scale);
    root.add(g);
    return g;
  };
  const patch = (points: number[][], color: number, y: number) => {
    const s = new THREE.Shape();
    points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    s.closePath();
    const geo = new THREE.ShapeGeometry(s);
    kit.extra.push(geo);
    const mesh = new THREE.Mesh(geo, kit.material(color));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  const outline = [
    [0, 3],
    [2, 0],
    [10, -0.4],
    [18, 1],
    [21, 5],
    [22, 14],
    [20, 20],
    [12, 22],
    [3, 21],
    [-0.5, 15],
  ];
  const islandShape = new THREE.Shape();
  outline.forEach(([x, z], i) =>
    i ? islandShape.lineTo(x, -z) : islandShape.moveTo(x, -z),
  );
  islandShape.closePath();
  const islandGeo = new THREE.ExtrudeGeometry(islandShape, {
    depth: 0.85,
    bevelEnabled: false,
  });
  kit.extra.push(islandGeo);
  const island = new THREE.Mesh(islandGeo, [
    kit.material(0x8b9c61),
    kit.material(0x947c58),
  ]);
  island.rotation.x = -Math.PI / 2;
  island.position.y = -0.85;
  island.receiveShadow = true;
  island.castShadow = true;
  root.add(island);
  // Soft irregular color patches, no tile grid.
  patch(
    [
      [3, 6],
      [8, 4],
      [13, 5],
      [16, 10],
      [10, 13],
      [5, 11],
    ],
    0x91a56a,
    0.007,
  );
  patch(
    [
      [8, 14],
      [15, 12],
      [20, 15],
      [17, 20],
      [9, 21],
      [5, 18],
    ],
    0x95a56a,
    0.008,
  );
  patch(
    [
      [2, 15],
      [4, 14],
      [5, 18],
      [3, 21],
      [1, 19],
    ],
    0x809765,
    0.009,
  );
  patch(
    [
      [9.1, 11],
      [10.4, 11],
      [11.1, 14],
      [13.1, 16],
      [13.8, 19],
      [12.8, 20.4],
      [11.6, 17],
      [9.7, 15],
      [8.5, 14.2],
      [5.7, 15],
      [4.8, 14.3],
      [8.1, 13],
      [9.2, 12.2],
    ],
    0xc1aa7a,
    0.019,
  );
  // A little stream and wooden crossing at the edge of the clearing.
  patch(
    [
      [1.5, 2],
      [2.3, 1.5],
      [3.2, 5],
      [2.9, 8],
      [3.6, 12],
      [2.8, 15],
      [3.1, 19],
      [2.4, 21],
      [1.7, 20],
      [2, 16],
      [2.4, 12],
      [1.9, 8],
      [2.1, 5],
    ],
    0x608b8c,
    0.024,
  );
  const bridge = new THREE.Group();
  for (let i = 0; i < 9; i++)
    kit.block(bridge, 0xb59a68, 0, 0.2, -0.8 + i * 0.2, 2.3, 0.13, 0.18);
  for (const x of [-1.05, 1.05])
    for (const z of [-0.75, 0.75])
      kit.pole(bridge, 0x846848, x, 0.54, z, 0.075, 0.94);
  for (const z of [-0.75, 0.75])
    kit.block(bridge, 0x93764d, 0, 0.94, z, 2.3, 0.1, 0.1);
  place(bridge, 2.5, 14.3);
  place(createHouse(kit), 10, 9.6);
  world.crops.forEach((crop, i) =>
    place(createCropPlot(kit, i), crop.x, crop.y),
  );
  Object.values(world.players).forEach((p, i) =>
    place(
      createFarmer(i === 0 ? 0xbd704d : 0x638d8b, kit),
      p.x,
      p.y,
      i === 0 ? 0.3 : -0.25,
      1.13,
    ),
  );
  const forest: [[number, number, number], ...[number, number, number][]] = [
    [5, 5, 0],
    [7, 3, 1],
    [13, 3.8, 2],
    [16, 6, 1],
    [18, 10, 0],
    [17, 16, 2],
    [4.5, 9.4, 1],
    [5.0, 19.3, 0],
  ];
  forest.forEach(([x, z, v], i) =>
    place(createTree(kit, v), x, z, 0.35 * i, i % 3 === 0 ? 1.1 : 1),
  );
  for (const [x, z] of [
    [17, 4],
    [19.2, 7],
    [15.6, 2.8],
    [3.6, 3.2],
    [19, 17.4],
  ])
    place(createPine(kit), x, z, 0, 0.9);
  place(createWorkbench(kit), 14.1, 12.5, 0.25);
  place(createBarrel(kit), 12.85, 11.15);
  place(createBarrel(kit), 13.6, 11.4, 0, 0.8);
  // A wood store, a bench and original small props around the cottage.
  const shed = new THREE.Group();
  for (const x of [-0.9, 0.9])
    for (const z of [-0.4, 0.4])
      kit.pole(shed, 0x796041, x, 0.72, z, 0.07, 1.4);
  kit.block(shed, 0x977d51, 0, 1.42, 0, 2.2, 0.13, 1.3);
  for (let i = 0; i < 8; i++) {
    const log = kit.pole(
      shed,
      0x8a6f42,
      -0.75 + (i % 4) * 0.5,
      0.22 + Math.floor(i / 4) * 0.33,
      0,
      0.16,
      0.95,
    );
    log.rotation.x = Math.PI / 2;
  }
  place(shed, 14.4, 9.9);
  const bench = new THREE.Group();
  kit.block(bench, 0xb29562, 0, 0.43, 0, 1.6, 0.12, 0.45);
  for (const x of [-0.62, 0.62])
    kit.block(bench, 0x795c3c, x, 0.23, 0, 0.12, 0.46, 0.36);
  place(bench, 7.3, 11.65, -0.15);
  for (const [x, z, r] of [
    [5, 17.2, 0.3],
    [11.1, 16.1, 0.18],
    [14.8, 16.5, 0.3],
    [4.2, 7.8, 0.5],
    [16.8, 12.5, 0.38],
    [2.8, 6.5, 0.28],
    [3.4, 18, 0.4],
    [12.4, 5.6, 0.45],
    [17.2, 18.8, 0.5],
  ]) {
    const rock = new THREE.Group();
    kit.orb(rock, 0x929481, 0, r * 0.45, 0, r, r * 0.7, r * 0.85);
    place(rock, x, z, 0.5);
  }
  // Fence sections leave a broad entrance in front of the garden.
  for (const [x, z, rot] of [
    [6.5, 19.1, 0],
    [8.5, 19.1, 0],
    [13.8, 19.1, 0],
    [15.8, 19.1, 0],
    [16.8, 18.1, Math.PI / 2],
    [16.8, 16.1, Math.PI / 2],
    [16.8, 14.1, Math.PI / 2],
    [4.3, 16.8, Math.PI / 2],
    [4.3, 18.8, Math.PI / 2],
  ])
    place(createFence(kit), x, z, rot);
  // Grouped grass tufts and blossoms form the edge of the clearing.
  for (let i = 0; i < 60; i++) {
    const x = 3.8 + ((i * 7.37) % 15.5),
      z = 3 + ((i * 11.29) % 17.4);
    if (x > 5 && x < 15.5 && z > 7 && z < 18.7) continue;
    const tuft = new THREE.Group();
    for (const d of [-0.09, 0.09]) {
      const blade = kit.mesh(
        tuft,
        kit.cone,
        0x68864d,
        d,
        0.16,
        0,
        0.06,
        0.33,
        0.07,
      );
      blade.rotation.z = d * 2;
    }
    if (i % 3 === 0)
      kit.orb(
        tuft,
        i % 2 ? 0xe2bc6b : 0xe7d5a4,
        0,
        0.32,
        0.06,
        0.055,
        0.045,
        0.055,
      );
    place(tuft, x, z, i * 0.7);
  }
  // Small flat stepping stones lead into the porch.
  for (let i = 0; i < 5; i++) {
    const stone = new THREE.Group();
    kit.orb(stone, 0xd0c4a0, 0, 0.025, 0, 0.28, 0.035, 0.2);
    place(stone, 10.0 + (i % 2) * 0.15, 12.8 + i * 0.55, i * 0.4);
  }
  const shadowGeo = new THREE.PlaneGeometry(200, 200);
  kit.extra.push(shadowGeo);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.1 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.88;
  shadow.receiveShadow = true;
  scene.add(shadow);
  let disposed = false;
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth),
      height = Math.max(1, container.clientHeight),
      aspect = width / height;
    const halfHeight = Math.max(9.2, 11.7 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.render(scene, camera);
    renderer.domElement.dataset.ready = "true";
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const lose = (e: Event) => {
    e.preventDefault();
    container.dispatchEvent(new CustomEvent("visual-context-lost"));
  };
  renderer.domElement.addEventListener("webglcontextlost", lose);
  return {
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lose);
      kit.dispose();
      shadowMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    },
  };
}
