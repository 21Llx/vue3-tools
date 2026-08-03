import { TILE_SIZE } from './constants';
import type { GridPoint, LevelData, TileType, Waypoint } from './types';

const RAW_MAP: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 4],
  [0, 2, 2, 0, 0, 0, 0, 0, 1, 0],
  [0, 2, 2, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 0, 2, 2, 2, 2, 1, 0, 1, 0],
  [0, 0, 2, 2, 2, 2, 1, 1, 1, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const PATH_CELLS: GridPoint[] = [
  { col: 9, row: 5 },
  { col: 8, row: 5 },
  { col: 7, row: 5 },
  { col: 6, row: 5 },
  { col: 6, row: 4 },
  { col: 6, row: 3 },
  { col: 6, row: 2 },
  { col: 5, row: 2 },
  { col: 4, row: 2 },
  { col: 3, row: 2 },
  { col: 2, row: 2 },
  { col: 7, row: 2 },
  { col: 8, row: 2 },
  { col: 8, row: 1 },
  { col: 8, row: 0 },
  { col: 9, row: 0 },
];

function decodeTile(value: number): TileType {
  switch (value) {
    case 1:
      return 'path';
    case 2:
      return 'buildable';
    case 3:
      return 'spawn';
    case 4:
      return 'base';
    default:
      return 'grass';
  }
}

function gridCenter(col: number, row: number): Waypoint {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}
console.log(RAW_MAP.map((row) => row.map(decodeTile)))
export const level1: LevelData = {
  name: '守禅 · 第一关',
  cols: RAW_MAP[0].length,
  rows: RAW_MAP.length,
  tiles: RAW_MAP.map((row) => row.map(decodeTile)),
  spawn: { col: 9, row: 5 },
  base: { col: 9, row: 0 },
  waypoints: PATH_CELLS.map(({ col, row }) => gridCenter(col, row)),
};
