import { createWorld, addPlayer } from "../../../packages/shared/src/world.js";
import { createVisualScene, type VisualScene } from "./visual/scene.js";
import "./visual/visual.css";
declare global {
  interface Window {
    astraVisual?: {
      worldUnchanged: boolean;
      disposed(): boolean;
      dispose(): void;
    };
  }
}
const container = document.getElementById("visual-scene")!,
  world = createWorld("visual-preview");
addPlayer(world, "ana", "Ana");
addPlayer(world, "bea", "Bea");
Object.assign(world.players.ana, { x: 9.9, y: 13.9 });
Object.assign(world.players.bea, { x: 11.15, y: 14.0 });
world.crops.forEach((crop, i) =>
  Object.assign(crop, {
    x: 6.5 + (i % 2) * 1.8,
    y: 14.6 + Math.floor(i / 2) * 2.4,
    stage: "ready",
    watered: true,
  }),
);
const before = JSON.stringify(world);
let scene: VisualScene | undefined,
  disposed = false;
const dispose = () => {
  scene?.dispose();
  disposed = true;
  window.removeEventListener("pagehide", dispose);
  container.removeEventListener("visual-context-lost", lost);
};
const error = () => {
  const box = document.createElement("section");
  box.className = "visual-error";
  box.setAttribute("role", "alert");
  box.innerHTML =
    '<h1>No se pudo mostrar la granja en 3D</h1><p>Esta muestra necesita WebGL. Prueba un navegador actualizado con aceleración gráfica habilitada.</p><a href="/">Volver al juego actual</a>';
  container.replaceChildren(box);
};
const lost = () => {
  dispose();
  error();
};
try {
  scene = createVisualScene(container, world);
  container.addEventListener("visual-context-lost", lost);
  window.addEventListener("pagehide", dispose, { once: true });
  if ((import.meta as unknown as { env: { MODE: string } }).env.MODE === "test")
    window.astraVisual = {
      worldUnchanged: before === JSON.stringify(world),
      disposed: () => disposed,
      dispose,
    };
} catch {
  dispose();
  error();
}
