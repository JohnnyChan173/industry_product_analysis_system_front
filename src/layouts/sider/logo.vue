<template>
  <div class="logo flex items-center justify-center">
    <div v-show="appState.siderCollapsed">
      <img :src="shortLogoImg" class="h-36px" />
    </div>
    <div v-show="!appState.siderCollapsed" class="flex items-center">
      <img :src="logoImg" class="h-36px" />
      <div class="text-16px">
        <p>{{ title }}</p>
        <p class="text-13px text-gray-400 mt-4px">[{{ userInfoStore.tenantInfo?.tenantName }}]</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useAppStore, useUserInfoStore } from "/@/store";
  import { useGlobSetting } from "/@/hooks/setting";
  import { getAssetsFile } from "/@/utils/util";

  const shortLogoImg = getAssetsFile("logo-short.png");
  const logoImg = getAssetsFile("logo2.png");

  const appState = useAppStore();
  const userInfoStore = useUserInfoStore();

  const { title } = useGlobSetting();
</script>

<style lang="less" scoped>
  .logo {
    width: @sider-width;
    height: @header-height;
    background: #fff;
    .center();
  }
  .collapsed .logo {
    width: @sider-collapsed-width;
  }
  p {
    margin-bottom: 0;
  }
</style>
