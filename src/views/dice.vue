<template>
  <div class="dice-page">
    <header class="dice-page__header">
      <Button type="text" class="dice-page__back" @click="goBack">← 返回</Button>
      <h1 class="dice-page__title">摇骰子</h1>
    </header>

    <main class="dice-page__main">
      <div class="dice-page__board">
        <div
          v-for="(value, index) in diceValues"
          :key="index"
          class="dice-page__dice-wrap"
        >
          <DiceCube :value="value" :rolling="rolling" :size="diceSize" />
        </div>
      </div>

      <p class="dice-page__result">
        <template v-if="rolling">骰子滚动中...</template>
        <template v-else-if="hasRolled">
          点数：<strong>{{ total }}</strong>
          <span v-if="diceCount > 1" class="dice-page__detail">（{{ diceValues.join(' + ') }}）</span>
        </template>
        <template v-else>点击下方按钮开始摇骰子</template>
      </p>

      <div class="dice-page__controls">
        <span class="dice-page__label">骰子数量</span>
        <RadioGroup v-model:value="diceCount" :disabled="rolling">
          <RadioButton :value="1">1 个</RadioButton>
          <RadioButton :value="2">2 个</RadioButton>
          <RadioButton :value="3">3 个</RadioButton>
        </RadioGroup>
      </div>

      <Button
        type="primary"
        size="large"
        class="dice-page__btn"
        :loading="rolling"
        @click="rollDice"
      >
        {{ rolling ? '摇动中...' : '摇一摇' }}
      </Button>

      <p v-if="history.length" class="dice-page__history-title">最近记录</p>
      <ul v-if="history.length" class="dice-page__history">
        <li v-for="(item, i) in history" :key="i">
          第 {{ history.length - i }} 次：{{ item.values.join(' + ') }} = {{ item.total }}
        </li>
      </ul>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Radio } from 'ant-design-vue';
import DiceCube from '@/components/dice/DiceCube.vue';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const router = useRouter();
const diceCount = ref(1);
const diceValues = ref<number[]>([1]);
const rolling = ref(false);
const hasRolled = ref(false);
const history = ref<{ values: number[]; total: number }[]>([]);

const diceSize = computed(() => (diceCount.value === 1 ? 52 : diceCount.value === 2 ? 48 : 44));
const total = computed(() => diceValues.value.reduce((sum, v) => sum + v, 0));

function randomDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function goBack() {
  router.push('/home');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rollDice() {
  if (rolling.value) return;

  rolling.value = true;
  hasRolled.value = true;

  const duration = 1200;
  const interval = 80;
  const start = Date.now();

  while (Date.now() - start < duration) {
    diceValues.value = Array.from({ length: diceCount.value }, randomDice);
    await sleep(interval);
  }

  const finalValues = Array.from({ length: diceCount.value }, randomDice);
  diceValues.value = finalValues;
  rolling.value = false;

  history.value.unshift({
    values: [...finalValues],
    total: finalValues.reduce((s, v) => s + v, 0),
  });
  if (history.value.length > 8) {
    history.value.pop();
  }
}

watch(diceCount, (count) => {
  diceValues.value = Array.from({ length: count }, () => 1);
  hasRolled.value = false;
});
</script>

<style lang="less" scoped>
.dice-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #1e3a5f 0%, #0f172a 50%, #1a1a2e 100%);
  color: #fff;

  &__header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 8px;
  }

  &__back {
    color: rgba(255, 255, 255, 0.75) !important;

    &:hover {
      color: #fff !important;
    }
  }

  &__title {
    margin: 0;
    flex: 1;
    text-align: center;
    padding-right: 48px;
    font-size: 20px;
    font-weight: 600;
  }

  &__main {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 20px 48px;
    text-align: center;
  }

  &__board {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    min-height: 120px;
    padding: 32px 20px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 24px;
  }

  &__dice-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__result {
    margin: 0 0 24px;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.85);
    min-height: 28px;

    strong {
      font-size: 28px;
      color: #ffd666;
      margin: 0 4px;
    }
  }

  &__detail {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.55);
  }

  &__controls {
    margin-bottom: 28px;

    :deep(.ant-radio-button-wrapper) {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.75);

      &:hover {
        color: #fff;
      }

      &-checked {
        background: var(--color-primary, #516bd9) !important;
        border-color: var(--color-primary, #516bd9) !important;
        color: #fff !important;
      }
    }
  }

  &__label {
    display: block;
    margin-bottom: 10px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
  }

  &__btn {
    min-width: 160px;
    height: 48px;
    font-size: 16px;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(81, 107, 217, 0.45);
  }

  &__history-title {
    margin: 36px 0 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
  }

  &__history {
    list-style: none;
    margin: 0;
    padding: 0;
    text-align: left;
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;

    li {
      padding: 8px 12px;
      margin-bottom: 6px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
    }
  }
}
</style>
