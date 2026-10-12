import { Client, type Room } from "colyseus.js";
import type { World } from "../../../packages/shared/src/types.js";
export interface User {
  id: string;
  username: string;
  worldId: string | null;
}
export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw Error(json.error ?? "No se pudo conectar");
  return json as T;
}
export class Connection {
  room?: Room;
  world?: World;
  connected = false;
  onWorld: (w: World) => void = () => {};
  onStatus: (text: string) => void = () => {};
  onConnection: (connected: boolean) => void = () => {};
  async join(worldId: string) {
    const room = await new Client(
      location.origin +
        ((import.meta as unknown as { env: { DEV: boolean } }).env.DEV
          ? "/room"
          : ""),
    ).joinOrCreate("farm", { worldId });
    this.room = room;
    this.connected = true;
    this.onConnection(true);
    room.onMessage("world", (w: World) => {
      this.world = w;
      this.onWorld(w);
    });
    room.onMessage("result", (r: { ok: boolean; error?: string }) => {
      if (!r.ok) this.onStatus(r.error ?? "Acción rechazada");
    });
    room.onMessage("status", (s: { saving: boolean; error?: string }) =>
      this.onStatus(s.error ?? "Progreso guardado"),
    );
    room.onLeave(() => {
      this.connected = false;
      this.onConnection(false);
      this.onStatus("Conexión interrumpida. Pulsa Volver a conectar.");
    });
    room.onError((_code, message) =>
      this.onStatus(message ?? "Error de conexión"),
    );
  }
  send(type: string, payload: Record<string, unknown> = {}) {
    if (!this.connected || !this.room) return;
    this.room.send("command", {
      id:
        crypto.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
    });
  }
  async leave() {
    this.connected = false;
    this.onConnection(false);
    if (this.room) await this.room.leave();
    this.room = undefined;
  }
}
