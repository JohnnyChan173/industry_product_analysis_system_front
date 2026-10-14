import { ROOT_PAGE_NAME } from "../config";
import type { AppRouteRecordRaw } from "../types";
import Login from "/@/views/Login/index.vue";

const constantRoutes: Array<AppRouteRecordRaw> = [
  {
    path: "/",
    name: ROOT_PAGE_NAME,
    redirect: "/login", // 默认重定向到登录页
    meta: {
      title: "",
    },
  },
  {
    path: "/login",
    name: "Login",
    meta: {
      title: "登录",
    },
    component: Login,
  },
];

export default constantRoutes;
