import type { VisualScene } from "./scene.js";

/** Local preview input; never changes the authoritative game World. */
export function bindWalking(scene: VisualScene): () => void {
  const stick = document.createElement("div");
  stick.className = "walking-stick";
  stick.setAttribute("role", "slider");
  stick.setAttribute("aria-label", "Mover personaje");
  stick.setAttribute("aria-valuemin", "-1");
  stick.setAttribute("aria-valuemax", "1");
  stick.setAttribute("aria-valuenow", "0");
  stick.tabIndex = 0;
  const knob = document.createElement("span");
  stick.append(knob);
  document.body.append(stick);
  const keys = new Set<string>();
  let touchX = 0,
    touchY = 0,
    pointer: number | undefined;
  let frame = 0,
    last = 0,
    dead = false;
  const tick = (time: number) => {
    frame = 0;
    if (dead || document.hidden) return;
    const x =
      touchX ||
      Number(keys.has("d") || keys.has("arrowright")) -
        Number(keys.has("a") || keys.has("arrowleft"));
    const y =
      touchY ||
      Number(keys.has("s") || keys.has("arrowdown")) -
        Number(keys.has("w") || keys.has("arrowup"));
    if (!x && !y) {
      last = 0;
      return;
    }
    scene.walk(x, y, last ? (time - last) / 1000 : 1 / 60);
    last = time;
    if (!dead) frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!frame && !dead) frame = requestAnimationFrame(tick);
  };
  const reset = () => {
    keys.clear();
    touchX = touchY = 0;
    pointer = undefined;
    knob.style.transform = "";
    stick.setAttribute("aria-valuenow", "0");
    cancelAnimationFrame(frame);
    frame = last = 0;
  };
  const keydown = (event: KeyboardEvent) => {
    if (
      ![
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ].includes(event.key.toLowerCase())
    )
      return;
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    event.preventDefault();
    keys.add(event.key.toLowerCase());
    start();
  };
  const keyup = (event: KeyboardEvent) => {
    keys.delete(event.key.toLowerCase());
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    const box = stick.getBoundingClientRect();
    const x = (event.clientX - box.x - box.width / 2) / 38;
    const y = (event.clientY - box.y - box.height / 2) / 38;
    const length = Math.max(1, Math.hypot(x, y));
    touchX = x / length;
    touchY = y / length;
    if (Math.hypot(x, y) < 0.12) touchX = touchY = 0;
    knob.style.transform = `translate(${touchX * 32}px, ${touchY * 32}px)`;
    stick.setAttribute("aria-valuenow", touchX.toFixed(2));
    start();
  };
  const down = (event: PointerEvent) => {
    if (pointer !== undefined) return;
    pointer = event.pointerId;
    if (stick.hasPointerCapture(event.pointerId) || event.isTrusted)
      stick.setPointerCapture(event.pointerId);
    move(event);
  };
  const release = (event: PointerEvent) => {
    if (event.pointerId === pointer) reset();
  };
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", reset);
  window.addEventListener("pagehide", reset);
  stick.addEventListener("pointerdown", down);
  stick.addEventListener("pointermove", move);
  stick.addEventListener("pointerup", release);
  stick.addEventListener("pointercancel", release);
  stick.addEventListener("lostpointercapture", release);
  return () => {
    dead = true;
    reset();
    stick.remove();
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", reset);
    window.removeEventListener("pagehide", reset);
  };
}
