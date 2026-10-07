/** Shared 3D layout math so blocks, webs, and Spidey agree on positions. */

export function blockWidth(n: number): number {
  if (n <= 8) return 1;
  if (n <= 12) return 0.8;
  return 0.62;
}

export const BLOCK_GAP = 0.28;
export const BLOCK_DEPTH = 0.9;

export function rowWidth(n: number): number {
  if (n === 0) return 0;
  return n * blockWidth(n) + (n - 1) * BLOCK_GAP;
}

export function xForIndex(i: number, n: number): number {
  const w = blockWidth(n);
  return -rowWidth(n) / 2 + w / 2 + i * (w + BLOCK_GAP);
}

/** Block height for values 0..99. Value 0 still gets a visible slab. */
export function blockHeight(v: number): number {
  return 0.35 + (v / 99) * 2.6;
}

/** Vertical lift applied to a block by role (before animation easing). */
export function liftForRole(
  role: "lifted" | "swap" | "drop" | "none",
): number {
  switch (role) {
    case "lifted":
      return 1.5;
    case "swap":
      return 0.85;
    case "drop":
      return 1.1;
    default:
      return 0;
  }
}
