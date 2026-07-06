<template>
  <div
    class="dice-face"
    :class="isRed ? 'dice-face--red' : 'dice-face--blue'"
    :style="faceStyle"
  >
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

const props = defineProps<{
  value: number;
  size?: number;
}>();

/** 3×3 格：1 2 3 / 4 5 6 / 7 8 9 */
const FACE_DOTS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 4, 7, 3, 6, 9],
};

const isRed = computed(() => props.value === 1 || props.value === 4);

const faceStyle = computed(() => {
  const s = props.size ?? 48;
  return {
    '--face-size': `${s}px`,
    '--dot-size': `${Math.round(s * 0.155)}px`,
    '--dot-large': `${Math.round(s * 0.2)}px`,
  };
});

function hasDot(cell: number) {
  return (FACE_DOTS[props.value] ?? []).includes(cell);
}
</script>

<style lang="less" scoped>
.dice-face {
  width: var(--face-size);
  height: var(--face-size);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 14%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #bbb;
  border-radius: 4px;

  &--red .dice-face__dot {
    background: radial-gradient(circle at 32% 28%, #ff5252, #c62828);
    box-shadow: 0 1px 2px rgba(198, 40, 40, 0.4);
  }

  &--blue .dice-face__dot {
    background: radial-gradient(circle at 32% 28%, #3949ab, #1a237e);
    box-shadow: 0 1px 2px rgba(26, 35, 126, 0.4);
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
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
