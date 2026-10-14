import type { AppRouteRecordRaw } from "./types";
import { createRouter, createWebHistory, RouterLink } from "vue-router";
import constantRoutes from "./routes/constant";
import privateRoutes from "./routes/private";
import commonRoutes from "./routes/common";
import { UserType } from "/@/enums/model";
import { cloneDeep } from "lodash-es";
import { useAppStore, useUserRoutesStore } from "../store";
import { unref } from "vue";

/** 默认是常量路由 */
const routes: AppRouteRecordRaw[] = [...constantRoutes];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

/** 改写 router.back  */
const backHandler = router.back;
router.back = function (...args) {
  if (!this) {
    return backHandler.apply(this, args);
  }

  const { name } = unref(this.currentRoute);

  // 直接移除该路由的缓存
  const { cachedRoutes, setCachedRoutes } = useAppStore();
  const l = cachedRoutes.filter((curName) => curName !== name);
  setCachedRoutes(l);

  return backHandler.apply(this, args);
};

/** 改写 router.push */
const pushkHandler = router.push;
router.push = function (...args) {
  if (!this) {
    return pushkHandler.apply(this, args);
  }

  const { meta } = unref(this.currentRoute);

  const { setCachedRoutes } = useAppStore();

  if (meta.clearCached) {
    setCachedRoutes([]);
  }

  return pushkHandler.apply(this, args);
};

/** 改写 router.replace */
const replacekHandler = router.replace;
router.replace = function (...args) {
  if (!this) {
    return replacekHandler.apply(this, args);
  }
  console.log(this, this.currentRoute);
  const { meta } = unref(this.currentRoute);

  const { setCachedRoutes } = useAppStore();

  if (meta.clearCached) {
    setCachedRoutes([]);
  }

  return replacekHandler.apply(this, args);
};

/**
 * 重置路由
 * @param routes 新路由数组
 */
export function resetRouter(routes: AppRouteRecordRaw[]) {
  // 先移除全部 route
  router.getRoutes().forEach((route) => {
    const { name } = route;
    if (name) {
      router.hasRoute(name) && router.removeRoute(name);
    }
  });

  // 推入新 routes
  routes.forEach((route) => {
    router.addRoute(route);
  });
}

/**
 * 根据角色类型过滤路由
 */
export function filterRoutesByUserType(routes: AppRouteRecordRaw[], type: UserType): AppRouteRecordRaw[] {
  // 路由过滤 可能会导致堆值删除 需要深拷贝
  routes = cloneDeep(routes);
  console.log(routes);

  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    const { meta } = r;
    const { roles } = meta;
    // 有roles
    if (roles && roles.length) {
      // 且用户类型 不匹配，清除路由
      if (!roles.includes(type)) {
        delete routes[i];
        routes.splice(i, 1);
      }
    }

    if (r.children && r.children.length) {
      r.children = filterRoutesByUserType(r.children, type);
    }
  }

  return routes;
}

export { router as default, constantRoutes, privateRoutes, commonRoutes };
