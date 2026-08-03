<template>
  <div class="home">
    home
    <Button @click="toQiankun">跳转 微应用</Button>
    <Button @click="toFlowchart">流程图设计器</Button>
    <Button @click="toLottery">幸运抽奖</Button>
    <Button @click="toVerifyCode">验证码输入</Button>
    <Button @click="toDice">摇骰子</Button>
    <Button @click="toSpeech">文字朗读</Button>
    <Button @click="toTowerDefense">塔防试玩</Button>
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
const toLottery = () => {
  router.push('/lottery');
};
const toVerifyCode = () => {
  router.push('/verify-code');
};
const toDice = () => {
  router.push('/dice');
};
const toSpeech = () => {
  router.push('/speech');
};
const toTowerDefense = () => {
  router.push('/tower-defense');
};
</script>
<style lang='less' scoped>

</style>