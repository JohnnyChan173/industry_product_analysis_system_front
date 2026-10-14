import { defineStore } from "pinia";
import { Router } from "vue-router";
import { AppStateData } from "./types";

const defaultAppInfoState: AppStateData = {
  /** 侧边栏收缩 */
  siderCollapsed: false,

  /** 侧边栏默认是否全部展开 */
  defaultMenuSpreadAll: false,

  /** 路由加载（二级页） */
  loading: false,

  /** 路由实例（App.vue 主应用赋予） */
  router: undefined,

  /** 缓存路由名称 */
  cachedRoutes: [],

  /** 是否允许全局弹窗 */
  globalMessageAllowed: true,

  /** 路由全屏 */
  fullscreen: false,
};

/** 应用仓库 */
export const useAppStore = defineStore("app", {
  state: () => defaultAppInfoState,
  actions: {
    /** 设置全屏 */
    setFullscreen(mode: boolean) {
      this.fullscreen = mode;
    },

    toggleSiderCollapsed() {
      this.siderCollapsed = !this.siderCollapsed;
    },

    setSiderCollapsed(mode: boolean) {
      this.siderCollapsed = mode;
    },

    setLoading(mode: boolean) {
      this.loading = mode;
    },

    setRouter(router: Router) {
      // @ts-ignore
      this.router = router;
    },

    setCachedRoutes(routeNames: string[]) {
      this.cachedRoutes = routeNames;
    },

    setGlobalMessageAllowed(mode: boolean) {
      this.globalMessageAllowed = mode;
    },
  },
});
