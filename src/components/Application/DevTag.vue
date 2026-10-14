<template>
  <!-- 开发模式接口标记 -->
  <Tag class="dev-tag" v-if="env === 'development'" :color="tagColor">{{ getCurrentServerAddress() }} </Tag>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { Tag } from "ant-design-vue";
  import { useGlobSetting } from "/@/hooks/setting";

  const env = import.meta.env.MODE;

  const tagColor = computed(() => {
    const { domainUrl } = useGlobSetting();
    const devAddressReg = /(([1-9]?\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}([1-9]?\d|1\d{2}|2[0-4]\d|25[0-5])/;
    if (devAddressReg.test(domainUrl)) {
      return "#87d068";
    } else {
      return "#f50";
    }
  });

  /** 获取当前服务端地址 */
  function getCurrentServerAddress() {
    const { domainUrl } = useGlobSetting();
    return domainUrl;
  }
</script>

<style lang="less" scoped>
  .dev-tag {
    position: fixed;
    z-index: 1;
    bottom: 0px;
    right: 0px;
  }
</style>
