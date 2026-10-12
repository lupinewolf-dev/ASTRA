import type { World, Resource } from "../../../packages/shared/src/types.js";
import { distance, validBuild } from "../../../packages/shared/src/geometry.js";
import { CONFIG } from "../../../packages/shared/src/config.js";
import { api, Connection, type User } from "./api.js";
import { InputState } from "./input.js";
export const labels: Record<Resource, string> = {
  wood: "Madera",
  stone: "Piedra",
  ammo: "Balas",
  food: "Comida",
  seed: "Semillas",
};
export interface GameUi {
  build: boolean;
  selected: { x: number; y: number } | null;
  status: (text: string) => void;
  render: (world: World) => void;
  destroy: () => void;
}
export function createHud(
  root: HTMLElement,
  user: User,
  conn: Connection,
  input: InputState,
): GameUi {
  root.innerHTML = `<div id="game-canvas"></div><header class="game-header"><div class="brand">ASTRA <span>NUESTRO REFUGIO</span></div><div class="wave-panel"><span id="wave-label">Un día para crecer</span><strong id="wave-clock">10:00</strong></div><button id="invite" class="quiet">Invitar pareja ↗</button><button id="exit" class="quiet">Salir</button></header><aside class="farm-panel"><span class="eyebrow">NUESTRA GRANJA</span><h2>Hogar compartido</h2><p id="members">Conectando…</p><div class="player-line"><span id="player-name"></span><strong id="health">100 ♥</strong></div><div class="health-track"><i id="health-fill"></i></div><div id="inventory" class="inventory"></div><div class="section-label">EN TUS MANOS</div><div class="button-row"><button id="pistol" class="selected">Pistola</button><button id="melee">Cuerpo a cuerpo</button></div><button id="stop-fire" class="quiet full">Detener disparo</button><div class="section-label">CONSTRUIR Y CUIDAR</div><div class="action-grid"><button id="interact">Interactuar <kbd>E</kbd></button><button id="build">Cerca <small>3 madera</small></button><button id="repair">Reparar <small>1 madera</small></button><button id="upgrade-fence">Mejorar cerca <small>5 madera · 4 piedra</small></button><button id="eat">Comer <small>+25 salud</small></button><button id="workshop">Mesa de trabajo ↗</button></div><label class="difficulty-label">Ritmo de las oleadas<select id="difficulty"><option value="tranquil">Tranquilo · 15 minutos</option><option value="normal">Normal · 10 minutos</option><option value="hard">Difícil · 5 minutos</option></select></label><p class="hint">WASD para moverte · Mantén pulsado para apuntar y disparar · E para interactuar.</p></aside><div id="status" class="status" role="status">Conectando con la granja…</div><button id="reconnect" class="reconnect" hidden>Volver a conectar</button><div class="touch-controls"><div id="move-pad" class="pad" aria-label="Mover personaje"><i></i><span>MOVER</span></div><button id="touch-interact">E</button><div id="aim-pad" class="pad" aria-label="Apuntar y disparar"><i></i><span>APUNTAR</span></div></div><div class="rotate-hint">Gira el celular para jugar más cómodo ↻</div><dialog id="workshop-dialog"><form method="dialog"><button class="dialog-close" aria-label="Cerrar">×</button></form><span class="eyebrow">EL REFUGIO</span><h2>Mesa de trabajo</h2><p>Acércate a la entrada de la casa para fabricar y guardar.</p><button id="craft" class="primary">Fabricar 12 balas <small>2 madera + 2 piedra</small></button><button id="upgrade-gun" class="secondary">Mejorar pistola <small>5 madera + 4 piedra</small></button><h3>Almacén compartido</h3><div id="storage"></div><div class="button-row"><select id="resource"><option value="wood">Madera</option><option value="stone">Piedra</option><option value="ammo">Balas</option><option value="food">Comida</option><option value="seed">Semillas</option></select><input id="quantity" type="number" min="1" max="100000" value="1" aria-label="Cantidad"></div><div class="button-row"><button id="deposit">Guardar</button><button id="withdraw">Retirar</button></div></dialog><dialog id="invite-dialog"><form method="dialog"><button class="dialog-close" aria-label="Cerrar">×</button></form><h2>Un hogar para dos</h2><p>Tu pareja debe crear su personaje y pegar este código al elegir una granja. Vence en 24 horas y se usa una vez.</p><textarea id="invite-output" readonly aria-label="Código de invitación"></textarea><button id="copy-invite" class="primary">Copiar invitación</button></dialog>`;
  const q = <T extends HTMLElement = HTMLElement>(id: string) =>
    root.querySelector<T>(`#${id}`)!;
  const ui: GameUi = {
    build: false,
    selected: null,
    status: (text) => {
      q("status").textContent = text;
    },
    render: () => {},
    destroy: () => {},
  };
  let current: World | undefined;
  const stop = () => {
    input.releaseAim();
    conn.send("aim", { ...input.aim, firing: false });
  };
  const action = (type: string, payload: Record<string, unknown> = {}) => {
    stop();
    conn.send(type, payload);
  };
  const nearest = (list: { id: string; x: number; y: number }[]) => {
    const p = current?.players[user.id];
    return p
      ? list
          .filter((t) => distance(p, t) <= CONFIG.reach)
          .sort((a, b) => distance(p, a) - distance(p, b))[0]
      : undefined;
  };
  const interact = () => {
    if (!current) return;
    const target = nearest([
      ...current.backpacks,
      ...current.crops,
      ...current.nodes,
    ]);
    if (!target) {
      ui.status("Acércate a una parcela, recurso o mochila");
      return;
    }
    action(
      current.backpacks.some((b) => b.id === target.id)
        ? "recover"
        : current.crops.some((c) => c.id === target.id)
          ? "crop"
          : "gather",
      { target: target.id },
    );
  };
  const open = (id: string) => {
    input.openMenu();
    conn.send("aim", { ...input.aim, firing: false });
    conn.send("move", { x: 0, y: 0 });
    q<HTMLDialogElement>(id).showModal();
  };
  for (const id of ["workshop-dialog", "invite-dialog"])
    q<HTMLDialogElement>(id).onclose = () => input.closeMenu();
  q("interact").onclick = interact;
  q("touch-interact").onclick = interact;
  q("pistol").onclick = () => action("weapon", { value: "pistol" });
  q("melee").onclick = () => action("weapon", { value: "melee" });
  q("eat").onclick = () => action("eat");
  q("stop-fire").onclick = stop;
  q("build").onclick = () => {
    stop();
    ui.build = !ui.build;
    q("build").classList.toggle("selected", ui.build);
    ui.status(
      ui.build
        ? "Toca una casilla cercana libre para construir. Pulsa Cerca para cancelar."
        : "Construcción cancelada",
    );
  };
  const fenceAction = (type: string) => {
    const f = current ? nearest(current.fences) : null;
    if (f) action(type, { target: f.id });
    else ui.status("Acércate a una cerca");
  };
  q("repair").onclick = () => fenceAction("repair");
  q("upgrade-fence").onclick = () => fenceAction("upgradeFence");
  q("workshop").onclick = () => open("workshop-dialog");
  q("craft").onclick = () => action("craft");
  q("upgrade-gun").onclick = () => action("upgradeGun");
  q<HTMLSelectElement>("difficulty").onchange = () =>
    action("difficulty", { value: q<HTMLSelectElement>("difficulty").value });
  for (const [id, direction] of [
    ["deposit", "deposit"],
    ["withdraw", "withdraw"],
  ])
    q(id).onclick = () =>
      action("transfer", {
        resource: q<HTMLSelectElement>("resource").value,
        quantity: q<HTMLInputElement>("quantity").valueAsNumber,
        direction,
      });
  q("invite").onclick = async () => {
    try {
      const { token } = await api<{ token: string }>("invites", {});
      q<HTMLTextAreaElement>("invite-output").value = token;
      open("invite-dialog");
    } catch (e) {
      ui.status((e as Error).message);
    }
  };
  q("copy-invite").onclick = async () => {
    const text = q<HTMLTextAreaElement>("invite-output").value;
    try {
      await navigator.clipboard.writeText(text);
      ui.status("Invitación copiada");
    } catch {
      q<HTMLTextAreaElement>("invite-output").select();
      ui.status("Selecciona y copia el código");
    }
  };
  q("exit").onclick = async () => {
    await conn.leave();
    await api("logout", {});
    location.reload();
  };
  q("reconnect").onclick = async () => {
    try {
      await conn.join(user.worldId!);
    } catch (e) {
      ui.status((e as Error).message);
    }
  };
  const key = (e: KeyboardEvent) => {
    if (
      e.code === "KeyE" &&
      !e.repeat &&
      !input.menu &&
      !(e.target instanceof HTMLInputElement) &&
      !(e.target instanceof HTMLSelectElement)
    )
      interact();
  };
  window.addEventListener("keydown", key);
  ui.destroy = () => window.removeEventListener("keydown", key);
  conn.onStatus = ui.status;
  conn.onConnection = (connected) => {
    input.connected = connected;
    if (!connected) input.blur();
    q("reconnect").hidden = connected;
    q("game-canvas").classList.toggle("offline", !connected);
  };
  ui.render = (w) => {
    current = w;
    const p = w.players[user.id];
    if (!p) return;
    q("player-name").textContent = p.name;
    q("health").textContent = `${p.hp} ♥`;
    q("health-fill").style.width = `${p.hp}%`;
    q("inventory").innerHTML = (Object.keys(labels) as Resource[])
      .map(
        (r) =>
          `<div><span>${labels[r]}</span><strong data-resource="${r}">${p.inventory[r]}</strong></div>`,
      )
      .join("");
    q("storage").textContent = (Object.keys(labels) as Resource[])
      .map((r) => `${labels[r]}: ${w.storage[r]}`)
      .join(" · ");
    q("members").textContent = `${Object.values(w.players)
      .map((p) => p.name)
      .join(" & ")} · Granja privada`;
    q("wave-label").textContent =
      w.phase === "wave"
        ? `¡Defiendan el hogar! · Oleada ${w.wave}`
        : w.warning
          ? "Los zombis se acercan"
          : "Tiempo para crecer";
    q("wave-clock").textContent =
      w.phase === "wave"
        ? `${w.zombies.length} zombis`
        : `${Math.floor(w.remainingMs / 60000)
            .toString()
            .padStart(2, "0")}:${Math.floor((w.remainingMs % 60000) / 1000)
            .toString()
            .padStart(2, "0")}`;
    q("wave-clock").classList.toggle("danger", w.warning || w.phase === "wave");
    q<HTMLSelectElement>("difficulty").value = w.difficulty;
    q("pistol").classList.toggle("selected", p.weapon === "pistol");
    q("melee").classList.toggle("selected", p.weapon === "melee");
    if (p.weapon === "pistol" && p.inventory.ammo === 0 && input.firing)
      ui.status("Sin balas. Fabrica munición o elige cuerpo a cuerpo.");
  };
  return ui;
}
