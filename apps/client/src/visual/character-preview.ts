import * as THREE from "three";
import { createMaleAsset } from "./male-asset.js";
import { animateFarmer, equipCharacterPistol, ModelKit } from "./models.js";
import type { VisualScene } from "./scene.js";

export function createCharacterPreview(container: HTMLElement): VisualScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeee5d5);
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 80);
  camera.position.set(6, 4.4, 11);
  camera.lookAt(0, 1.85, 0);
  const asset = createMaleAsset();
  scene.add(asset.group);
  const kit = new ModelKit();
  const pistol = equipCharacterPistol(asset.group, kit);
  pistol.visible = false;
  asset.group.rotation.y = -0.15;
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xeee5d5,
    roughness: 1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const sun = new THREE.DirectionalLight(0xffe0b7, 3.2);
  sun.position.set(-4, 7, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -4,
    right: 4,
    top: 5,
    bottom: -5,
    near: 0.1,
    far: 30,
  });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  scene.add(sun, new THREE.HemisphereLight(0xfff1dc, 0xa39b89, 2));
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(4, 5, -4);
  scene.add(rim);
  const toolbar = document.createElement("div");
  toolbar.className = "character-toolbar";
  const front = document.createElement("button");
  front.textContent = "Ver frente";
  const back = document.createElement("button");
  back.textContent = "Ver espalda";
  toolbar.append(front, back);
  type Motion = "idle" | "walk" | "aim" | "dodge";
  let motion: Motion = "idle",
    frame = 0,
    previousTime = 0,
    elapsed = 0;
  const motionButtons: HTMLButtonElement[] = [];
  for (const [value, label] of [
    ["idle", "Reposo"],
    ["walk", "Caminar"],
    ["aim", "Apuntar"],
    ["dodge", "Esquivar"],
  ] as const) {
    const button = document.createElement("button");
    button.textContent = label;
    button.dataset.motion = value;
    button.setAttribute("aria-pressed", String(value === motion));
    motionButtons.push(button);
    toolbar.append(button);
  }
  const chooseMotion = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-motion]",
    );
    if (!button) return;
    motion = button.dataset.motion as Motion;
    elapsed = 0;
    motionButtons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b === button)),
    );
  };
  toolbar.addEventListener("click", chooseMotion);
  let disposed = false,
    observer: ResizeObserver | undefined;
  const lost = (event: Event) => {
    event.preventDefault();
    dispose();
    container.dispatchEvent(new CustomEvent("visual-context-lost"));
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    front.removeEventListener("click", showFront);
    back.removeEventListener("click", showBack);
    toolbar.removeEventListener("click", chooseMotion);
    toolbar.remove();
    asset.dispose();
    kit.dispose();
    floorGeo.dispose();
    floorMat.dispose();
    sun.shadow.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    scene.clear();
  };
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth),
      height = Math.max(1, container.clientHeight),
      aspect = width / height;
    const half = Math.max(2.85, 1.85 / aspect);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
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
  const showFront = () => {
    asset.group.rotation.y = -0.15;
    renderer.domElement.dataset.view = "front";
    safeResize();
  };
  const showBack = () => {
    asset.group.rotation.y = Math.PI - 0.15;
    renderer.domElement.dataset.view = "back";
    safeResize();
  };
  const loop = (time: number) => {
    if (disposed) return;
    frame = requestAnimationFrame(loop);
    if (document.hidden) {
      previousTime = time;
      return;
    }
    if (previousTime && time - previousTime < 33) return;
    const dt = previousTime
      ? Math.min((time - previousTime) / 1000, 0.1)
      : 1 / 30;
    previousTime = time;
    elapsed += dt;
    try {
      pistol.visible = motion === "aim";
      const dodging = motion === "dodge" && elapsed % 2.2 < 0.25;
      animateFarmer(
        asset.group,
        motion === "walk" ? dt * 2.5 : dodging ? dt * 5 : 0,
        asset.group.rotation.y,
        dt,
        undefined,
        { aiming: motion === "aim", dodging },
      );
      renderer.domElement.dataset.animation = motion;
      renderer.domElement.dataset.knee = asset.group
        .getObjectByName("left-knee")!
        .rotation.x.toFixed(3);
      renderer.render(scene, camera);
    } catch {
      dispose();
      container.dispatchEvent(new CustomEvent("visual-context-lost"));
    }
  };
  try {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.append(renderer.domElement);
    document.body.append(toolbar);
    renderer.domElement.dataset.view = "front";
    resize();
    observer = new ResizeObserver(safeResize);
    observer.observe(container);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    front.addEventListener("click", showFront);
    back.addEventListener("click", showBack);
    frame = requestAnimationFrame(loop);
    return { resize: safeResize, dispose, walk() {} };
  } catch (error) {
    dispose();
    throw error;
  }
}
