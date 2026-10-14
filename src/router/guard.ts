import { message } from "ant-design-vue";
import { unref } from "vue";
import { Router, useRouter } from "vue-router";
import { createLoading } from "../components/Loading/createLoading";
import { CommonCheck } from "../enums/model";
import { useAppStore } from "../store";
import { useUserInfoStore, useUserRoutesStore } from "../store/modules/user";
import authStorage from "../utils/storage/auth";
import { duplicateArray } from "../utils/util";
import { REDRIECT_NAME } from "./config";
import constantRoutes from "./routes/constant";
import { checkRouteIsLoginRoute, checkRouteMatchRoutes } from "./utils";

const loginRoutePath = "/login";
const dashboardPath = "/dashboard";

export function setupRouterGuard(router: Router) {
  const { setLoading } = useAppStore();

  router.beforeEach(async (to, from, next) => {
    setLoading(true);

    // console.log("router beforeEach: ", to);
    const { getToken } = authStorage;
    const token = getToken();

    const { fullPath: toPath } = to;

    // 重定向至用户路由信息
    const rediect2LoginRouteInfo = {
      path: loginRoutePath,
      query: {
        [REDRIECT_NAME]: toPath,
      },
    };

    const userInfoStore = useUserInfoStore();
    const { loginWithToken, logout } = userInfoStore;

    // 1、无 token
    if (!token) {
      // 1.1 to 路径匹配 constantRoutes => next()
      const isConstantRoute = checkRouteMatchRoutes(to, constantRoutes);
      if (isConstantRoute) {
        next();
      } else {
        // 1.2 to 路径不匹配 constantRoutes => next({ path: "/login?rediect", replace: true })
        // 执行一次登出操作
        logout();
        // console.log("无token redirect记录: ", rediect2LoginRouteInfo);
        next({ ...rediect2LoginRouteInfo, replace: true });
        message.warn("登录态已过期，请重新登录");
      }
    } else {
      // ★ 如果有登录态，直接 next
      const { isLogin } = useUserInfoStore();

      if (isLogin) {
        next();
        console.log("next!!!!!!!!", to);
        return;
      }

      // 2、没有登录态, 有 token

      // 2.1 尝试 token 登录
      const rs = await loginWithToken();
      if (rs) {
        // 2.1.1 判断如果路由是登录页 => next({path:"/dashboard"})
        if (checkRouteIsLoginRoute(to)) {
          console.log("有token, 是登录页", to);

          // 这里确保动态路由逻辑已实现（即重置，不然会死循环）
          next({ path: to.path, replace: true });
        } else {
          // 2.1.2 页面非登录页  => next()
          console.log("有token, 不是登录页", to);

          next(to);
        }
      } else {
        // 2.2 根据令牌登录失败 => next({ path: "/login?rediect=", replace: true })
        next({ ...rediect2LoginRouteInfo, replace: true });
      }
    }
  });

  router.afterEach(async (to, from) => {
    // 1、to路由缓存标识检测，并处理
    const { cachedRoutes, setCachedRoutes } = useAppStore();

    const { name, query } = to;
    const catched = Number(query.catched) as number;
    const l = unref(cachedRoutes);

    if (catched === CommonCheck.TRUE) {
      // console.log("需要缓存：", catched);
      const ll = duplicateArray([...l, name]);
      setCachedRoutes(ll);
    }
    // console.log("已缓存路由:", cachedRoutes);

    // 2、关闭加载
    setLoading(false);
  });
}
