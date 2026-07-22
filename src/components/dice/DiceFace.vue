<template>
  <div
    class="dice-face"
    :class="[
      `dice-face--${shade}`,
      isRed ? 'dice-face--red' : 'dice-face--blue',
    ]"
    :style="faceStyle"
  >
    <div v-if="shade === 'top'" class="dice-face__shine" />
    <div v-for="cell in 9" :key="cell" class="dice-face__cell">
      <i
        v-if="hasDot(cell)"
        class="dice-face__dot"
        :class="{ 'dice-face__dot--large': value === 1 }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { FACE_DOTS, isRedFace } from './diceConstants';

const props = withDefaults(
  defineProps<{
    value: number;
    size?: number;
    shade?: 'top' | 'front' | 'right';
  }>(),
  {
    shade: 'top',
  },
);

const isRed = computed(() => isRedFace(props.value));

const faceStyle = computed(() => {
  const s = props.size ?? 52;
  return {
    '--face-size': `${s}px`,
    '--dot-size': `${Math.round(s * 0.2)}px`,
    '--dot-large': `${Math.round(s * 0.3)}px`,
    '--face-radius': `${Math.round(s * 0.22)}px`,
  };
});

function hasDot(cell: number) {
  return (FACE_DOTS[props.value] ?? []).includes(cell);
}
</script>

<style lang="less" scoped>
.dice-face {
  position: relative;
  width: var(--face-size);
  height: var(--face-size);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 11%;
  box-sizing: border-box;
  backface-visibility: hidden;

  /* 三棱交汇角保持直角，其余外角圆角，避免相交处露背景 */
  &--top {
    border-radius: var(--face-radius) var(--face-radius) 0 var(--face-radius);
    background: linear-gradient(155deg, #ffffff 0%, #f7f7f7 55%, #ededed 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95);
  }

  &--front {
    border-radius: var(--face-radius) 0 var(--face-radius) var(--face-radius);
    background: linear-gradient(180deg, #f5f5f5 0%, #e6e6e6 100%);
    box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.06);
  }

  &--right {
    border-radius: var(--face-radius) 0 var(--face-radius) var(--face-radius);
    background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
    box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.08);
  }

  &__shine {
    position: absolute;
    top: 8%;
    left: 12%;
    width: 38%;
    height: 28%;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(255, 255, 255, 0.85) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  &--red .dice-face__dot {
    background: radial-gradient(circle at 35% 30%, #e53935 0%, #b71c1c 50%, #8b0000 100%);
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.4),
      inset 0 -1px 1px rgba(255, 255, 255, 0.12),
      0 0 0 1px rgba(139, 0, 0, 0.25);
  }

  &--blue .dice-face__dot {
    background: radial-gradient(circle at 35% 30%, #283593 0%, #1a237e 50%, #0a1254 100%);
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.45),
      inset 0 -1px 1px rgba(255, 255, 255, 0.08),
      0 0 0 1px rgba(10, 18, 84, 0.35);
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  &__dot {
    display: block;
    width: var(--dot-size);
    height: var(--dot-size);
    border-radius: 50%;

    &--large {
      width: var(--dot-large);
      height: var(--dot-large);
    }
  }
}
</style>
