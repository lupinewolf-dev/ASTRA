import { LocalFarmGame } from "./local-game.js";
import type { VisualScene } from "./scene.js";

export function createPlayHud(game: LocalFarmGame, scene: VisualScene) {
  const root = document.createElement("section");
  root.className = "play-hud";
  root.innerHTML =
    '<div class="play-stats" role="status" aria-label="Estado de la granja"></div><div class="play-objective"></div><div class="play-message" role="status" aria-label="Avisos"></div><div class="play-actions"><button data-action="interact"></button><button data-action="craft">Balas [C]</button><button data-action="eat">Comer [H]</button><button data-action="wave">Adelantar oleada</button><button data-action="map">Ver mapa [M]</button><button data-action="pause">Pausar</button></div>';
  document.body.append(root);
  const stats = root.querySelector(".play-stats")!,
    objective = root.querySelector(".play-objective")!,
    message = root.querySelector(".play-message")!;
  const button = (action: string) =>
    root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
  let userPaused = false,
    disposed = false;
  const text = (element: Element, value: string) => {
    if (element.textContent !== value) element.textContent = value;
  };
  const render = () => {
    if (disposed) return;
    const p = game.player,
      w = game.world,
      i = p.inventory,
      context = game.context();
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
    text(button("pause"), game.paused ? "Continuar" : "Pausar");
  };
  const run = (action: string) => {
    if (action === "pause") {
      userPaused = !userPaused;
      game.pause(userPaused);
    } else if (action === "map") scene.toggleMap?.();
    else if (!game.paused) {
      if (action === "interact") game.interact();
      if (action === "craft") game.craft();
      if (action === "eat") game.eat();
      if (action === "wave") game.startWave();
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
    game.pause(userPaused || document.hidden);
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
  render();
  return {
    render,
    dispose() {
      disposed = true;
      root.remove();
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
