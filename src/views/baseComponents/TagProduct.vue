<template>
  <Tag v-if="info" :class="size" color="blue" v-bind="$attrs">
    {{ `[${info.productNo}]-${info.productName}` }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { ProductInfo } from "/@/api/model/product";
  interface Props {
    info: ProductInfo;
    size?: "small" | "large";
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
    size: "large",
  });
</script>
