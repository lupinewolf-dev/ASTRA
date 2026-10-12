import { it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../src/store.js";
import { createWorld, addPlayer } from "../../../packages/shared/src/world.js";
it("persists state and deduplicates commands across reopening", () => {
  const dir = mkdtempSync(join(tmpdir(), "astra-"));
  const path = join(dir, "farm.sqlite");
  try {
    let s = openStore(path);
    const w = createWorld("w");
    addPlayer(w, "a", "Ana");
    w.remainingMs = 42000;
    w.crops[0].stage = "ready";
    w.fences.push({ id: "f", x: 3, y: 3, hp: 100, maxHp: 120, level: 1 });
    s.commitWorld(w, "a", "craft-1");
    expect(s.hasCommand("w", "a", "craft-1")).toBe(true);
    s.close();
    s = openStore(path);
    expect(s.loadWorld("w")).toEqual(w);
    expect(s.commitWorld({ ...w, remainingMs: 0 }, "a", "craft-1")).toBe(false);
    expect(s.loadWorld("w")?.remainingMs).toBe(42000);
    s.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
it("rolls back failed transactions and rejects invalid snapshots", () => {
  const s = openStore(":memory:");
  const w = createWorld("w");
  s.saveWorld(w);
  s.db.exec(
    "CREATE TRIGGER fail_save BEFORE UPDATE ON worlds BEGIN SELECT RAISE(ABORT, 'disk unavailable'); END;",
  );
  expect(() => s.commitWorld({ ...w, remainingMs: 1 }, "a", "c")).toThrow(
    "disk unavailable",
  );
  expect(s.loadWorld("w")?.remainingMs).toBe(600000);
  expect(s.hasCommand("w", "a", "c")).toBe(false);
  s.db.exec("DROP TRIGGER fail_save");
  expect(() => s.saveWorld({ ...w, version: 99 } as never)).toThrow();
  s.db
    .prepare("UPDATE worlds SET snapshot=? WHERE id=?")
    .run('{"version":1}', "w");
  expect(() => s.loadWorld("w")).toThrow("Snapshot");
  s.close();
});
it("migration is idempotent and existing accounts survive", () => {
  const dir = mkdtempSync(join(tmpdir(), "astra-"));
  try {
    const path = join(dir, "db");
    let s = openStore(path);
    s.db
      .prepare("INSERT INTO accounts(id,username,password) VALUES(?,?,?)")
      .run("a", "Ana", "hash");
    s.close();
    s = openStore(path);
    expect(s.db.prepare("SELECT username FROM accounts").get()?.username).toBe(
      "Ana",
    );
    expect(s.db.prepare("PRAGMA user_version").get()?.user_version).toBe(1);
    s.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
