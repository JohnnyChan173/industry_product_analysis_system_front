import { createApp } from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import router from "./router";
import "./config/antd";
import pinia, { useDataStore } from "./store";
import "./router/guard";
import { setupGlobDirectives } from "./directives";
import { setupRouterGuard } from "./router/guard";
import fastDataviewUi from 'fast-dataview-ui';
import 'fast-dataview-ui/theme/index.css';
import "virtual:windi.css";
import "./design/index.less";

import { injectedRuoyi } from "./ruoyi/main.js";
import { registerTheme } from "./utils/echart/theme";
import { delay } from "./utils/util";
import authStorage from "./utils/storage/auth";
import "ant-design-vue/dist/antd.less";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import weekday from "dayjs/plugin/weekday";
import updateLocale from "dayjs/plugin/updateLocale";

dayjs.locale("zh-cn");
dayjs.extend(weekday);
dayjs.extend(updateLocale);

dayjs.updateLocale("zh-cn", {
  weekStart: 1,
  weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  weekdaysShort: ["日", "一", "二", "三", "四", "五", "六"],
});
// 重置 close 方法
window.close = function () {
  // console.log("重置close 被第三方调用？？？");
};

const app = createApp(App);

// echart 主题注册
registerTheme();

// 若依相关模块注入
injectedRuoyi(app);

app.use(Antd);
app.use(router);
app.use(pinia);
app.use(fastDataviewUi);

// 去除 vue3 警告
app.config.warnHandler = (msg, instance, trace) => {};

// 错误捕获
// window.onerror = function (e) {
//   console.log(e);
// };
// window.addEventListener(
//   "error",
//   function (e) {
//     console.log(e);
//   },
//   true
// );
// window.addEventListener(
//   "unhandledrejection",
//   function (e) {
//     console.log(e);
//   },
//   true
// );

// 注册全局指令
setupGlobDirectives(app);

app.directive("hasPermi", {});
// 路由保护
setupRouterGuard(router);

app.mount("#app");
