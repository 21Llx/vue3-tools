<template>
  <div class="dice-scene" :style="sceneStyle">
    <div
      class="dice-cube"
      :class="{ 'dice-cube--rolling': rolling }"
    >
      <!-- 顶面：摇出的点数 -->
      <div class="dice-cube__face dice-cube__face--top">
        <DiceFace :value="topValue" :size="faceSize" />
      </div>
      <!-- 前面：相邻点数 -->
      <div class="dice-cube__face dice-cube__face--front">
        <DiceFace :value="frontValue" :size="faceSize" />
      </div>
      <!-- 右侧面：空白白面，连接顶/前形成立体棱角 -->
      <div class="dice-cube__face dice-cube__face--right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import DiceFace from './DiceFace.vue';

const props = defineProps<{
  value: number;
  rolling?: boolean;
  size?: number;
}>();

const FRONT_WHEN_TOP: Record<number, number> = {
  1: 2,
  2: 1,
  3: 2,
  4: 1,
  5: 6,
  6: 5,
};

const faceSize = computed(() => props.size ?? 44);
const half = computed(() => faceSize.value / 2);

const topValue = computed(() => {
  const v = props.value;
  return v >= 1 && v <= 6 ? v : 1;
});

const frontValue = computed(() => FRONT_WHEN_TOP[topValue.value] ?? 2);

const sceneStyle = computed(() => ({
  '--face-size': `${faceSize.value}px`,
  '--face-half': `${half.value}px`,
}));
</script>

<style lang="less" scoped>
.dice-scene {
  width: calc(var(--face-size) * 1.4);
  height: calc(var(--face-size) * 1.6);
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 600px;
  perspective-origin: 50% 40%;
}

.dice-cube {
  position: relative;
  width: var(--face-size);
  height: var(--face-size);
  transform-style: preserve-3d;
  transform: rotateX(-22deg) rotateY(-38deg);

  &--rolling {
    animation: dice-wobble 0.14s ease-in-out infinite;
  }

  &__face {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--face-size);
    height: var(--face-size);
    transform-style: preserve-3d;
    backface-visibility: visible;

    &--top {
      transform: rotateX(90deg) translateZ(var(--face-half));
    }

    &--front {
      transform: translateZ(var(--face-half));
    }

    &--right {
      background: #f5f5f5;
      border: 1px solid #aaa;
      border-radius: 3px;
      box-sizing: border-box;
      transform: rotateY(90deg) translateZ(var(--face-half));
    }
  }
}

@keyframes dice-wobble {
  0%,
  100% {
    transform: rotateX(-22deg) rotateY(-38deg) translateY(0);
  }
  50% {
    transform: rotateX(-18deg) rotateY(-34deg) translateY(-3px);
  }
}
</style>
