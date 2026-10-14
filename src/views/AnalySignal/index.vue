<template>
  <!-- 暂接入iframe -->
  <!-- <div class="dashboard">
    <iframe :src="dashboardUrl" scrolling="no" width="100%" height="100%" frameborder="0" overf></iframe>
  </div> -->

  <DataAnaly :mode="1"></DataAnaly>
  <div></div>
</template>

<script setup lang="ts">
  import { onMounted } from "vue";
  import { replaceUrlQuery } from "/@/utils/router";
  import DataAnaly from "/@/views/DataAnaly/index.vue";
  import { useRouter } from "vue-router";
  // 祈禧产线
  // const dashboardUrl = `http://47.100.109.92:8121/dashboard/home?lineId=11&isIframe=true&token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJxaXhpMDAxIiwiYXV0aCI6IiIsImV4cCI6MTcwNTYyNjU3MX0.bQSjHttawgvxYjlfjkteyd__Ut7cLidN825yGFXAMkA&t=${Date.now()}`;
  // 宁大科院产线
  // const dashboardUrl = `http://47.100.109.92:8121/dashboard/home?lineId=15&isIframe=true&token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuZGt5IiwiYXV0aCI6IiIsImV4cCI6MTcwNjA2MzgwMX0.8pNuUWfWdcm9kUT7pqFUorp8TeYLm7rh2zlQrm7U_Ps&t=${Date.now()}`;
</script>

<style lang="less" scoped>
  .dashboard {
    width: calc(100vw - 200px - 80px);
    height: calc(100vh - 52px - 80px);
  }
</style>
