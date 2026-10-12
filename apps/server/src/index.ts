import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import express from "express";
import { serverRoot, databasePath } from "./paths.js";
import { createApp } from "./http.js";
import { openStore, type Store } from "./store.js";
import { farmRoomClass, type FarmInstance } from "./room.js";
import { allowedOrigin } from "./auth.js";
export async function startServer(
  options: {
    store?: Store;
    port?: number;
    host?: string;
    origins?: string;
    production?: boolean;
    testMode?: boolean;
  } = {},
) {
  const ownStore = !options.store,
    store = options.store ?? openStore(databasePath(process.env.DATABASE_PATH));
  const app = createApp(store, {
    origins: options.origins,
    production: options.production,
  });
  const clientPath = resolve(serverRoot(), "../client/dist");
  if (existsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get("/", (_req, res) =>
      res.sendFile(resolve(clientPath, "index.html")),
    );
  }
  const http = createServer(app),
    rooms = new Map<string, FarmInstance>();
  const transport = new WebSocketTransport({
    server: http,
    pingInterval: 5000,
    pingMaxRetries: 2,
    maxPayload: 8192,
    verifyClient: (info, done) =>
      done(
        allowedOrigin(info.origin, info.req.headers.host, options.origins),
        403,
        "Origen no permitido",
      ),
  });
  const game = new Server({
    transport,
    gracefullyShutdown: false,
    greet: false,
  });
  game
    .define(
      "farm",
      farmRoomClass(store, rooms, options.origins, options.testMode),
    )
    .filterBy(["worldId"]);
  await game.listen(
    options.port ?? Number(process.env.PORT ?? 3001),
    options.host ?? "0.0.0.0",
  );
  const port = (http.address() as { port: number }).port;
  let stopped = false;
  return {
    port,
    store,
    rooms,
    async stop() {
      if (stopped) return;
      stopped = true;
      await game.gracefullyShutdown(false);
      if (ownStore) store.close();
    },
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS)
    throw Error("ALLOWED_ORIGINS es obligatorio en producción");
  const running = await startServer({
    origins: process.env.ALLOWED_ORIGINS,
    production: process.env.NODE_ENV === "production",
    testMode:
      process.env.NODE_ENV === "test" && process.env.ASTRA_TEST_MODE === "1",
  });
  console.log(`ASTRA escuchando en puerto ${running.port}`);
  const stop = () => {
    running
      .stop()
      .then(() => process.exit(0))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
