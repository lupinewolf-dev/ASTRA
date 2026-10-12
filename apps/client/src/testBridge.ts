import type { World } from "../../../packages/shared/src/types.js";
export interface TestBridge {
  world: () => World | undefined;
  screenPoint: (x: number, y: number) => { x: number; y: number };
  playerId: string;
}
declare global {
  interface Window {
    astraTest?: TestBridge;
  }
}
