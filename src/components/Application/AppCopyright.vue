<template>
  <div :class="`${prefixCls}`">
    <p class="text-14px text-gray-400 leading-tight leading-1.5em" v-html="copyrightText"></p>
  </div>
</template>

<script lang="ts" setup>
  import { useDesign } from "/@/hooks/web/useDesign";

  const copyrightText = `Copyright  宁波大学科学技术学院 版权所有`;

  const { prefixCls } = useDesign("app-copyright");
</script>

<style lang="less" scoped>
  @prefix-cls: ~"@{namespace}-app-copyright";

  .@{prefix-cls} {
    color: @color-primary;
  }
</style>
