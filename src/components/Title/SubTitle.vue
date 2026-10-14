<template>
  <p class="subTitle">
    <slot>
      {{ props.title }}
    </slot>
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
    padding-bottom: 6px;
    margin: 12px 0;
    border-bottom: 1px solid #ccc;
    color: #333;
    font-size: 15px;
  }
</style>
