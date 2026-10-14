<script lang="ts">
  import { defineComponent, ref, toRefs } from "vue";
  import { createAppProviderContext } from "./useAppContext";
  import { prefixCls } from "/@/settings/designSetting";

  const props = {
    prefixCls: { type: String, default: prefixCls },
  };

  export default defineComponent({
    name: "AppProvider",
    inheritAttrs: false,
    props,
    setup(props, { slots }) {
      const { prefixCls } = toRefs(props);

      // 目前管理后台不需要适配手机端，暂时置为 false
      const isMobile = ref(false);

      // 注入变量至全局
      createAppProviderContext({ prefixCls, isMobile });

      return () => slots?.default?.();
    },
  });
</script>
