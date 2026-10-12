import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { serverRoot } from "./paths.js";
import type { World, Inventory } from "../../../packages/shared/src/types.js";
function validInventory(x: Inventory) {
  return (
    x &&
    ["wood", "stone", "ammo", "food", "seed"].every(
      (k) =>
        Number.isSafeInteger(x[k as keyof Inventory]) &&
        x[k as keyof Inventory] >= 0,
    )
  );
}
function validateWorld(x: World): World {
  const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
  if (
    !x ||
    x.version !== 1 ||
    typeof x.id !== "string" ||
    !finite(x.timeMs) ||
    !finite(x.remainingMs) ||
    x.remainingMs < 0 ||
    !Number.isSafeInteger(x.serial) ||
    !["tranquil", "normal", "hard"].includes(x.difficulty) ||
    !["tranquil", "normal", "hard"].includes(x.activeDifficulty) ||
    !["wave", "preparation"].includes(x.phase) ||
    !x.players ||
    !x.processed ||
    !validInventory(x.storage) ||
    !["crops", "fences", "zombies", "nodes", "backpacks", "shots"].every((k) =>
      Array.isArray(x[k as keyof World]),
    )
  )
    throw Error("Snapshot inválido o versión no soportada");
  for (const p of Object.values(x.players))
    if (
      !p ||
      typeof p.id !== "string" ||
      !finite(p.x) ||
      !finite(p.y) ||
      !finite(p.hp) ||
      !validInventory(p.inventory) ||
      !p.move ||
      !p.aim ||
      !finite(p.move.x) ||
      !finite(p.move.y) ||
      !finite(p.aim.x) ||
      !finite(p.aim.y)
    )
      throw Error("Snapshot de jugador inválido");
  for (const list of [x.crops, x.fences, x.zombies, x.nodes, x.backpacks])
    for (const e of list)
      if (!e || typeof e.id !== "string" || !finite(e.x) || !finite(e.y))
        throw Error("Snapshot de entidad inválido");
  return x;
}
export class Store {
  readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000;");
    const version = Number(
      this.db.prepare("PRAGMA user_version").get()?.user_version,
    );
    if (version > 1) {
      this.db.close();
      throw Error("Base de datos más nueva que el servidor");
    }
    if (version < 1) {
      if (path !== ":memory:" && existsSync(path))
        copyFileSync(path, `${path}.before-v1.bak`);
      this.db.exec(
        readFileSync(resolve(serverRoot(), "migrations/001.sql"), "utf8"),
      );
    }
    this.db.exec("PRAGMA journal_mode=WAL;");
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  saveWorld(w: World) {
    validateWorld(w);
    this.db
      .prepare(
        "INSERT INTO worlds(id,snapshot) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot",
      )
      .run(w.id, JSON.stringify(w));
  }
  loadWorld(id: string): World | null {
    const row = this.db
      .prepare("SELECT snapshot FROM worlds WHERE id=?")
      .get(id);
    if (!row) return null;
    try {
      return validateWorld(JSON.parse(String(row.snapshot)));
    } catch {
      throw Error("Snapshot inválido o versión no soportada");
    }
  }
  hasCommand(world: string, account: string, id: string) {
    return !!this.db
      .prepare(
        "SELECT 1 FROM commands WHERE world_id=? AND account_id=? AND command_id=?",
      )
      .get(world, account, id);
  }
  commitWorld(w: World, account: string, id: string) {
    return this.transaction(() => {
      if (this.hasCommand(w.id, account, id)) return false;
      this.saveWorld(w);
      this.db
        .prepare("INSERT INTO commands VALUES(?,?,?)")
        .run(w.id, account, id);
      return true;
    });
  }
  close() {
    this.db.close();
  }
}
export const openStore = (path: string) => new Store(path);
