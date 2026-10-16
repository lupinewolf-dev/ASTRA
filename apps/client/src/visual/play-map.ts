export const TERRAIN_OUTLINE = [
  [0, 3],
  [2, 0],
  [10, -0.4],
  [27, 1],
  [35, -0.3],
  [43, 2],
  [45, 8],
  [44, 24],
  [40, 30],
  [30, 29],
  [26, 27],
  [12, 28],
  [3, 24],
  [-0.5, 15],
];
export const TREE_POSITIONS = [
  [5, 5],
  [7, 3],
  [13, 3.8],
  [16, 6],
  [18, 10],
  [17, 16],
  [4.5, 9.4],
  [5, 19.3],
  [23, 10],
  [25, 7],
  [25, 14],
  [22.5, 18],
  [32, 6],
  [36, 9],
  [40, 7],
  [33, 14],
  [38, 13],
  [42, 15],
  [31, 23],
  [36, 25],
];
export const EASTERN_SITES = {
  cache: { x: 39, y: 21 },
  well: { x: 34, y: 20 },
  sign: { x: 28, y: 22 },
} as const;
export const MAP_CENTER = { x: 22, y: 14 };
export const DECOR_FENCES = [
  [6.5, 19.1, 0],
  [8.5, 19.1, 0],
  [13.8, 19.1, 0],
  [15.8, 19.1, 0],
  [16.8, 18.1, Math.PI / 2],
  [16.8, 16.1, Math.PI / 2],
  [16.8, 14.1, Math.PI / 2],
  [4.3, 16.8, Math.PI / 2],
  [4.3, 18.8, Math.PI / 2],
];
export function insideTerrain(x: number, y: number) {
  let inside = false;
  for (
    let i = 0, j = TERRAIN_OUTLINE.length - 1;
    i < TERRAIN_OUTLINE.length;
    j = i++
  ) {
    const a = TERRAIN_OUTLINE[i],
      b = TERRAIN_OUTLINE[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
