import * as Phaser from 'phaser';
import { TILE_SIZE } from './constants';
import { GameScene } from './GameScene';
import { setPendingHudCallback } from './hudBridge';
import { level1 } from './level1';
import type { HudUpdateCallback } from './types';

export function createTowerDefenseGame(
  parent: HTMLElement,
  onHudUpdate: HudUpdateCallback,
) {
  const width = level1.cols * TILE_SIZE;
  const height = level1.rows * TILE_SIZE;

  setPendingHudCallback(onHudUpdate);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width,
    height,
    parent,
    backgroundColor: '#234a2a',
    scene: GameScene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  setPendingHudCallback(null);
  return game;
}

export function getGameScene(game: Phaser.Game) {
  return game.scene.getScene('GameScene') as GameScene;
}
