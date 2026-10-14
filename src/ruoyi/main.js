import ElementPlus from "element-plus";
import { useDict } from "./utils/dict";
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from "./utils/ruoyi";
import locale from "element-plus/es/locale/lang/zh-cn"; // 中文语言
import elementIcons from "./components/SvgIcon/svgicon";
import SvgIcon from "./components/SvgIcon/index.vue";
import DictTag from "./components/DictTag/index.vue";
import Pagination from "./components/Pagination/index.vue";
import modal from "./plugins/modal";

import "element-plus/dist/index.css";

// svg图标
import "virtual:svg-icons-register";

export function injectedRuoyi(app) {
  // 全局方法挂载
  app.config.globalProperties.useDict = useDict;
  app.config.globalProperties.parseTime = parseTime;
  app.config.globalProperties.resetForm = resetForm;
  app.config.globalProperties.handleTree = handleTree;
  app.config.globalProperties.addDateRange = addDateRange;
  app.config.globalProperties.selectDictLabel = selectDictLabel;
  app.config.globalProperties.selectDictLabels = selectDictLabels;

  // 模态框对象
  app.config.globalProperties.$modal = modal;

  // 使用element-plus 并且设置全局的大小
  app.use(ElementPlus, {
    locale: locale,
    // 支持 large、default、small
    size: "default",
  });
  app.use(elementIcons);
  app.component("svg-icon", SvgIcon);
  app.component("dict-tag", DictTag);
  app.component("pagination", Pagination);
}
