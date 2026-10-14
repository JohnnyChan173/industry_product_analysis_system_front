<template>
  <p class="form-title" :class="[size, full !== false && 'full']">
    <span>
      <slot>
        {{ props.title }}
      </slot>
    </span>

    <span>
      <slot name="right"></slot>
    </span>
  </p>
</template>

<script setup lang="ts">
  import { defineProps, withDefaults } from "vue";
  import { AntUniversalSize } from "/@/enums/antEnum";

  interface Props {
    title?: string;
    size?: AntUniversalSize;
    full?: boolean | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: "",
    size: AntUniversalSize.medium,
    full: false,
  });
</script>

<style lang="less" scoped>
  @navTitle-color: #f8fafb;

  .form-title {
    background: @navTitle-color;
    padding-left: 24px;
    height: 42px;
    line-height: 42px;
    color: #333;
    font-weight: bold;
    border: 1px solid darken(@navTitle-color, 10%);
    font-size: @font-size;
    margin-bottom: 32px;
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    &.small {
      height: 32px;
      line-height: 32px;
      margin-bottom: 16px;
      margin-top: 6px;
    }
    &.full {
      background: @color-primary;
      border-color: @color-primary;
      color: #fff;
    }
  }
</style>
