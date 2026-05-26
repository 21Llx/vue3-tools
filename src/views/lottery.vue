<template>
  <div class="lottery-page">
    <header class="lottery-page__header">
      <Button type="text" class="lottery-page__back" @click="goBack">← 返回</Button>
      <h1 class="lottery-page__title">幸运抽奖</h1>
    </header>

    <div class="lottery-page__scene">
      <div
        class="lottery-sphere"
        :class="sphereClass"
        :style="{ '--spin-duration': spinDuration }"
      >
        <span
          v-for="(name, index) in displayNames"
          :key="`${name}-${index}`"
          class="lottery-tag"
          :class="{ 'lottery-tag--winner': index === winnerIndex }"
          :style="{ transform: tagTransforms[index] }"
        >{{ name }}</span>
      </div>
      <div class="lottery-page__glow" />
    </div>

    <div class="lottery-page__actions">
      <Button
        type="primary"
        size="large"
        class="lottery-page__btn"
        :loading="drawing"
        :disabled="displayNames.length === 0"
        @click="startDraw"
      >
        {{ drawing ? '抽奖中...' : '开始抽奖' }}
      </Button>
      <p v-if="displayNames.length === 0" class="lottery-page__warn">请至少添加一个参与人</p>
    </div>

    <section class="lottery-page__names">
      <h3>参与名单（每行一个名字）</h3>
      <Textarea
        v-model:value="namesText"
        :rows="6"
        placeholder="每行输入一个名字"
        :disabled="drawing"
      />
      <Button size="small" :disabled="drawing" @click="applyNames">更新名单</Button>
    </section>

    <Modal
      v-model:open="resultVisible"
      title="🎉 抽奖结果"
      :footer="null"
      centered
      @cancel="resultVisible = false"
    >
      <div class="lottery-page__result">
        <p class="lottery-page__result-label">恭喜</p>
        <p class="lottery-page__result-name">{{ winner }}</p>
      </div>
      <Button type="primary" block @click="resultVisible = false">确定</Button>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Modal, Input, message } from 'ant-design-vue';
import { fibonacciSphere, getTagTransform } from '@/components/lottery/sphereMath';

const Textarea = Input.TextArea;

const DEFAULT_NAMES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑一', '王二', '冯三', '陈四', '褚五', '卫六', '蒋七', '沈八',
  '韩九', '杨十', '朱明', '秦芳', '尤亮', '许静', '何涛', '吕娜',
  '施强', '张伟', '孔琳', '曹勇', '严慧', '华杰',
];


const SPHERE_RADIUS = 220;

const router = useRouter();
const displayNames = ref<string[]>([...DEFAULT_NAMES]);
const namesText = ref(DEFAULT_NAMES.join('\n'));
const drawing = ref(false);
const winner = ref('');
const winnerIndex = ref(-1);
const resultVisible = ref(false);
const spinPhase = ref<'idle' | 'fast' | 'slow' | 'stop'>('idle');

const spinDuration = computed(() => {
  if (spinPhase.value === 'fast') return '0.35s';
  if (spinPhase.value === 'slow') return '2.5s';
  if (spinPhase.value === 'stop') return '0s';
  return '15s';
});

const sphereClass = computed(() => ({
  'lottery-sphere--idle': spinPhase.value === 'idle',
  'lottery-sphere--drawing': spinPhase.value === 'fast' || spinPhase.value === 'slow',
  'lottery-sphere--stopped': spinPhase.value === 'stop',
}));

