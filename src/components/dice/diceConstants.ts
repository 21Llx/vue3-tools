/** 标准骰子：顶面朝上时，前面 / 右侧面可见点数 */
export const DICE_NEIGHBORS: Record<number, { front: number; right: number }> = {
  1: { front: 2, right: 3 },
  2: { front: 3, right: 6 },
  3: { front: 1, right: 2 },
  4: { front: 6, right: 5 },
  5: { front: 4, right: 1 },
  6: { front: 5, right: 4 },
};

/** 3×3 格编号：1 2 3 / 4 5 6 / 7 8 9 */
export const FACE_DOTS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 4, 7, 3, 6, 9],
};

export function isRedFace(value: number) {
  return value === 1 || value === 4;
}
