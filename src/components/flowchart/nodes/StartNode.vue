<template>
  <div class="flow-node flow-node--start">
    <FlowNodeLabel />
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core';
import FlowNodeLabel from './FlowNodeLabel.vue';
</script>
