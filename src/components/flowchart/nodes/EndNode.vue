<template>
  <div class="flow-node flow-node--end">
    <Handle type="target" :position="Position.Top" />
    <FlowNodeLabel />
  </div>
</template>

<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core';
import FlowNodeLabel from './FlowNodeLabel.vue';
</script>
