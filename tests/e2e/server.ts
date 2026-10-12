import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../apps/server/src/store.js";
import { startServer } from "../../apps/server/src/index.js";
const dir = mkdtempSync(join(tmpdir(), "astra-browser-"));
const store = openStore(join(dir, "farm.sqlite"));
const save = store.saveWorld.bind(store);
store.saveWorld = (world) => {
  if (
    world.timeMs === 0 &&
    Object.values(world.players).some((p) => p.name === "Defensa") &&
    world.remainingMs === 600000
  ) {
    world.remainingMs = 1500;
    const player = Object.values(world.players)[0];
    player.hp = 1;
    player.invulnerable = 0;
    player.gunLevel = 2;
  }
  save(world);
};
const server = await startServer({ store, port: 3001 });
const stop = async () => {
  await server.stop();
  store.close();
  rmSync(dir, { recursive: true, force: true });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
