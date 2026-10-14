import { RouteLocationMatched } from "vue-router";
import { AppRouteRecordRaw } from "/@/router/types";

export type BreadcrumbRouteItem = RouteLocationMatched | AppRouteRecordRaw;
