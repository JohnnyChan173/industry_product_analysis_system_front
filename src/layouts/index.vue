<template>
  <Layout class="main" :class="appState.siderCollapsed && 'collapsed'">
    <Layout.Sider class="sider" :collapsed="appState.siderCollapsed">
      <Logo />
      <MySider />
    </Layout.Sider>
    <Layout :style="{ display: 'block', width: 'auto' }">
      <MyHeader class="header" />
      <Layout.Content class="content p-20px">
        <div class="workspace p-20px bg-white relative" v-loading:absolute="appState.loading">
          <!-- 二级路由 -->
          <div class="min-h-360px" :class="appState.fullscreen && 'fullscreen'">
            <RouterView v-slot="{ Component }">
              <KeepAlive :include="appState.cachedRoutes">
                <component :is="Component" />
              </KeepAlive>
            </RouterView>
          </div>
        </div>
      </Layout.Content>
    </Layout>
  </Layout>
</template>

<script setup lang="ts">
  import { Layout } from "ant-design-vue";
  import { ref, unref, watch, KeepAlive } from "vue";
  import { RouterView, useRouter } from "vue-router";
  import { useAppStore } from "../store";
  import { duplicateArray, parseSearch } from "../utils/util";
  import MyHeader from "./header/index.vue";
  import MySider from "./sider/index.vue";
  import Logo from "./sider/logo.vue";

  const appState = useAppStore();
</script>

<style lang="less" scoped>
  .main {
  width: 100%;
  min-height: 100vh !important;
  height: auto !important;
}
  .sider {
    position: fixed;
    z-index: 1;
    top: 0;
    bottom: 0;
    left: 0;
    width: @sider-width;
  }
  .content {
    width: calc(100% - @sider-width);
    height: calc(100vh - @header-height);
    margin-top: @header-height;
    margin-left: @sider-width;
    min-width: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .workspace {
    // min-height: 320px;
    // max-width: @workspace-max-width;
    // min-height: calc(100vh - @header-height - 40px);
    border-radius: @border-radius;
  }

  &.collapsed .content {
  width: calc(100% - @sider-collapsed-width);
  margin-left: @sider-collapsed-width;
}
</style>
