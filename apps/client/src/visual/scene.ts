import { batchStatic } from "./batch-static.js";
import { LocalFarmGame } from "./local-game.js";
import {
  TERRAIN_OUTLINE,
  TREE_POSITIONS,
  DECOR_FENCES,
  EASTERN_SITES,
  MAP_CENTER,
} from "./play-map.js";
import { createMaleAsset } from "./male-asset.js";
import * as THREE from "three";
import type { World } from "../../../../packages/shared/src/types.js";
import {
  ModelKit,
  createHouse,
  createTree,
  createPine,
  createFarmer,
  animateFarmer,
  equipCharacterPistol,
  equipCharacterAxe,
  createCropPlot,
  createFence,
  createWorkbench,
  createBarrel,
} from "./models.js";
export interface VisualScene {
  aim?(x: number, y: number, firing: boolean): void;
  aimAt?(x: number, y: number): void;
  shoot?(): boolean;
  melee?(): boolean;
  toggleMap?(): void;
  walk(x: number, y: number, seconds: number): void;
  resize(): void;
  dispose(): void;
}
export function createVisualScene(
  container: HTMLElement,
  world: World,
  game?: LocalFarmGame,
  onUpdate?: () => void,
): VisualScene {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  const scene = new THREE.Scene(),
    kit = new ModelKit(),
    sun = new THREE.DirectionalLight(0xffd89d, 3.0),
    shadowMat = new THREE.ShadowMaterial({ opacity: 0.1 });
  const ownedInstances: THREE.InstancedMesh[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const characterAssets: ReturnType<typeof createMaleAsset>[] = [];
  let frame = 0,
    lastTime = 0,
    overview = false;
  const focus = new THREE.Vector2(
    game?.player.x ?? 9.8,
    game?.player.y ?? 11.8,
  );
  let disposed = false,
    observer: ResizeObserver | undefined;
  const lose = (event: Event) => {
    event.preventDefault();
    container.dispatchEvent(new CustomEvent("visual-context-lost"));
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    renderer.domElement.removeEventListener("webglcontextlost", lose);
    ownedInstances.forEach((instance) => instance.dispose());
    ownedMaterials.forEach((material) => material.dispose());
    sun.shadow.dispose();
    characterAssets.forEach((asset) => asset.dispose());
    kit.dispose();
    shadowMat.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    scene.clear();
  };
  try {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.append(renderer.domElement);
    const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 120);
    camera.position.set(30, 27, 35);
    camera.lookAt(9.8, 1, 11.8);
    scene.add(new THREE.HemisphereLight(0xffedc9, 0x597455, 2.0));
    sun.position.set(-3, 19, 6);
    sun.target.position.set(22, 0, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -26,
      right: 26,
      top: 26,
      bottom: -26,
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
      const curve = new THREE.CatmullRomCurve3(
        points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
        true,
        "centripetal",
      );
      curve
        .getPoints(80)
        .forEach((p, i) => (i ? s.lineTo(p.x, -p.z) : s.moveTo(p.x, -p.z)));
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
    const outline = TERRAIN_OUTLINE;
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
        [3.8, 18.8],
        [4.1, 20.4],
        [3.4, 20.2],
        [2.6, 17],
        [2.4, 12],
        [1.9, 8],
        [2.1, 5],
      ].map(([x, z]) => [x + 1, z]),
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
    place(bridge, 3.5, 14.3);
    place(createHouse(kit), 10, 9.6);
    const cropVisuals = world.crops.map((crop, i) => {
      const plot = place(createCropPlot(kit, i), crop.x, crop.y);
      const plants = new THREE.Group();
      const meshes = plot.children.slice(5);
      plot.add(plants);
      meshes.forEach((part) => plants.add(part));
      plants.visible = crop.stage !== "empty";
      if (game) ownedInstances.push(...batchStatic(plants));
      return { plot, plants, soil: plot.children[0] as THREE.Mesh };
    });
    const farmers = Object.values(world.players).map((p, i) => {
      if (i === 0) {
        const asset = createMaleAsset();
        characterAssets.push(asset);
        return place(asset.group, p.x, p.y, 0.3, 0.66);
      }
      return place(
        createFarmer(0x638d8b, kit, "feminine"),
        p.x,
        p.y,
        -0.25,
        1.13,
      );
    });
    renderer.domElement.dataset.characterModel = "male-cartoon-sculpt";
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
    // Small farm props outside the walking yard, sharing the scene geometry pool.
    const mailbox = new THREE.Group();
    kit.pole(mailbox, 0x806747, 0, 0.55, 0, 0.09, 1.1);
    kit.mesh(mailbox, kit.roundedBox, 0x6c8e88, 0, 1.15, 0, 0.65, 0.46, 0.8);
    kit.block(mailbox, 0xc3a16b, 0, 1.02, 0.42, 0.48, 0.04, 0.03);
    kit.block(mailbox, 0xb76d4c, 0.39, 1.28, 0.05, 0.035, 0.35, 0.23);
    place(mailbox, 14.5, 17.4, -0.35);
    const lamp = new THREE.Group();
    kit.pole(lamp, 0x796747, 0, 1.0, 0, 0.065, 2.0);
    kit.block(lamp, 0x665d40, 0.22, 1.98, 0, 0.55, 0.07, 0.08);
    kit.mesh(lamp, kit.roundedBox, 0xe2ba6e, 0.43, 1.77, 0, 0.25, 0.36, 0.25);
    for (const y of [1.55, 1.98])
      kit.block(lamp, 0x56665d, 0.43, y, 0, 0.34, 0.075, 0.34);
    place(lamp, 13.8, 15.2);
    for (const [x, z] of [
      [5.1, 12.8],
      [4.1, 17.1],
      [15.8, 14.2],
      [16.1, 18.1],
      [3.7, 10.5],
      [18.2, 13.3],
    ]) {
      const flowers = new THREE.Group();
      kit.orb(flowers, 0x698b52, 0, 0.22, 0, 0.5, 0.3, 0.42);
      for (let i = 0; i < 3; i++) {
        const fx = (i - 1) * 0.25,
          fz = (i % 2) * 0.24,
          fy = 0.47 + (i % 2) * 0.1;
        kit.pole(flowers, 0x68834b, fx, fy / 2, fz, 0.018, fy);
        for (let j = 0; j < 5; j++) {
          const angle = (j / 5) * Math.PI * 2;
          kit.mesh(
            flowers,
            kit.characterBall,
            i % 2 ? 0xe8c66a : 0xe6d9b3,
            fx + Math.cos(angle) * 0.08,
            fy,
            fz + Math.sin(angle) * 0.08,
            0.07,
            0.03,
            0.07,
          ).castShadow = false;
        }
        kit.orb(flowers, 0xc99d54, fx, fy + 0.02, fz, 0.045, 0.035, 0.045);
      }
      place(flowers, x, z, 0, 0.9);
    }
    for (let i = 0; i < 7; i++) {
      const stone = new THREE.Group();
      kit.mesh(
        stone,
        kit.roundedBox,
        i % 2 ? 0xbfae84 : 0xddd0a2,
        0,
        0.035,
        0,
        0.48,
        0.07,
        0.34,
      );
      place(stone, 10.4 + Math.sin(i * 0.8) * 0.7, 15.1 + i * 0.5, i * 0.6);
    }
    place(createWorkbench(kit), 10, 12, 0.25);
    place(createBarrel(kit), 12.85, 11.15);
    place(createBarrel(kit), 13.6, 11.4, 0, 0.8);
    for (const [x, z] of TREE_POSITIONS.slice(8, 12)) {
      const tree = createTree(kit, 1);
      for (let i = 0; i < 5; i++)
        kit.orb(
          tree,
          0xc5824f,
          Math.cos(i * 1.5) * 1.0,
          2.85 + Math.sin(i) * 0.2,
          Math.sin(i * 1.5) * 1.0,
          0.15,
          0.15,
          0.15,
        );
      place(tree, x, z, 0, 0.85);
    }
    patch(
      [
        [19, 4],
        [27, 4],
        [28, 12],
        [25, 17],
        [20, 13],
      ],
      0x88a56e,
      0.012,
    );
    patch(
      [
        [19.8, 15],
        [23, 15],
        [23.5, 20.5],
        [20, 21],
      ],
      0xa4ad76,
      0.014,
    );
    // Eastern meadow: a winding route from the old camp to a small outpost.
    patch(
      [
        [27, 4],
        [34, 2],
        [42, 4],
        [43, 13],
        [37, 16],
        [30, 12],
      ],
      0x8fa76d,
      0.011,
    );
    patch(
      [
        [29, 16],
        [37, 13],
        [43, 18],
        [41, 26],
        [33, 27],
        [27, 23],
      ],
      0xa4b47a,
      0.012,
    );
    patch(
      [
        [24, 23],
        [28, 21],
        [33, 21],
        [39, 20],
        [42, 21],
        [39, 22.2],
        [33, 22.6],
        [28, 23.3],
      ],
      0xc9af7b,
      0.023,
    );
    for (const [x, z] of TREE_POSITIONS.slice(12)) {
      const tree =
        Math.round(x + z) % 3 === 0 ? createPine(kit) : createTree(kit);
      place(tree, x, z, (x + z) * 0.17, 0.72 + ((x * 7 + z) % 4) * 0.055);
    }
    const cache = new THREE.Group();
    kit.block(cache, 0x755d40, 0, 0.34, 0, 1.15, 0.67, 0.8);
    kit.block(cache, 0xa88b5b, 0, 0.72, 0, 1.2, 0.12, 0.86);
    for (const x of [-0.38, 0.38])
      kit.block(cache, 0x59644e, x, 0.42, 0.42, 0.09, 0.7, 0.06);
    place(cache, EASTERN_SITES.cache.x, EASTERN_SITES.cache.y, 0.18);
    const well = new THREE.Group();
    kit.pole(well, 0x93988d, 0, 0.27, 0, 0.55, 0.54);
    kit.pole(well, 0x9cb8ab, 0, 0.56, 0, 0.43, 0.035);
    for (const x of [-0.5, 0.5]) kit.pole(well, 0x846b49, x, 1.1, 0, 0.08, 1.4);
    kit.block(well, 0x9a7850, 0, 1.78, 0, 1.34, 0.13, 0.9);
    place(well, EASTERN_SITES.well.x, EASTERN_SITES.well.y);
    const sign = new THREE.Group();
    kit.pole(sign, 0x806341, 0, 0.72, 0, 0.08, 1.42);
    kit.block(sign, 0xba9b65, 0, 1.32, 0.04, 1.1, 0.4, 0.12);
    place(sign, EASTERN_SITES.sign.x, EASTERN_SITES.sign.y, 0.28);
    patch(
      [
        [13.2, 19],
        [20, 22],
        [24, 22],
        [25, 24],
        [21, 24],
        [13, 20.3],
      ],
      0xc1aa7a,
      0.021,
    );
    const camp = new THREE.Group();
    const tentGeo = new THREE.ConeGeometry(1, 1.6, 3);
    kit.extra.push(tentGeo);
    kit.mesh(camp, tentGeo, 0x7d998b, 0, 0.8, 0, 1.25, 1, 1.5).rotation.y =
      Math.PI / 2;
    kit.block(camp, 0xb99465, 0, 0.06, 0.1, 2.7, 0.12, 2.2);
    place(camp, 25.5, 23.3, 0.15);
    if (game)
      for (const node of world.nodes.filter((n) => n.kind !== "wood")) {
        const prop = new THREE.Group();
        if (node.kind === "stone") {
          kit.orb(prop, 0x94988b, 0, 0.3, 0, 0.58, 0.47, 0.56);
          kit.orb(prop, 0xaeb09c, 0.4, 0.16, 0.15, 0.28, 0.24, 0.33);
        } else {
          kit.mesh(prop, kit.roundedBox, 0xae885b, 0, 0.35, 0, 0.85, 0.7, 0.75);
          for (const x of [-0.25, 0.25])
            kit.block(prop, 0x65746a, x, 0.37, 0.4, 0.055, 0.64, 0.03);
          kit.block(prop, 0xf0d6a0, 0, 0.73, 0, 0.65, 0.035, 0.58);
        }
        place(prop, node.x, node.y);
      }
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
    const fenceVisuals = new Map<string, THREE.Group>();
    if (game)
      for (const fence of world.fences) {
        const index = Number(fence.id.split("-")[1]);
        fenceVisuals.set(
          fence.id,
          place(
            createFence(kit, 1),
            fence.x,
            fence.y,
            DECOR_FENCES[index]?.[2] ?? 0,
          ),
        );
      }
    else
      for (const [x, z, rot] of DECOR_FENCES)
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
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.88;
    shadow.receiveShadow = true;
    scene.add(shadow);
    if (game)
      ownedInstances.push(
        ...batchStatic(
          root,
          new Set<THREE.Object3D>([
            ...farmers,
            ...cropVisuals.map((c) => c.plot),
            ...fenceVisuals.values(),
          ]),
        ),
      );
    const resize = () => {
      if (disposed) return;
      const width = Math.max(1, container.clientWidth),
        height = Math.max(1, container.clientHeight),
        aspect = width / height;
      const halfHeight = game
        ? overview
          ? Math.max(18.5, 24 / aspect)
          : Math.max(5.8, 4.1 / aspect)
        : Math.max(9.2, 11.7 / aspect);
      if (game) {
        const x = focus.x,
          z = focus.y;
        camera.position.set(x + 20.2, 27, z + 23.2);
        camera.lookAt(x, 1, z);
      }
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
      renderer.domElement.dataset.ready = "true";
    };
    const safeResize = () => {
      try {
        resize();
      } catch {
        dispose();
        container.dispatchEvent(new CustomEvent("visual-context-lost"));
      }
    };
    resize();
    observer = new ResizeObserver(safeResize);
    observer.observe(container);
    renderer.domElement.addEventListener("webglcontextlost", lose);
    const player = farmers[0];
    const publish = () => {
      renderer.domElement.dataset.playerX = player.position.x.toFixed(3);
      renderer.domElement.dataset.playerZ = player.position.z.toFixed(3);
      renderer.domElement.dataset.gait = player
        .getObjectByName("left-leg")!
        .rotation.x.toFixed(3);
    };
    publish();
    const walk = (x: number, y: number, seconds: number) => {
      if (disposed || !player) return;
      if (game) {
        const length = Math.max(1, Math.hypot(x, y));
        game.move((x * 0.8 + y * 0.6) / length, (-x * 0.6 + y * 0.8) / length);
        return;
      }
      const previousX = player.position.x,
        previousZ = player.position.z;
      const length = Math.max(1, Math.hypot(x, y));
      // Camera-aligned input: right follows screen right, up follows screen up.
      const dx = (x * 0.8 + y * 0.6) / length;
      const dz = (-x * 0.6 + y * 0.8) / length;
      const distance = Math.min(seconds, 0.05) * 3.2;
      // This checkpoint keeps walking in the clear yard in front of the house.
      player.position.x = THREE.MathUtils.clamp(
        player.position.x + dx * distance,
        9,
        12.8,
      );
      player.position.z = THREE.MathUtils.clamp(
        player.position.z + dz * distance,
        13,
        18,
      );
      animateFarmer(
        player,
        Math.hypot(
          player.position.x - previousX,
          player.position.z - previousZ,
        ),
        Math.atan2(dx, dz),
        seconds,
      );
      publish();
      try {
        renderer.render(scene, camera);
      } catch {
        dispose();
        container.dispatchEvent(new CustomEvent("visual-context-lost"));
      }
    };
    if (!game) return { walk, resize: safeResize, dispose };
    equipCharacterPistol(player, kit);
    equipCharacterAxe(player, kit);
    const enemyVisuals = new Map<string, THREE.Group>(),
      bagVisuals = new Map<string, THREE.Group>();
    const beam = kit.mesh(
      root,
      kit.cylinder,
      0xe5c478,
      0,
      0,
      0,
      0.025,
      1,
      0.025,
    );
    beam.visible = false;
    const aimLine = kit.mesh(
      root,
      kit.cylinder,
      0xf2df9c,
      0,
      0,
      0,
      0.015,
      1.7,
      0.015,
    );
    aimLine.visible = false;
    const up = new THREE.Vector3(0, 1, 0);
    const markerGeo = new THREE.RingGeometry(0.31, 0.36, 24);
    kit.extra.push(markerGeo);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xf1e5ba,
      depthTest: false,
      transparent: true,
      opacity: 0.6,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = -Math.PI / 2;
    marker.renderOrder = 10;
    root.add(marker);
    ownedMaterials.push(markerMat);
    const playDispose = dispose;
    const raycaster = new THREE.Raycaster(),
      ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      point = new THREE.Vector3();
    let mousePosition: { x: number; y: number } | undefined;
    const aim = (x: number, y: number, firing: boolean) => {
      mousePosition = undefined;
      game.aim(x * 0.8 + y * 0.6, -x * 0.6 + y * 0.8, firing);
    };
    const aimAt = (x: number, y: number) => {
      if (game.paused) return;
      mousePosition = { x, y };
      const box = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((x - box.x) / box.width) * 2 - 1,
          -((y - box.y) / box.height) * 2 + 1,
        ),
        camera,
      );
      if (raycaster.ray.intersectPlane(ground, point))
        game.aim(point.x - game.player.x, point.z - game.player.y, true);
    };
    const update = (dt: number) => {
      const previousX = player.position.x,
        previousZ = player.position.z;
      if (mousePosition) aimAt(mousePosition.x, mousePosition.y);
      game.tick(dt * 1000);
      player.position.set(game.player.x, 0, game.player.y);
      const movement = {
        x: player.position.x - previousX,
        y: player.position.z - previousZ,
      };
      animateFarmer(
        player,
        Math.hypot(movement.x, movement.y),
        game.aiming
          ? Math.atan2(game.player.aim.x, game.player.aim.y)
          : Math.atan2(movement.x, movement.y),
        dt,
        game.aiming || Math.hypot(movement.x, movement.y)
          ? movement
          : undefined,
        {
          aiming: game.aiming,
          dodging: game.dodging,
          melee: game.swinging,
          recoil: game.player.firing
            ? Math.max(0, (game.player.cooldown - 310) / 140)
            : 0,
        },
      );
      markerMat.color.setHex(
        game.dodging
          ? 0xf8ce77
          : game.player.invulnerable > 0
            ? 0xa6e4dc
            : 0xf1e5ba,
      );
      marker.scale.setScalar(game.dodging ? 1.45 : 1);
      cropVisuals.forEach(({ plants, soil }, i) => {
        const crop = world.crops[i];
        plants.visible = crop.stage !== "empty";
        plants.scale.setScalar(
          crop.stage === "ready"
            ? 1
            : 0.4 + 0.6 * Math.min(1, crop.growth / 45000),
        );
        soil.material = kit.material(crop.watered ? 0x594633 : 0x70563a);
      });
      for (const [id, model] of fenceVisuals)
        if (!world.fences.some((f) => f.id === id)) {
          root.remove(model);
          model.clear();
          fenceVisuals.delete(id);
        }
      for (const [id, model] of enemyVisuals)
        if (!world.zombies.some((z) => z.id === id)) {
          root.remove(model);
          model.clear();
          enemyVisuals.delete(id);
        }
      for (const enemy of world.zombies) {
        let model = enemyVisuals.get(enemy.id);
        if (!model) {
          model = new THREE.Group();
          for (const x of [-0.14, 0.14]) {
            const leg = kit.block(
              model,
              0x596856,
              x,
              0.26,
              0,
              0.19,
              0.44,
              0.24,
            );
            leg.name = x < 0 ? "left-leg" : "right-leg";
            kit.block(model, 0x536552, x * 2.5, 0.88, 0.23, 0.14, 0.18, 0.5);
          }
          const profile = game.profileFor(enemy.id);
          const torso = kit.orb(
            model,
            profile.kind === "runner"
              ? 0xb77e4e
              : profile.kind === "armored"
                ? 0x737e88
                : 0x677e72,
            0,
            0.79,
            0,
            0.33,
            0.4,
            0.23,
          );
          torso.name = "torso";
          model.userData.torsoMaterial = torso.material;
          model.userData.hp = enemy.hp;
          model.userData.hitUntil = 0;
          kit.mesh(
            model,
            kit.characterBall,
            0xa1b48b,
            0,
            1.31,
            0.03,
            0.26,
            0.29,
            0.25,
          );
          for (const x of [-0.09, 0.09])
            kit.orb(model, 0x665a3d, x, 1.34, 0.265, 0.032, 0.038, 0.018);
          if (profile.kind === "armored") {
            kit.block(model, 0xadb5b8, 0, 0.85, 0.22, 0.55, 0.55, 0.12);
            kit.orb(model, 0x737e88, 0, 1.48, 0.03, 0.3, 0.16, 0.28);
          }
          if (profile.kind === "runner") model.scale.set(0.85, 0.92, 0.85);
          const health = new THREE.Group();
          health.name = "health";
          health.position.y = 1.85;
          kit.block(health, 0x423d36, 0, 0, 0, 0.7, 0.07, 0.025);
          const fill = kit.block(
            health,
            0xc68b6a,
            0,
            0,
            0.02,
            0.66,
            0.045,
            0.025,
          );
          fill.name = "fill";
          model.add(health);
          root.add(model);
          enemyVisuals.set(enemy.id, model);
        }
        const walking =
          Math.hypot(model.position.x - enemy.x, model.position.z - enemy.y) >
          0.0001;
        if (enemy.hp < model.userData.hp)
          model.userData.hitUntil = world.timeMs + 160;
        model.userData.hp = enemy.hp;
        const hit = world.timeMs < model.userData.hitUntil;
        (model.getObjectByName("torso") as THREE.Mesh).material = hit
          ? kit.material(0xffe4a9)
          : model.userData.torsoMaterial;
        const stride = walking
          ? Math.sin(
              (world.timeMs / 1000) * game.profileFor(enemy.id).speed * 9,
            ) * 0.35
          : 0;
        model.getObjectByName("left-leg")!.rotation.x = stride;
        model.getObjectByName("right-leg")!.rotation.x = -stride;
        model.position.set(enemy.x, hit ? 0.06 : 0, enemy.y);
        model.rotation.y = Math.atan2(
          game.player.x - enemy.x,
          game.player.y - enemy.y,
        );
        const health = model.getObjectByName("health")!;
        const fill = health.getObjectByName("fill")!;
        const ratio = Math.max(0, enemy.hp / game.profileFor(enemy.id).maxHp);
        fill.scale.x = 0.66 * ratio;
        fill.position.x = -0.33 * (1 - ratio);
        health.quaternion
          .copy(model.quaternion)
          .invert()
          .multiply(camera.quaternion);
      }
      for (const [id, model] of bagVisuals)
        if (!world.backpacks.some((b) => b.id === id)) {
          root.remove(model);
          model.clear();
          bagVisuals.delete(id);
        }
      for (const bag of world.backpacks)
        if (!bagVisuals.has(bag.id)) {
          const model = new THREE.Group();
          kit.mesh(
            model,
            kit.roundedBox,
            0xd0ac6b,
            0,
            0.27,
            0,
            0.4,
            0.54,
            0.25,
          );
          place(model, bag.x, bag.y);
          bagVisuals.set(bag.id, model);
        }
      const shot = world.shots[world.shots.length - 1];
      beam.visible = !!shot && !game.swinging;
      if (shot) {
        const dir = new THREE.Vector3(shot.toX - shot.x, 0, shot.toY - shot.y),
          length = dir.length();
        beam.position.set(
          (shot.x + shot.toX) / 2,
          0.9,
          (shot.y + shot.toY) / 2,
        );
        beam.scale.y = length;
        beam.quaternion.setFromUnitVectors(up, dir.normalize());
      }
      aimLine.visible = game.aiming;
      aimLine.position.set(
        game.player.x + game.player.aim.x * 0.9,
        0.06,
        game.player.y + game.player.aim.y * 0.9,
      );
      if (aimLine.visible)
        aimLine.quaternion.setFromUnitVectors(
          up,
          new THREE.Vector3(
            game.player.aim.x,
            0,
            game.player.aim.y,
          ).normalize(),
        );
      marker.position.set(game.player.x, 0.04, game.player.y);
      publish();
      renderer.domElement.dataset.aiming = String(game.aiming);
      renderer.domElement.dataset.phase = world.phase;
      renderer.domElement.dataset.harvested = String(game.harvested);
      renderer.domElement.dataset.time = String(world.timeMs);
      renderer.domElement.dataset.aimX = game.player.aim.x.toFixed(4);
      renderer.domElement.dataset.aimY = game.player.aim.y.toFixed(4);
      onUpdate?.();
    };
    let lastDrawKey = "";
    const loop = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      if (document.hidden || game.paused) {
        lastTime = time;
        return;
      }
      if (lastTime && time - lastTime < 33) return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0.033;
      lastTime = time;
      try {
        update(dt);
        const target = new THREE.Vector2(
          overview ? MAP_CENTER.x : game.player.x,
          overview ? MAP_CENTER.y : game.player.y,
        );
        if (focus.distanceTo(target) > 6 || focus.distanceTo(target) < 0.001)
          focus.copy(target);
        else focus.lerp(target, 1 - Math.exp(-10 * dt));
        const x = focus.x,
          z = focus.y;
        camera.position.set(x + 20.2, 27, z + 23.2);
        camera.lookAt(x, 1, z);
        const drawKey = [
          game.player.x,
          game.player.y,
          focus.x,
          focus.y,
          player.rotation.y,
          player.userData.poseFrame ?? 0,
          game.dodging,
          game.player.invulnerable > 0,
          game.player.aim.x,
          game.player.aim.y,
          game.aiming,
          player.getObjectByName("left-leg")!.rotation.x,
          ...world.crops.map(
            (c) => `${c.stage}:${c.watered}:${Math.floor(c.growth / 1000)}`,
          ),
          ...world.zombies.map((z) => `${z.x}:${z.y}:${z.hp}`),
          ...Array.from(
            enemyVisuals.values(),
            (model) =>
              `${model.position.y}:${model.getObjectByName("left-leg")!.rotation.x}`,
          ),
          world.fences.length,
          world.backpacks.length,
          world.shots.length,
        ].join("|");
        if (drawKey !== lastDrawKey) {
          renderer.render(scene, camera);
          lastDrawKey = drawKey;
        }
        renderer.domElement.dataset.drawCalls = String(
          renderer.info.render.calls,
        );
      } catch {
        playDispose();
        container.dispatchEvent(new CustomEvent("visual-context-lost"));
      }
    };
    update(0);
    frame = requestAnimationFrame(loop);
    return {
      walk,
      aim,
      aimAt,
      shoot: () => game.shoot(),
      melee: () => game.melee(),
      resize: safeResize,
      dispose: playDispose,
      toggleMap() {
        overview = !overview;
        focus.set(
          overview ? MAP_CENTER.x : game.player.x,
          overview ? MAP_CENTER.y : game.player.y,
        );
        safeResize();
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
