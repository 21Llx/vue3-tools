<template>
  <div>
    <div>portal</div>
    <div id="container"></div>
  </div>
</template>
<script lang="ts" setup>
import { registerMicroApps, start } from "qiankun";
import { onMounted } from "vue";


registerMicroApps([
  {
    name: "vue2-template", // app name registered
    entry: "//localhost:8080",
    container: "#container",
    activeRule: "/app",
    props: {
      name: "app",
    },
  },
  {
    name: "vue2-template2", // app name registered
    entry: "//localhost:8080",
    container: "#container",
    activeRule: "/app/about",
    props: {
      name: "appabout",
    },
  },
]);
if (!window.qiankunStarted) {
  window.qiankunStarted = true;
  start();
}
onMounted(() => {
  console.log("mounted");
});
</script>
<style lang="less" scoped></style>
