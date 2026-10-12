import type { World } from "../../../packages/shared/src/types.js";
export interface TestBridge {
  world: () => World | undefined;
  screenPoint: (x: number, y: number) => { x: number; y: number };
  playerId: string;
  diagnostics: () => {
    fps: number;
    visible: string;
    move: { x: number; y: number };
    active: boolean;
  };
}
declare global {
  interface Window {
    astraTest?: TestBridge;
  }
}
