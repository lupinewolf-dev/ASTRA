export const TERRAIN_OUTLINE = [
  [0, 3],
  [2, 0],
  [10, -0.4],
  [27, 1],
  [30, 5],
  [30, 22],
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
];
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
