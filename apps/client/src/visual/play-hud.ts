import { LocalFarmGame } from "./local-game.js";
import type { VisualScene } from "./scene.js";

export function createPlayHud(game: LocalFarmGame, scene: VisualScene) {
  const root = document.createElement("section");
  root.className = "play-hud";
  root.innerHTML =
    '<div class="play-stats" role="status" aria-label="Estado de la granja"></div><div class="health-track" aria-hidden="true"><div></div></div><div class="play-objective"></div><div class="play-message" role="status" aria-label="Avisos"></div><div class="play-actions"><button data-action="interact"></button><button data-action="shoot">Disparar [J]</button><button data-action="melee">Golpear [F]</button><button data-action="dodge">Esquiva [Espacio]</button><button data-action="craft">Balas [C]</button><button data-action="eat">Comer [H]</button><button data-action="wave">Adelantar oleada</button><button data-action="map">Ver mapa [M]</button><button data-action="pause">Pausar</button><button data-action="help">Ayuda</button></div>';
  document.body.append(root);
  const help = document.createElement("dialog");
  help.className = "demo-help";
  help.setAttribute("aria-labelledby", "demo-title");
  help.innerHTML = `<span class="demo-eyebrow">ASTRA · DEMO JUGABLE</span>
    <h1 id="demo-title">Un pequeño refugio.<br>Una noche más.</h1>
    <p>Cultivá, prepará tu equipo y defendé la granja. Tu primera misión: <strong>cosechar tres parcelas y sobrevivir una oleada</strong>.</p>
    <div class="demo-guide"><p><b>01 · Prepará</b>Acercate a una parcela y usá E o el botón de acción. La mesa junto a la casa permite fabricar balas.</p>
    <p><b>02 · Defendé</b>Movete con WASD o flechas. Apuntá con el mouse y hacé clic para disparar una bala. F golpea de cerca.</p>
    <p><b>03 · Esquivá</b>Espacio da un impulso en la dirección en que caminás. H permite comer y recuperar vida.</p></div>
    <p class="demo-mobile-tip">En celular: joystick izquierdo para caminar, derecho para apuntar y botón Disparar para tirar una sola bala. Giralo en horizontal para ver más terreno.</p>
    <p class="demo-note">Demo local para una persona. La partida se reinicia al recargar.</p>
    <button class="demo-start" autofocus>Jugar</button>`;
  document.body.append(help);
  const stats = root.querySelector(".play-stats")!,
    objective = root.querySelector(".play-objective")!,
    message = root.querySelector(".play-message")!;
  const button = (action: string) =>
    root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
  let userPaused = false,
    disposed = false;
  let lastHp = game.player.hp,
    hurtUntil = 0;
  const health = root.querySelector<HTMLElement>(".health-track > div")!;
  const openHelp = () => {
    game.pause(true);
    help.showModal();
    render();
  };
  const closeHelp = () => {
    help.close();
    game.pause(userPaused || document.hidden);
    render();
  };
  const cancelHelp = (event: Event) => {
    event.preventDefault();
    closeHelp();
  };
  const text = (element: Element, value: string) => {
    if (element.textContent !== value) element.textContent = value;
  };
  const render = () => {
    if (disposed) return;
    const p = game.player,
      w = game.world,
      i = p.inventory,
      context = game.context();
    if (p.hp < lastHp) hurtUntil = w.timeMs + 450;
    lastHp = p.hp;
    document.body.classList.toggle("player-hurt", w.timeMs < hurtUntil);
    health.style.width = `${Math.max(0, p.hp)}%`;
    health.classList.toggle("low", p.hp < 35);
    const phase = game.paused
      ? "Pausa"
      : w.phase === "wave"
        ? `Oleada ${w.wave} · Zombis: ${w.zombies.length}`
        : `Oleada en ${Math.ceil(w.remainingMs / 1000)} s`;
    text(
      stats,
      `Vida ${p.hp} · Balas ${i.ammo} · Comida ${i.food} · Semillas ${i.seed} · Madera ${i.wood} · Piedra ${i.stone} | ${phase}`,
    );
    text(
      objective,
      game.complete
        ? "✓ Objetivo completo · Podés seguir cultivando"
        : `Cosechas ${Math.min(game.harvested, 3)}/3 · Oleadas superadas ${Math.min(game.survived, 1)}/1`,
    );
    text(message, game.message);
    text(
      button("interact"),
      context ? `${context.label} [E]` : "Acercate para interactuar [E]",
    );
    button("interact").disabled = game.paused || !context || !context.enabled;
    button("craft").disabled =
      game.paused ||
      Math.hypot(p.x - 10, p.y - 12) > 1.8 ||
      i.wood < 2 ||
      i.stone < 2;
    button("eat").disabled = game.paused || p.hp >= 100 || i.food < 1;
    button("wave").disabled = game.paused || w.phase === "wave";
    button("shoot").disabled =
      game.paused ||
      p.cooldown > 0 ||
      i.ammo < 1 ||
      !w.zombies.some((z) => Math.hypot(z.x - p.x, z.y - p.y) <= 8);
    button("melee").disabled = game.paused || p.cooldown > 0;
    button("dodge").disabled = game.paused || game.dodgeCooldown > 0;
    text(
      button("dodge"),
      game.dodgeCooldown > 0
        ? `Esquiva · ${(game.dodgeCooldown / 1000).toFixed(1)} s`
        : "Esquiva [Espacio]",
    );
    text(button("pause"), game.paused ? "Continuar" : "Pausar");
  };
  const run = (action: string) => {
    if (action === "help") openHelp();
    else if (action === "pause") {
      userPaused = !userPaused;
      game.pause(userPaused);
    } else if (action === "map") scene.toggleMap?.();
    else if (!game.paused) {
      if (action === "interact") game.interact();
      if (action === "craft") game.craft();
      if (action === "eat") game.eat();
      if (action === "wave") game.startWave();
      if (action === "dodge") game.dodge();
      if (action === "shoot") scene.shoot?.();
      if (action === "melee") scene.melee?.();
    }
    render();
  };
  const click = (event: Event) => {
    const target = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-action]",
    );
    if (target && !target.disabled) run(target.dataset.action!);
  };
  const key = (event: KeyboardEvent) => {
    if (
      help.open ||
      event.repeat ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    const action = (
      {
        e: "interact",
        c: "craft",
        h: "eat",
        m: "map",
        j: "shoot",
        f: "melee",
        " ": "dodge",
        Escape: "pause",
      } as Record<string, string>
    )[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (action) {
      event.preventDefault();
      run(action);
    }
  };
  const blur = () => {
    game.pause(true);
    render();
  };
  const focus = () => {
    game.pause(userPaused || document.hidden || help.open);
    render();
  };
  const visibility = () => (document.hidden ? blur() : focus());
  root.addEventListener("click", click);
  window.addEventListener("keydown", key);
  window.addEventListener("blur", blur);
  window.addEventListener("focus", focus);
  window.addEventListener("pagehide", blur);
  window.addEventListener("pageshow", focus);
  document.addEventListener("visibilitychange", visibility);
  help.querySelector("button")!.addEventListener("click", closeHelp);
  help.addEventListener("cancel", cancelHelp);
  render();
  if (new URLSearchParams(location.search).get("demo") === "1") openHelp();
  return {
    render,
    dispose() {
      disposed = true;
      root.remove();
      help.remove();
      document.body.classList.remove("player-hurt");
      help.querySelector("button")!.removeEventListener("click", closeHelp);
      help.removeEventListener("cancel", cancelHelp);
      root.removeEventListener("click", click);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      window.removeEventListener("pagehide", blur);
      window.removeEventListener("pageshow", focus);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
