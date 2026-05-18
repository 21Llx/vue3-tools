<script lang="ts" setup>
import { useVueFlow } from '@vue-flow/core';

const { fitView } = useVueFlow();

function fit() {
  fitView({ padding: 0.2, duration: 300 });
}

defineExpose({ fit });
</script>

<template />
