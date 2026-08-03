import type * as Phaser from 'phaser';

export type TileType = 'grass' | 'path' | 'buildable' | 'spawn' | 'base';

export interface GridPoint {
  col: number;
  row: number;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface LevelData {
  name: string;
  cols: number;
  rows: number;
  tiles: TileType[][];
  waypoints: Waypoint[];
  spawn: GridPoint;
  base: GridPoint;
}

export interface TowerData {
  col: number;
  row: number;
  level: number;
  lastAttack: number;
  sprite: Phaser.GameObjects.Container;
  rangeCircle: Phaser.GameObjects.Arc;
}

export interface EnemyData {
  hp: number;
  maxHp: number;
  speed: number;
  waypointIndex: number;
  sprite: Phaser.GameObjects.Container;
  hpBar: Phaser.GameObjects.Graphics;
}

export type GameStatus = 'ready' | 'playing' | 'win' | 'lose';

export interface GameHudState {
  gold: number;
  lives: number;
  wave: number;
  enemiesAlive: number;
  enemiesTotal: number;
  status: GameStatus;
  message: string;
}

export type HudUpdateCallback = (state: GameHudState) => void;
