export class InputState {
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
