<template>
  <div class="flow-node flow-node--decision">
    <Handle type="target" :position="Position.Top" />
    <Handle type="target" :position="Position.Left" id="left" />
    <FlowNodeLabel />
    <Handle type="source" :position="Position.Right" id="right" />
    <Handle type="source" :position="Position.Bottom" id="bottom" />
  </div>
</template>

<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core';
import FlowNodeLabel from './FlowNodeLabel.vue';
</script>
