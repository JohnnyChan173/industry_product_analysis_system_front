import type { AppRouteRecordRaw } from "../types";
import { NOT_FOUND_PAGE_NAME, ROOT_PAGE_NAME } from "../config";
import { FundProjectionScreenOutlined, PartitionOutlined } from "@ant-design/icons-vue";

const Layout = () => import("/@/layouts/index.vue");

const privateRoutes: Array<AppRouteRecordRaw> = [
  {
    path: "/",
    name: ROOT_PAGE_NAME,
    redirect: "/dashboard",
    meta: {
      title: "",
      hideBreadcrumb: true,
      hideMenu: true,
    },
  },

  // 未知路径
  {
    path: "/:path(.*)*",
    name: NOT_FOUND_PAGE_NAME,
    redirect: "/",
    meta: {
      title: "",
      hideMenu: true,
    },
  },
];

/** 生成权限路由 */
export function genPrivateRoutes(routes: any[]) {
  // 设置跳转路径为第一个路由
  const redirectRootPath = routes[0].path;

  const headerRoutes = [
    {
      path: "/",
      name: ROOT_PAGE_NAME,
      redirect: redirectRootPath,
      meta: {
        title: "",
        hideBreadcrumb: true,
        hideMenu: true,
      },
    },
  ];

  const footerRoutes = [
    {
      path: "/:path(.*)*",
      name: NOT_FOUND_PAGE_NAME,
      redirect: "/",
      meta: {
        title: "",
        hideMenu: true,
      },
    },
  ];

  const wholeRoutes = Array.from([...headerRoutes, ...routes, ...footerRoutes]);

  return wholeRoutes;
}

export default privateRoutes;
