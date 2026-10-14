import { RouteLocationNormalized } from "vue-router";
import { LOGIN_PATH } from "./config";
import type { AppRouteRecordRaw } from "./types";
import { PartitionOutlined } from "@ant-design/icons-vue";
import { cloneDeep } from "lodash";

const Layout = () => import("/@/layouts/index.vue");

// 取自jeecg
const viewsModules = import.meta.glob("../views/**/*.vue");
const ryViewsModules = import.meta.glob("../ruoyi/views/**/*.vue");

export function importViewsFile(path: string) {
  // console.log(path);
  let modules = viewsModules;
  if (path.startsWith("ruoyi")) {
    modules = ryViewsModules;
  }

  if (path.startsWith("/")) {
    path = path.substring(1);
  }
  let page = "";
  if (path.endsWith(".vue")) {
    page = `../${path}`;
  } else {
    page = `../${path}.vue`;
  }

  for (const path in modules) {
    if (path == page) {
      const result = modules[path];
      // console.log(result);
      return result;
    }
  }
}

/** 路由对象是否 匹配路由表内路由 */
export function checkRouteMatchRoutes(r: RouteLocationNormalized, routes: AppRouteRecordRaw[]): boolean {
  const { matched } = r;
  if (matched.length) {
    return !!matched.find((i) => !!routes.find((j) => j.path === i.path));
  }
  return false;
}

/** 检测路由对象是否为登录路由 */
export function checkRouteIsLoginRoute(r: RouteLocationNormalized): boolean {
  return r.path === LOGIN_PATH;
}

/** 若依路由转定制路由 */
export function transferRyRouters(routes: any, level = 0): any[] {
  const genRoutes = [];
  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];

    const { path, menuName, children, visible, component, activeMenu } = r;

    const pr = {
      path: path,
      // name: path,
      meta: {
        title: menuName,
        icon: PartitionOutlined, // 暂时固定
        hideMenu: visible !== "0",
        activeMenu,
      },
      component: Layout, // 默认是Layout
      children: [] as any,
    } as any;

    // 如果level是0 则 component是 Layout
    if (level > 0) {
      // console.log(level, pr);
      pr.component = importViewsFile(component);
    }

    if (children && children.length) {
      // 递归
      pr.children = transferRyRouters(children, level + 1);

      // 如果children存在，则取子路由的第0个，作为父路由重定向路径
      if (children.length > 0) {
        pr.redirect = children[0].path;
      }
    }

    genRoutes.push(pr);
  }

  return genRoutes;
}

/** 扁平化路由为二级 */
export function flatRoutes(routes: any): any[] {
  const rs = cloneDeep(routes);

  rs.forEach((r: any) => {
    // 二级菜单有
    if (r.children && r.children.length > 0) {
      r.children = [...r.children].concat(...r.children.map((j: any) => j.children));
    }
  });

  return rs;
}
