import { beforeEach, afterEach, it, expect } from "vitest";
import { createServer } from "node:http";
import { openStore, Store } from "../src/store.js";
import { createApp } from "../src/http.js";
let store: Store, server: ReturnType<typeof createServer>, base: string;
beforeEach(async () => {
  store = openStore(":memory:");
  server = createServer(createApp(store));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterEach(async () => {
  await new Promise<void>((r) => server.close(() => r()));
  store.close();
});
async function req(path: string, body?: unknown, cookie = "", origin = base) {
  return fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", origin, cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function register(username: string) {
  const r = await req("/api/register", {
    username,
    password: "strong-test-password",
  });
  expect(r.status).toBe(201);
  return r.headers.get("set-cookie")!.split(";")[0];
}
it("hashes passwords authenticates sessions and logs out", async () => {
  const cookie = await register("Ana");
  const hash = store.db
    .prepare("SELECT password FROM accounts")
    .get()?.password;
  expect(hash).not.toBe("strong-test-password");
  expect(String(hash)).toContain(":");
  expect((await req("/api/me", undefined, cookie)).status).toBe(200);
  expect((await req("/api/me")).status).toBe(401);
  const login = await req("/api/login", { username: "Ana", password: "wrong" });
  expect(login.status).toBe(401);
  const good = await req("/api/login", {
    username: "Ana",
    password: "strong-test-password",
  });
  expect(good.headers.get("set-cookie")).toContain("HttpOnly");
  expect((await req("/api/logout", {}, cookie)).status).toBe(200);
  expect((await req("/api/me", undefined, cookie)).status).toBe(401);
});
it("protects origins, consumes invites once and limits membership", async () => {
  const a = await register("Ana"),
    b = await register("Bea"),
    c = await register("Carl");
  expect((await req("/api/worlds", {}, a, "https://evil.invalid")).status).toBe(
    403,
  );
  expect((await req("/api/worlds", {}, "")).status).toBe(401);
  const world = await req("/api/worlds", {}, a);
  expect(world.status).toBe(201);
  const invitation = await req("/api/invites", {}, a);
  const { token } = await invitation.json();
  expect((await req("/api/invites/redeem", { token }, b)).status).toBe(200);
  expect((await req("/api/invites/redeem", { token }, c)).status).toBe(400);
  const second = await req("/api/invites", {}, a);
  expect(second.status).toBe(400);
  expect((await req("/api/me", undefined, b)).status).toBe(200);
});
it("expires invites and rate limits bad logins", async () => {
  const a = await register("Ana"),
    b = await register("Bea");
  await req("/api/worlds", {}, a);
  const { token } = await (await req("/api/invites", {}, a)).json();
  store.db.prepare("UPDATE invites SET expires=0").run();
  expect((await req("/api/invites/redeem", { token }, b)).status).toBe(400);
  let status = 0;
  for (let i = 0; i < 12; i++)
    status = (
      await req("/api/login", { username: "nobody", password: "wrong" })
    ).status;
  expect(status).toBe(429);
});
