<template>
  <div :class="`${prefixCls} flex items-center`">
    <img :src="logoImg" class="h-52px pr-12px" />
    <div class="flex flex-col">
      <p class="font-bold not-italic text-24px tracking-0.2em py-2px">{{ title }}</p>
      <p>{{ enTitle }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useDesign } from "/@/hooks/web/useDesign";
  import { useGlobSetting } from "/@/hooks/setting";
  import { getAssetsFile } from "/@/utils/util";

  const logoImg = getAssetsFile("logo.png");
  const enTitle = "Production Efficiency Analysis System";

  const { title } = useGlobSetting();

  const { prefixCls } = useDesign("app-logo");
</script>

<style lang="less" scoped>
  @prefix-cls: ~"@{namespace}-app-logo";

  .@{prefix-cls} {
    color: @color-primary;
  }
</style>
