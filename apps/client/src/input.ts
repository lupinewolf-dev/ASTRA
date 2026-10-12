export class InputState {
  private keys = new Set<string>();
  pressKey(code: string) {
    if (
      !this.canSend ||
      ![
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowLeft",
        "ArrowDown",
        "ArrowRight",
      ].includes(code)
    )
      return;
    this.keys.add(code);
    this.keyboardMove();
  }
  releaseKey(code: string) {
    if (this.keys.delete(code)) this.keyboardMove();
  }
  private keyboardMove() {
    const has = (a: string, b: string) => this.keys.has(a) || this.keys.has(b);
    const dx =
        Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "ArrowLeft")),
      dy = Number(has("KeyS", "ArrowDown")) - Number(has("KeyW", "ArrowUp"));
    const x = dx / 2 + dy,
      y = dy - dx / 2,
      length = Math.hypot(x, y);
    this.move = length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
  }
  connected = false;
  menu = false;
  move = { x: 0, y: 0 };
  aim = { x: 1, y: 0 };
  firing = false;
  get canSend() {
    return this.connected && !this.menu;
  }
  setAim(x: number, y: number, fire: boolean) {
    const length = Math.hypot(x, y);
    if (length > 0) this.aim = { x: x / length, y: y / length };
    this.firing = fire && length > 0 && this.canSend;
  }
  releaseAim() {
    this.firing = false;
  }
  blur() {
    this.keys.clear();
    this.move = { x: 0, y: 0 };
    this.releaseAim();
  }
  openMenu() {
    this.menu = true;
    this.blur();
  }
  closeMenu() {
    this.menu = false;
  }
  snapshot() {
    return {
      move: this.canSend ? this.move : { x: 0, y: 0 },
      aim: this.aim,
      firing: this.canSend && this.firing,
    };
  }
}