const tagTransforms = computed(() =>
  displayNames.value.map((_, i) =>
    getTagTransform(fibonacciSphere(i, displayNames.value.length, SPHERE_RADIUS)),
  ),
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function goBack() {
  router.push('/home');
}

function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function applyNames() {
  const list = parseNames(namesText.value);
  if (list.length === 0) {
    message.warning('名单不能为空');
    return;
  }
  displayNames.value = list;
  winnerIndex.value = -1;
  winner.value = '';
  message.success(`已更新 ${list.length} 人`);
}

async function startDraw() {
  if (drawing.value || displayNames.value.length === 0) return;

  drawing.value = true;
  winner.value = '';
  winnerIndex.value = -1;
  resultVisible.value = false;
  spinPhase.value = 'fast';

  await sleep(2400);
  spinPhase.value = 'slow';

  await sleep(2800);

  const index = Math.floor(Math.random() * displayNames.value.length);
  winnerIndex.value = index;
  winner.value = displayNames.value[index];
  spinPhase.value = 'stop';
  drawing.value = false;
  resultVisible.value = true;

  await sleep(800);
  spinPhase.value = 'idle';
}

onMounted(() => {
  namesText.value = displayNames.value.join('\n');
});
</script>

<style lang="less" scoped>
.lottery-page {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 30%, #1a2744 0%, #0d1117 55%, #06080c 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 40px;

  &__header {
    width: 100%;
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
    font-size: 20px;
    font-weight: 600;
    flex: 1;
    text-align: center;
    padding-right: 48px;
  }

  &__scene {
    position: relative;
    width: 100%;
    max-width: 520px;
    height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
  }

  &__glow {
    position: absolute;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(81, 107, 217, 0.35) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  &__actions {
    margin-top: 8px;
    text-align: center;
  }

  &__btn {
    min-width: 160px;
    height: 48px;
    font-size: 16px;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(81, 107, 217, 0.5);
  }

  &__warn {
    margin: 8px 0 0;
    font-size: 13px;
    color: #ff7875;
  }

  &__names {
    width: 100%;
    max-width: 480px;
    margin-top: 28px;
    padding: 0 20px;

    h3 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.65);
    }

    :deep(.ant-input) {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      color: #fff;
      margin-bottom: 10px;

      &::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
    }

    .ant-btn {
      color: rgba(255, 255, 255, 0.8);
      border-color: rgba(255, 255, 255, 0.25);
      background: transparent;
    }
  }

  &__result {
    text-align: center;
    padding: 16px 0 24px;
  }

  &__result-label {
    margin: 0;
    font-size: 14px;
    color: #999;
  }

  &__result-name {
    margin: 8px 0 0;
    font-size: 36px;
    font-weight: 700;
    color: var(--color-primary, #516bd9);
  }
}

.lottery-sphere {
  position: relative;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  z-index: 1;
  animation: sphere-rotate var(--spin-duration, 22s) linear infinite;

  &--idle {
    animation-play-state: running;
  }

  &--drawing {
    animation-play-state: running;
  }

  &--stopped {
    animation-play-state: paused;
  }
}

.lottery-tag {
  position: absolute;
  left: 0;
  top: 0;
  margin-left: -40px;
  margin-top: -14px;
  width: 80px;
  padding: 4px 6px;
  font-size: 13px;
  line-height: 1.3;
  text-align: center;
  color: rgba(255, 255, 255, 0.88);
  background: rgba(81, 107, 217, 0.25);
  border: 1px solid rgba(129, 151, 255, 0.45);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  transform-style: preserve-3d;
  backface-visibility: visible;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: box-shadow 0.3s, background 0.3s, transform 0.3s;
  pointer-events: none;

  &--winner {
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    background: linear-gradient(135deg, #f5a623, #f76b1c);
    border-color: #ffd666;
    box-shadow: 0 0 24px rgba(255, 193, 7, 0.8), 0 0 48px rgba(255, 152, 0, 0.4);
    z-index: 10;
    animation: winner-pulse 0.8s ease-in-out infinite alternate;
  }
}

@keyframes sphere-rotate {
  from {
    transform: rotateX(-12deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-12deg) rotateY(360deg);
  }
}

@keyframes winner-pulse {
  from {
    box-shadow: 0 0 16px rgba(255, 193, 7, 0.6);
  }
  to {
    box-shadow: 0 0 32px rgba(255, 193, 7, 1);
  }
}
</style>

<style lang="less">
.lottery-page__scene {
  perspective: 900px;
  perspective-origin: 50% 50%;
}
</style>
