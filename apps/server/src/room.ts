import { Room, type Client, type AuthContext } from "@colyseus/core";
import { authenticated, allowedOrigin, sessionToken } from "./auth.js";
import type { Store } from "./store.js";
import {
  addPlayer,
  applyCommand,
  tickWorld,
} from "../../../packages/shared/src/world.js";
import type { Command, World } from "../../../packages/shared/src/types.js";
export interface FarmInstance {
  world: World;
  connected: Map<string, string>;
  storageError: boolean;
}
export function farmRoomClass(
  store: Store,
  rooms: Map<string, FarmInstance>,
  origins?: string,
  testMode = false,
) {
  return class FarmRoom extends Room {
    world!: World;
    connected = new Map<string, string>();
    storageError = false;
    private savedMs = 0;
    private broadcastMs = 0;
    private recoveryMs = 0;
    private budgets = new Map<string, { count: number; until: number }>();
    static async onAuth(
      _token: string,
      options: { worldId: unknown },
      context: AuthContext,
    ) {
      const user = authenticated(store, context.headers);
      if (
        !user ||
        !allowedOrigin(context.headers.origin, context.headers.host, origins) ||
        typeof options.worldId !== "string" ||
        options.worldId.length > 80
      )
        throw Error("Acceso no permitido");
      const membership = store.db
        .prepare("SELECT world_id FROM members WHERE account_id=?")
        .get(user.id);
      if (membership?.world_id !== options.worldId)
        throw Error("No perteneces a esta granja");
      return { ...user, session: sessionToken(context.headers) };
    }
    onCreate(options: { worldId: string }) {
      if (rooms.has(options.worldId))
        throw Error("La granja ya está activa; vuelve a entrar");
      const world = store.loadWorld(options.worldId);
      if (!world) throw Error("Granja inexistente");
      this.world = world;
      rooms.set(world.id, this);
      this.maxClients = 2;
      this.autoDispose = false;
      if (
        testMode &&
        this.world.wave === 0 &&
        this.world.remainingMs === 600000
      )
        this.world.remainingMs = 3000;
      this.onMessage("command", (client: Client, command: Command) =>
        this.handleCommand(client, command),
      );
      this.setSimulationInterval((dt) => this.advance(Math.min(dt, 250)), 50);
    }
    onJoin(
      client: Client,
      _options: unknown,
      auth: { id: string; username: string; session: string },
    ) {
      if (
        store.db
          .prepare("SELECT world_id FROM members WHERE account_id=?")
          .get(auth.id)?.world_id !== this.world.id
      )
        throw Error("No perteneces a esta granja");
      if ([...this.connected.values()].includes(auth.id))
        throw Error("Tu personaje ya está conectado en otro dispositivo");
      const candidate = structuredClone(this.world);
      addPlayer(candidate, auth.id, auth.username);
      candidate.players[auth.id].move = { x: 0, y: 0 };
      candidate.players[auth.id].firing = false;
      store.saveWorld(candidate);
      this.world = candidate;
      client.userData = { id: auth.id, session: auth.session };
      this.connected.set(client.sessionId, auth.id);
      client.send("world", this.world);
      client.send("status", { saving: true, paused: false });
    }
    onLeave(client: Client) {
      const id = this.connected.get(client.sessionId);
      this.connected.delete(client.sessionId);
      this.budgets.delete(client.sessionId);
      if (id && this.world.players[id]) {
        this.world.players[id].move = { x: 0, y: 0 };
        this.world.players[id].firing = false;
      }
      try {
        store.saveWorld(this.world);
      } catch {
        this.storageError = true;
        this.broadcast("status", {
          saving: false,
          error: "No se pudo guardar; simulación detenida.",
        });
      }
    }
    onDispose() {
      try {
        store.saveWorld(this.world);
      } finally {
        rooms.delete(this.world.id);
      }
    }
    private handleCommand(client: Client, c: Command) {
      const id = this.connected.get(client.sessionId);
      if (!id) return;
      const now = Date.now(),
        budget = this.budgets.get(client.sessionId);
      if (!budget || budget.until < now)
        this.budgets.set(client.sessionId, { count: 1, until: now + 1000 });
      else if (++budget.count > 50) return;
      if (
        !store.db
          .prepare(
            "SELECT 1 FROM sessions WHERE token=? AND account_id=? AND expires>?",
          )
          .get(client.userData.session, id, Date.now())
      ) {
        client.leave(4001);
        return;
      }
      if (this.storageError) {
        client.send("result", {
          id: c?.id,
          ok: false,
          error: "Guardado no disponible. Espera la recuperación.",
        });
        return;
      }
      try {
        if (!c || typeof c.id !== "string" || typeof c.type !== "string") {
          client.send("result", { ok: false, error: "Comando inválido" });
          return;
        }
        const ephemeral = c.type === "move" || c.type === "aim";
        if (!ephemeral && store.hasCommand(this.world.id, id, c.id)) {
          client.send("result", {
            id: c.id,
            ok: false,
            error: "Comando ya procesado",
          });
          return;
        }
        const candidate = structuredClone(this.world);
        const result = applyCommand(candidate, id, c);
        if (result.ok) {
          if (!ephemeral && !store.commitWorld(candidate, id, c.id)) {
            client.send("result", {
              id: c.id,
              ok: false,
              error: "Comando ya procesado",
            });
            return;
          }
          this.world = candidate;
        }
        client.send("result", { id: c.id, ...result });
      } catch {
        this.storageError = true;
        client.send("result", {
          id: c?.id,
          ok: false,
          error: "No se pudo guardar la acción",
        });
        this.broadcast("status", {
          saving: false,
          error: "Guardado no disponible; partida pausada.",
        });
      }
    }
    private advance(dt: number) {
      if (this.storageError) {
        this.recoveryMs += dt;
        if (this.recoveryMs >= 1000) {
          this.recoveryMs = 0;
          try {
            store.saveWorld(this.world);
            this.storageError = false;
            this.broadcast("status", { saving: true });
          } catch {
            /* Stay paused until disk recovers. */
          }
        }
        return;
      }
      const candidate = structuredClone(this.world);
      tickWorld(candidate, dt, [...this.connected.values()]);
      this.savedMs += dt;
      this.broadcastMs += dt;
      const durable = (w: World) =>
        JSON.stringify([
          Object.values(w.players).map((p) => [p.id, p.inventory, p.hp]),
          w.crops,
          w.fences,
          w.backpacks,
          w.storage,
        ]);
      try {
        if (
          this.savedMs >= 5000 ||
          durable(candidate) !== durable(this.world)
        ) {
          store.saveWorld(candidate);
          this.savedMs = 0;
        }
        this.world = candidate;
      } catch {
        this.storageError = true;
        this.broadcast("status", {
          saving: false,
          error: "No se pudo guardar; simulación detenida.",
        });
        return;
      }
      if (this.broadcastMs >= 100) {
        this.broadcastMs = 0;
        this.broadcast("world", this.world);
      }
    }
  };
}
