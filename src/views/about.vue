<template>
<h1>about</h1>
<Button @click="goBack">home</Button>
<h1>Oper</h1>
</template>
<script lang='ts' setup>
import { Button } from "ant-design-vue";
import { useRouter } from "vue-router";
const router = useRouter();

const goBack = () => {
  router.go(-1);
};
</script>
<style lang='less' scoped>

</style> 