import * as Phaser from 'phaser';
import { COLORS, GAME_BALANCE, MAP_PADDING, TILE_SIZE } from './constants';
import { getPendingHudCallback } from './hudBridge';
import { level1 } from './level1';
import type {
  EnemyData,
  GameHudState,
  GameStatus,
  HudUpdateCallback,
  LevelData,
  TileType,
  TowerData,
} from './types';

export class GameScene extends Phaser.Scene {
  private level: LevelData = level1;
  private gold = GAME_BALANCE.startGold;
  private lives = GAME_BALANCE.startLives;
  private wave = 1;
  private status: GameStatus = 'ready';
  private message = '点击棕色格子放置防御塔，然后开始波次';
  private enemies: EnemyData[] = [];
  private towers: TowerData[] = [];
  private buildableTiles = new Map<string, Phaser.GameObjects.Rectangle>();
  private hoveredTileKey: string | null = null;
  private spawnedCount = 0;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private onHudUpdate?: HudUpdateCallback;

  constructor() {
    super('GameScene');
  }

  create() {
    this.onHudUpdate = getPendingHudCallback() ?? undefined;
    this.drawMap();
    this.setupInput();
    this.pushHud();
  }

  update(_time: number, delta: number) {
    if (this.status !== 'playing') return;

    this.moveEnemies(delta);
    this.towersAttack(_time);
    this.checkWaveEnd();
  }

  startWave() {
    if (this.status === 'playing' || this.status === 'win' || this.status === 'lose') return;

    this.status = 'playing';
    this.message = `第 ${this.wave} 波进攻中`;
    this.spawnedCount = 0;
    this.spawnTimer = this.time.addEvent({
      delay: GAME_BALANCE.spawnInterval,
      repeat: GAME_BALANCE.waveEnemyCount - 1,
      callback: () => this.spawnEnemy(),
    });
    this.spawnEnemy();
    this.pushHud();
  }

  restartLevel() {
    this.spawnTimer?.remove(false);
    this.enemies.forEach((enemy) => enemy.sprite.destroy());
    this.towers.forEach((tower) => {
      tower.sprite.destroy();
      tower.rangeCircle.destroy();
    });
    this.enemies = [];
    this.towers = [];
    this.gold = GAME_BALANCE.startGold;
    this.lives = GAME_BALANCE.startLives;
    this.wave = 1;
    this.status = 'ready';
    this.message = '点击棕色格子放置防御塔，然后开始波次';
    this.spawnedCount = 0;
    this.hoveredTileKey = null;
    this.pushHud();
  }

