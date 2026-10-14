<template>
  <p class="flex items-center justify-between">
    
    <span class="subTitle prefix-circle square primary">
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

  interface Props {
    title?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: "",
  });
</script>

<style lang="less" scoped>
  .subTitle {
    font-weight: bold;
    margin: 6px 0;
    text-decoration: underline;
    color: #333;
    font-size: 18px;
    &.square {
      text-decoration: none;
    }
  }
  .prefix-circle {
    padding: 0px 0px;
    &.square {
      &::before {
        content: "";
        display: inline-block;
        border-radius: 0;
        width: 4px;
        height: 16px;
        border: 1px solid transparent;
        margin-right: 6px;
      }
    }
  }
</style>
