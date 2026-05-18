<template>
  <aside class="flow-sidebar">
    <h3 class="flow-sidebar__title">流程控件</h3>
    <p class="flow-sidebar__hint">拖拽到右侧画布，放置后可双击改名</p>
    <ul class="flow-sidebar__list">
      <li
        v-for="item in paletteItems"
        :key="item.type"
        class="flow-sidebar__item"
        :class="`flow-sidebar__item--${item.type}`"
        draggable="true"
        @dragstart="onDragStart($event, item.type)"
      >
        <span class="flow-sidebar__shape" :class="`flow-sidebar__shape--${item.type}`" />
        <span class="flow-sidebar__name">{{ item.label }}</span>
      </li>
    </ul>
  </aside>
</template>

<script lang="ts" setup>
import { PALETTE_ITEMS, type FlowNodeType } from './nodes';

const paletteItems = PALETTE_ITEMS;

const DND_TYPE = 'application/vueflow';

function onDragStart(event: DragEvent, type: FlowNodeType) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData(DND_TYPE, type);
  event.dataTransfer.effectAllowed = 'move';
}
</script>
