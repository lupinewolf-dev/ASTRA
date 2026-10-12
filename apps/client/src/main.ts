import Phaser from "phaser";
import { renderAccount } from "./account.js";
import { Connection, type User } from "./api.js";
import { InputState } from "./input.js";
import { createHud } from "./hud.js";
import { GameScene } from "./GameScene.js";
import "./style.css";
import "./testBridge.js";
const root = document.getElementById("app")!;
let game: Phaser.Game | undefined;
async function start(user: User) {
  if (!user.worldId) return;
  const conn = new Connection();
  await conn.join(user.worldId);
  const controls = new InputState();
  controls.connected = conn.connected;
  game?.destroy(true);
  const ui = createHud(root, user, conn, controls);
  conn.onWorld = (w) => ui.render(w);
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-canvas",
    backgroundColor: "#253e32",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    input: { activePointers: 3 },
    scene: new GameScene(conn, user, controls, ui),
    render: { antialias: true },
    audio: { noAudio: true },
  });
  if (
    (import.meta as unknown as { env: { MODE: string } }).env.MODE === "test"
  ) {
    window.astraTest = {
      world: () => conn.world,
      playerId: user.id,
      screenPoint: (x, y) => {
        const iso = { x: (x - y) * 32, y: (x + y) * 16 };
        const camera = game!.scene.getScene("farm").cameras.main;
        return {
          x:
            (iso.x - camera.scrollX - camera.width / 2) * camera.zoom +
            camera.width / 2,
          y: iso.y - camera.scrollY,
        };
      },
    };
  }
  if (conn.world) ui.render(conn.world);
  window.addEventListener(
    "pagehide",
    () => {
      void conn.leave();
      ui.destroy();
    },
    { once: true },
  );
}
renderAccount(root, start);
