import { App, Directive, reactive } from "vue";
import { createLoading } from "../components/Loading/createLoading";

const loadingDirective: Directive = {
  // 通过 组件的传值进行变化
  created(el, binding) {
    const { value, arg } = binding;

    const isAbsolute = arg === "absolute";

    // 注入加载框
    const { data, close } = createLoading(
      {
        loading: value,
        tip: "",
        absolute: isAbsolute,
      },
      el
    );

    // 挂载响应数据
    el.data = data;
    el.close = close;
  },

  updated(el, binding) {
    const { value } = binding;
    // 修改响应数据
    el.data.loading = value;
  },

  unmounted(el) {
    el.close();
  },
};

export function setupLoadingDirective(app: App) {
  app.directive("loading", loadingDirective);
}
