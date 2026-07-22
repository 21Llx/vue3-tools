<template>
  <div class="dice-scene" :style="sceneStyle">
    <div class="dice-scene__shadow" />
    <div
      class="dice-cube"
      :class="{ 'dice-cube--rolling': rolling }"
    >
      <!-- 内层直角白面，垫在圆角面下方填补相交处空隙 -->
      <div class="dice-cube__inner dice-cube__inner--top" />
      <div class="dice-cube__inner dice-cube__inner--front" />
      <div class="dice-cube__inner dice-cube__inner--right" />

      <div class="dice-cube__face dice-cube__face--top">
        <DiceFace :value="topValue" :size="faceSize" shade="top" />
      </div>
      <div class="dice-cube__face dice-cube__face--front">
        <DiceFace :value="frontValue" :size="faceSize" shade="front" />
      </div>
      <div class="dice-cube__face dice-cube__face--right">
        <DiceFace :value="rightValue" :size="faceSize" shade="right" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import DiceFace from './DiceFace.vue';
import { DICE_NEIGHBORS } from './diceConstants';

const props = defineProps<{
  value: number;
  rolling?: boolean;
  size?: number;
}>();

const faceSize = computed(() => props.size ?? 52);
const half = computed(() => faceSize.value / 2);
const overlap = computed(() => Math.max(2, Math.round(faceSize.value * 0.03)));

const topValue = computed(() => {
  const v = props.value;
  return v >= 1 && v <= 6 ? v : 1;
});

const frontValue = computed(() => DICE_NEIGHBORS[topValue.value]?.front ?? 2);
const rightValue = computed(() => DICE_NEIGHBORS[topValue.value]?.right ?? 3);

const sceneStyle = computed(() => ({
  '--face-size': `${faceSize.value}px`,
  '--face-half': `${half.value}px`,
  '--face-overlap': `${overlap.value}px`,
}));
</script>

<style lang="less" scoped>
.dice-scene {
  position: relative;
  width: calc(var(--face-size) * 1.55);
  height: calc(var(--face-size) * 1.65);
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 900px;
  perspective-origin: 50% 42%;
  transform-style: preserve-3d;

  &__shadow {
    position: absolute;
    bottom: 6%;
    left: 50%;
    width: calc(var(--face-size) * 1.1);
    height: calc(var(--face-size) * 0.22);
    margin-left: calc(var(--face-size) * -0.55);
    background: radial-gradient(ellipse, rgba(0, 0, 0, 0.35) 0%, transparent 70%);
    transform: rotateX(78deg);
    pointer-events: none;
  }
}

.dice-cube {
  position: relative;
  width: var(--face-size);
  height: var(--face-size);
  transform-style: preserve-3d;
  transform: rotateX(-40deg) rotateY(-32deg);

  &--rolling {
    animation: dice-wobble 0.13s ease-in-out infinite;
  }

  &__inner {
    position: absolute;
    width: calc(var(--face-size) + var(--face-overlap) * 2);
    height: calc(var(--face-size) + var(--face-overlap) * 2);
    left: calc(var(--face-overlap) * -1);
    top: calc(var(--face-overlap) * -1);
    background: #f8f8f8;
    backface-visibility: hidden;

    &--top {
      transform: rotateX(90deg) translateZ(calc(var(--face-half) - 1px));
    }

    &--front {
      transform: translateZ(calc(var(--face-half) - 1px));
    }

    &--right {
      transform: rotateY(90deg) translateZ(calc(var(--face-half) - 1px));
    }
  }

  &__face {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--face-size);
    height: var(--face-size);
    transform-style: preserve-3d;

    &--top {
      transform: rotateX(90deg) translateZ(var(--face-half));
    }

    &--front {
      transform: translateZ(var(--face-half));
    }

    &--right {
      transform: rotateY(90deg) translateZ(var(--face-half));
    }
  }
}

@keyframes dice-wobble {
  0%,
  100% {
    transform: rotateX(-40deg) rotateY(-32deg) translateY(0);
  }
  50% {
    transform: rotateX(-36deg) rotateY(-28deg) translateY(-4px);
  }
}
</style>
