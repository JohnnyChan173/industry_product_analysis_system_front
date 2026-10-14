<template>
  <AppProvider>
    <ConfigProvider :locale="zhCN">
      <RouterView v-show="!printStore.printShow" />
      <!-- <DevTag /> -->
    </ConfigProvider>
  </AppProvider>

  <!-- 打印html页专用 -->
  <PrintExcel v-if="printStore.printShow" />
</template>

<script lang="ts" setup>
import { ConfigProvider } from "ant-design-vue";
import { useTitle } from "./hooks/web/useTitle";
import AppProvider from "./components/Application/AppProvider.vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore, useDataStore, usePrintStore, useUserInfoStore } from "./store";
import { SSO_PATH, maxPageSize } from "./config";
import { createLoading } from "./components/Loading/createLoading";
import DevTag from "./components/Application/DevTag.vue";
import { parseSearch } from "./utils/util";
import authStorage from "./utils/storage/auth";
import PrintExcel from "/@/components/Application/PrintExcel/index.vue";


dayjs.locale("zh-cn");
const ZhLocale: typeof zhCN = zhCN;
ZhLocale.DatePicker!.lang = {
  ...zhCN.DatePicker!.lang,
  monthFormat: "M月",
  shortWeekDays: ["日", "一", "二", "三", "四", "五", "六"],
};

const router = useRouter();
const appStore = useAppStore();
const printStore = usePrintStore();
const userInfoStore = useUserInfoStore();

const { setRouter } = appStore;

// 侦测路由标题变化
useTitle();

// store 注入 router
setRouter(router);

toCheckSsoLogin();

onMounted(async () => { });

/** 检测免登 */
async function toCheckSsoLogin() {
  const { pathname } = window.location;
  let { token, fullscreen } = parseSearch();

  // 是免登路径
  if (pathname === SSO_PATH) {
    // 截取#
    token = token.split("#")[0];

    // 存储 token
    const { setToken } = authStorage;
    setToken(token);

    // 通过token 完成后续登录
    await userInfoStore.loginWithToken();
  }

  const appStore = useAppStore();

  appStore.setFullscreen(!!fullscreen);
}
</script>
