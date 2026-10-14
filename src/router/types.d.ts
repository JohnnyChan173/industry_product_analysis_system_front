import type { RouteMeta, RouteRecordRaw } from "vue-router";

// 路由对象可选化
export type AppRouteRecordRaw = RouteRecordRaw & {
  meta: RouteMeta;
  children?: AppRouteRecordRaw[];
};