  private drawMap() {
    const { cols, rows, tiles } = this.level;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const tileType = tiles[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        this.drawTile(x, y, tileType, col, row);
      }
    }
  }

  private drawTile(x: number, y: number, tileType: TileType, col: number, row: number) {
    const size = TILE_SIZE - MAP_PADDING;
    const offset = MAP_PADDING / 2;
    let color = COLORS.grass;

    switch (tileType) {
      case 'path':
        color = COLORS.path;
        break;
      case 'buildable':
        color = COLORS.buildable;
        break;
      case 'spawn':
        color = COLORS.spawn;
        break;
      case 'base':
        color = COLORS.base;
        break;
      default:
        color = COLORS.grass;
    }

    const tile = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, size, size, color, 1);
    tile.setStrokeStyle(2, COLORS.grassBorder, 0.35);

    if (tileType === 'path' || tileType === 'spawn') {
      this.add.circle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6, COLORS.pathDot, 0.35);
    }

    if (tileType === 'spawn') {
      this.add.text(x + TILE_SIZE / 2, y + TILE_SIZE / 2, '入', {
        fontSize: '18px',
        color: COLORS.text,
      }).setOrigin(0.5);
    }

    if (tileType === 'base') {
      this.add.text(x + TILE_SIZE / 2, y + TILE_SIZE / 2, '守', {
        fontSize: '18px',
        color: COLORS.text,
      }).setOrigin(0.5);
    }

    if (tileType === 'buildable') {
      tile.setInteractive({ useHandCursor: true });
      const key = this.tileKey(col, row);
      this.buildableTiles.set(key, tile);
    }
  }

  private setupInput() {
    this.input.on('gameobjectover', (_pointer, gameObject) => {
      const entry = [...this.buildableTiles.entries()].find(([, rect]) => rect === gameObject);
      if (!entry) return;
      const [key, rect] = entry;
      if (this.getTowerAtKey(key)) return;
      this.hoveredTileKey = key;
      rect.setFillStyle(COLORS.buildableHover);
    });

    this.input.on('gameobjectout', (_pointer, gameObject) => {
      const entry = [...this.buildableTiles.entries()].find(([, rect]) => rect === gameObject);
      if (!entry) return;
      const [key, rect] = entry;
      if (this.getTowerAtKey(key)) return;
      rect.setFillStyle(COLORS.buildable);
      if (this.hoveredTileKey === key) this.hoveredTileKey = null;
    });

    this.input.on('gameobjectdown', (_pointer, gameObject) => {
      const entry = [...this.buildableTiles.entries()].find(([, rect]) => rect === gameObject);
      if (!entry) return;
      const [key] = entry;
      this.tryBuildTower(key);
    });
  }

  private tryBuildTower(key: string) {
    if (this.status === 'win' || this.status === 'lose') return;
    if (this.getTowerAtKey(key)) {
      this.message = '这里已经有防御塔了';
      this.pushHud();
      return;
    }
    if (this.gold < GAME_BALANCE.towerCost) {
      this.message = '金币不足，无法建造';
      this.pushHud();
      return;
    }

    const { col, row } = this.parseTileKey(key);
    this.gold -= GAME_BALANCE.towerCost;
    this.towers.push(this.createTower(col, row));
    const tile = this.buildableTiles.get(key);
    tile?.setFillStyle(COLORS.tower, 0.35);
    this.message = '防御塔建造成功';
    this.pushHud();
  }

  private createTower(col: number, row: number): TowerData {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    const container = this.add.container(x, y);

    const body = this.add.circle(0, 0, 16, COLORS.tower);
    const gun = this.add.rectangle(0, -10, 8, 18, COLORS.towerGun);
    const label = this.add.text(0, 18, 'Lv1', {
      fontSize: '12px',
      color: '#ffe066',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 0);

    container.add([body, gun, label]);

    const rangeCircle = this.add.circle(x, y, GAME_BALANCE.towerRange, COLORS.tower, 0.08);
    rangeCircle.setStrokeStyle(1, COLORS.tower, 0.25);
    rangeCircle.setVisible(false);

    container.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
    container.on('pointerover', () => {
      rangeCircle.setVisible(true);
    });
    container.on('pointerout', () => {
      rangeCircle.setVisible(false);
    });

    return {
      col,
      row,
      level: 1,
      lastAttack: 0,
      sprite: container,
      rangeCircle,
    };
  }

  private spawnEnemy() {
    const start = this.level.waypoints[0];
    const container = this.add.container(start.x, start.y);
    const body = this.add.circle(0, 0, 14, COLORS.enemy);
    const eye = this.add.circle(4, -2, 3, 0xffffff);
    container.add([body, eye]);

    const hpBar = this.add.graphics();
    container.add(hpBar);

    const enemy: EnemyData = {
      hp: GAME_BALANCE.enemyHp,
      maxHp: GAME_BALANCE.enemyHp,
      speed: GAME_BALANCE.enemySpeed,
      waypointIndex: 0,
      sprite: container,
      hpBar,
    };

    this.updateEnemyHpBar(enemy);
    this.enemies.push(enemy);
    this.spawnedCount += 1;
    this.pushHud();
  }

  private moveEnemies(delta: number) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const target = this.level.waypoints[enemy.waypointIndex + 1];

      if (!target) {
        this.enemyReachedBase(enemy, i);
        continue;
      }

      const dx = target.x - enemy.sprite.x;
      const dy = target.y - enemy.sprite.y;
      const distance = Math.hypot(dx, dy);
      const step = (enemy.speed * delta) / 1000;

      if (distance <= step) {
        enemy.sprite.setPosition(target.x, target.y);
        enemy.waypointIndex += 1;
        if (enemy.waypointIndex >= this.level.waypoints.length - 1) {
          this.enemyReachedBase(enemy, i);
        }
      } else {
        enemy.sprite.x += (dx / distance) * step;
        enemy.sprite.y += (dy / distance) * step;
      }
    }
  }

  private enemyReachedBase(enemy: EnemyData, index: number) {
    enemy.sprite.destroy();
    this.enemies.splice(index, 1);
    this.lives -= 1;
    this.message = '敌人突破了防线！';

    if (this.lives <= 0) {
      this.lives = 0;
      this.status = 'lose';
      this.message = '防守失败，可以重新开始';
      this.spawnTimer?.remove(false);
    }

    this.pushHud();
  }

  private towersAttack(time: number) {
    this.towers.forEach((tower) => {
      if (time - tower.lastAttack < GAME_BALANCE.towerAttackInterval) return;

      const target = this.findTarget(tower);
      if (!target) return;

      tower.lastAttack = time;
      target.hp -= GAME_BALANCE.towerDamage;
      this.showAttackEffect(tower, target);
      this.updateEnemyHpBar(target);

      if (target.hp <= 0) {
        this.killEnemy(target);
        this.gold += 8;
        this.message = '击败敌人，获得金币';
        this.pushHud();
      }
    });
  }

  private findTarget(tower: TowerData): EnemyData | null {
    let nearest: EnemyData | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(
        tower.sprite.x,
        tower.sprite.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      if (distance <= GAME_BALANCE.towerRange && distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  private showAttackEffect(tower: TowerData, enemy: EnemyData) {
    const line = this.add.line(
      0,
      0,
      tower.sprite.x,
      tower.sprite.y,
      enemy.sprite.x,
      enemy.sprite.y,
      COLORS.bullet,
    );
    line.setLineWidth(3);
    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 120,
      onComplete: () => line.destroy(),
    });
  }

  private killEnemy(enemy: EnemyData) {
    const index = this.enemies.indexOf(enemy);
    if (index >= 0) {
      enemy.sprite.destroy();
      this.enemies.splice(index, 1);
    }
  }

  private updateEnemyHpBar(enemy: EnemyData) {
    enemy.hpBar.clear();
    const width = 28;
    const ratio = Math.max(enemy.hp / enemy.maxHp, 0);
    enemy.hpBar.fillStyle(0x000000, 0.5);
    enemy.hpBar.fillRect(-width / 2, -24, width, 5);
    enemy.hpBar.fillStyle(ratio > 0.4 ? 0x2ecc71 : 0xe74c3c, 1);
    enemy.hpBar.fillRect(-width / 2, -24, width * ratio, 5);
  }

  private checkWaveEnd() {
    if (this.status !== 'playing') return;
    if (this.spawnedCount < GAME_BALANCE.waveEnemyCount) return;
    if (this.enemies.length > 0) return;

    this.status = 'win';
    this.message = '成功守住第一波！';
    this.spawnTimer?.remove(false);
    this.pushHud();
  }

  private getTowerAtKey(key: string) {
    const { col, row } = this.parseTileKey(key);
    return this.towers.find((tower) => tower.col === col && tower.row === row);
  }

  private tileKey(col: number, row: number) {
    return `${col},${row}`;
  }

  private parseTileKey(key: string) {
    const [col, row] = key.split(',').map(Number);
    return { col, row };
  }

  private pushHud() {
    const state: GameHudState = {
      gold: this.gold,
      lives: this.lives,
      wave: this.wave,
      enemiesAlive: this.enemies.length,
      enemiesTotal: GAME_BALANCE.waveEnemyCount,
      status: this.status,
      message: this.message,
    };
    this.onHudUpdate?.(state);
  }
}
