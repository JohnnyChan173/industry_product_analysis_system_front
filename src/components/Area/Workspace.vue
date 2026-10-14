<template>
  <div>
    <!-- 1、顶部导航 -->
    <section class="nav flex justify-between items-center flex-wrap" :class="`${resetCSSPrefix}-form-normal`">
      <!-- 左侧 -->
      <div class="nav-left flex">
        <slot name="nav-left"></slot>
      </div>
      <div class="nav-right flex">
        <slot name="nav-right"></slot>
      </div>
    </section>

    <!-- 2、主体区 -->
    <slot name="default"></slot>
  </div>
</template>

<script setup lang="ts">
  import { getResetCSSPrefix } from "/@/config/domStyle";
  const resetCSSPrefix = getResetCSSPrefix();
</script>

<style lang="less" scoped>
  @navMarginBottom: 12px;
  .nav {
    &-left,
    &-right {
      margin-bottom: @navMarginBottom;
      > * {
        margin-right: 4px;
      }
    }
  }
</style>
