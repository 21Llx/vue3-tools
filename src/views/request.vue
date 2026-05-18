<template>
 <Button @click="requestDeptmentList">请求</Button>
</template>
<script lang='ts' setup>
import { Button } from "ant-design-vue";
import request from "@/utils/request"

const requestDeptmentList = () => {
  request({
    url: '/deptment/list',
    method: 'post',
  }).then(res => {
    console.log(res)
  })
}
</script>
<style lang='less' scoped>

</style> 