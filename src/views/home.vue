<template>
  <div class="home">
    home
    <Button @click="toQiankun">跳转 微应用</Button>
    <Button @click="toFlowchart">流程图设计器</Button>
  </div>
</template>
<script lang='ts' setup>
import { Button } from "ant-design-vue";
import { useRouter } from "vue-router";
const router = useRouter();
const toQiankun = () => {
  router.push('/app')
};
const toFlowchart = () => {
  router.push('/flowchart');
};
</script>
<style lang='less' scoped>

</style>