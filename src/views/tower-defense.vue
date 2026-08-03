<template>
  <div class="td-page">
    <header class="td-page__header">
      <Button type="text" class="td-page__back" @click="goBack">← 返回</Button>
      <div class="td-page__title-wrap">
        <h1 class="td-page__title">塔防试玩</h1>
        <span class="td-page__subtitle">守禅 · 第一关</span>
      </div>
    </header>

    <div class="td-page__body">
      <aside class="td-page__hud">
        <div class="td-page__panel">
          <div class="td-page__stat">
            <span>金币</span>
            <strong>{{ hud.gold }}</strong>
          </div>
          <div class="td-page__stat">
            <span>生命</span>
            <strong>{{ '❤'.repeat(hud.lives) || '—' }}</strong>
          </div>
          <div class="td-page__stat">
            <span>波次</span>
            <strong>{{ hud.wave }}</strong>
          </div>
          <div class="td-page__stat">
            <span>敌人</span>
            <strong>{{ hud.enemiesAlive }} / {{ hud.enemiesTotal }}</strong>
          </div>
        </div>

        <div class="td-page__tips">
          <p>1. 点击棕色格子放置塔（消耗 40 金币）</p>
          <p>2. 点击「开始波次」刷怪</p>
          <p>3. 阻止敌人到达右上角「守」</p>
        </div>

        <p class="td-page__message">{{ hud.message }}</p>

        <div class="td-page__actions">
          <Button
            type="primary"
            block
            :disabled="hud.status === 'playing' || hud.status === 'win'"
            @click="startWave"
          >
            开始波次
          </Button>
          <Button block @click="restartLevel">重新开始</Button>
        </div>

        <Alert
          v-if="hud.status === 'win'"
          type="success"
          show-icon
          message="守住第一波，后续关卡可以继续扩展。"
        />
        <Alert
          v-if="hud.status === 'lose'"
          type="error"
          show-icon
          message="防守失败，调整塔的位置后再试一次。"
        />
      </aside>

      <div ref="gameContainerRef" class="td-page__game" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Alert, Button } from 'ant-design-vue';
import type * as Phaser from 'phaser';
import { createTowerDefenseGame, getGameScene } from '@/game/tower-defense/createGame';
import type { GameHudState } from '@/game/tower-defense/types';

const router = useRouter();
const gameContainerRef = ref<HTMLElement>();
let game: Phaser.Game | null = null;

const hud = reactive<GameHudState>({
  gold: 80,
  lives: 5,
  wave: 1,
  enemiesAlive: 0,
  enemiesTotal: 10,
  status: 'ready',
  message: '点击棕色格子放置防御塔，然后开始波次',
});

function goBack() {
  router.push('/home');
}

function startWave() {
  if (!game) return;
  getGameScene(game).startWave();
}

function restartLevel() {
  if (!game) return;
  getGameScene(game).restartLevel();
}

onMounted(() => {
  if (!gameContainerRef.value) return;

  game = createTowerDefenseGame(gameContainerRef.value, (state) => {
    Object.assign(hud, state);
  });
});

onUnmounted(() => {
  game?.destroy(true);
  game = null;
});
</script>

<style lang="less" scoped>
.td-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4ea 0%, #f8faf7 100%);

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-bottom: 1px solid #e8eee5;
    background: rgba(255, 255, 255, 0.92);
  }

  &__back {
    padding-left: 0;
  }

  &__title-wrap {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  &__subtitle {
    color: #666;
    font-size: 14px;
  }

  &__body {
    display: flex;
    gap: 20px;
    padding: 20px 24px 32px;
    align-items: flex-start;
    justify-content: center;
    flex-wrap: wrap;
  }

  &__hud {
    width: 260px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: #666;

    strong {
      font-size: 18px;
      color: #1f1f1f;
    }
  }

  &__tips {
    padding: 14px 16px;
    border-radius: 12px;
    background: #fff;
    color: #666;
    font-size: 13px;
    line-height: 1.7;

    p {
      margin: 0;
    }
  }

  &__message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 10px;
    background: #eef5ff;
    color: #3b5998;
    font-size: 13px;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__game {
    width: min(100%, 680px);
    aspect-ratio: 10 / 7;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(35, 74, 42, 0.18);
    background: #234a2a;
  }
}

@media (max-width: 900px) {
  .td-page__body {
    flex-direction: column;
    align-items: stretch;
  }

  .td-page__hud {
    width: 100%;
  }

  .td-page__game {
    width: 100%;
  }
}
</style>
