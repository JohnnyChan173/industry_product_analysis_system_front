import { defineStore } from "pinia";
import { UserAccountLogin, UserInfo, UserLoginData, UserPhoneLogin } from "/@/api/model/user";
import { userCurrentInfo, userLogin, userLogout, userPhoneLogin } from "/@/api/user";
import { PlatformRoleKey, UserType } from "../../enums/model";
import router, { commonRoutes, filterRoutesByUserType, resetRouter } from "../../router";
import { DASHBOARD_PATH, LOGIN_PATH, REDRIECT_NAME } from "../../router/config";
import constantRoutes from "../../router/routes/constant";
import { genPrivateRoutes } from "../../router/routes/private";
import { AppRouteRecordRaw } from "../../router/types";
import authStorage from "../../utils/storage/auth";
import { getPropertyValue, setPropertyValue } from "../../utils/typeTools";
import { delay, parseSearch } from "../../utils/util";
import { UserInfoStateData } from "./types";
import { message } from "ant-design-vue";
import { getRouters } from "/@/ruoyi/api/menu";
import { flatRoutes, transferRyRouters } from "/@/router/utils";
import { useRouter } from "vue-router";
import { PageEnum } from "/@/enums/pageEnum";
import { tenantDetail } from "/@/api/tenant";
import { TenantInfo } from "/@/api/model/tenant";
import { useDataStore } from "./data";
import { StaffInfo } from "/@/api/model/workshop";
import { lineGetManageLineId } from "/@/api/line";
import { useAppStore } from "./app";

const defaultUserInfoState: UserInfoStateData = {
  userId: undefined,
  userType: undefined,
  username: undefined,
  nickname: undefined,
  status: undefined,
  permissions: [],
  roles: [],
  tenantId: undefined,
  tenantInfo: undefined,
  staffInfo: undefined,
  /** 管理线体id */
  manageLineId: undefined,
};

/** 用户信息仓库 */
const useUserInfoStore = defineStore("userInfo", {
  state: () => {
    return { ...defaultUserInfoState };
  },
  getters: {
    isLogin: (state) => !!state.userId,
    isAdmin: (state) => !!state.roles?.includes(PlatformRoleKey.ADMIN),
    isMain: (state) => !!state.roles?.includes(PlatformRoleKey.MAIN),
    isXz: (state) => !!state.roles?.includes(PlatformRoleKey.XIANZHANG),
    isCg: (state) => !!state.roles?.includes(PlatformRoleKey.WAREHOUSE),
    isCjzr: (state) => !!state.roles?.includes(PlatformRoleKey.CJZR),
    isCggly: (state) => !!state.roles?.includes(PlatformRoleKey.GCGLY),
  },
  actions: {
    /** 登录 */
    async login(loginInfo: UserLoginData) {
      const { username, password, phone, verifyCode } = loginInfo;
      const { setToken, getToken } = authStorage;
      let token: string;
      if (username) {
        token = await userLogin(username!!, password!!);
      } else {
        token = await userPhoneLogin(phone!!, verifyCode!!);
      }
      // 存储 token
      setToken(token);

      // 通过token 完成后续登录
      await this.loginWithToken();
    },

    /** 根据令牌进行登录（非接口登录） */
    async loginWithToken() {
      const dataStore = useDataStore();
      const appStore = useAppStore();

      try {
        const rsData = (await userCurrentInfo()) as any;

        // 注入 permissions
        rsData.user.permissions = rsData.permissions;

        const info = rsData.user;
        const tenantId = info.tenantId;
        const tenantInfo = rsData.tenantInfo;
        const roles = rsData.roles;
        const staffInfo = rsData.staffInfo;

        console.log(rsData);
        
        // 注入 permissions

        this._setUserInfo(info);

        await dataStore.initData();

        this.tenantId = tenantId;
        this.tenantInfo = tenantInfo;
        this.roles = roles;
        this.staffInfo = staffInfo;

        // 侧边栏菜单按需展开
        if (this.isAdmin || this.isMain || this.isCggly) {
          appStore.defaultMenuSpreadAll = false;
        } else {
          appStore.defaultMenuSpreadAll = true;
        }

        // 如果是线长
        if (this.isXz) {
          // 获取线长管理线体id
          const manageLineId = await lineGetManageLineId();
          this.manageLineId = manageLineId;
        }

        await this._resetUserRoutes();

        // 获取用户路由第一个路由，即根路由
        const userRoutesStore = useUserRoutesStore();
        const toPath = userRoutesStore.routes[0] ? userRoutesStore.routes[0].path : DASHBOARD_PATH;

        // 解析 search
        const searchInfo = parseSearch();

        const redirectUrl = searchInfo[REDRIECT_NAME];
        // 如果存在重定向路径
        if (redirectUrl) {
          location.href = redirectUrl;
        } else {
          router.push(toPath);
        }

        return info;
      } catch (e) {
        console.log(e);

        // 退出
        this.logout();
      }
    },

    /** 重置用户路由 */
    async _resetUserRoutes() {
      let routes: AppRouteRecordRaw[] = [];
      const { userId } = this;
      const { resetUserRoutes } = useUserRoutesStore();

      // 检测用户Id是否存在，不存在则是退出
      if (!userId) {
        // 用户退出重置路由
        routes = [...constantRoutes, ...commonRoutes];
        resetUserRoutes(routes);
        return;
      }

      // 后端路由
      const ryRouters = (await getRouters()) as any;

      if (ryRouters.length === 0) {
        message.warn("当前角色不存在菜单");
        await delay(1000);
        await this.logout();
        return;
      }

      // 若依路由转化
      const transRouters = transferRyRouters(ryRouters);
      // console.log(transRouters);

      const wholeTransRouters = genPrivateRoutes(transRouters);

      // 将多级路由扁平成二级

      console.log(wholeTransRouters);

      resetUserRoutes(wholeTransRouters);
    },

    /** 退出 */
    async logout() {
      // 因为企业（霍科）目前开设了免登
      // 怕误触这个接口导致退出 失效 暂屏蔽
      //await userLogout();

      this._clearUserInfo();

      // 这里要换成清除路由
      await this._resetUserRoutes();

      // 前往登录页面
      const { push } = router;

      // 通过标签重渲（这样能清除全部缓存）
      // push(PageEnum.LOGIN);
      location.href = PageEnum.LOGIN;
    },

    /** 设置用户信息 */
    _setUserInfo(info: UserInfo) {
      Object.keys(info).map((key: keyof UserInfo) => {
        setPropertyValue(this, key, info[key]);
      });
    },

    /** 清除用户信息 */
    _clearUserInfo() {
      const { removeToken } = authStorage;
      removeToken();
      this._setUserInfo(defaultUserInfoState as UserInfo);
    },
  },
});

/** 用户路由仓库 */
const useUserRoutesStore = defineStore("userRoutes", {
  state: () => {
    return { routes: [] as AppRouteRecordRaw[] };
  },
  actions: {
    resetUserRoutes(routes: AppRouteRecordRaw[]) {
      this.routes = routes;

      // 触发真实路由的变更
      // const fRoutes = flatRoutes(routes);
      console.log("重置路由: ", routes);

      resetRouter(routes);
    },
  },
});

export { useUserInfoStore, useUserRoutesStore };
