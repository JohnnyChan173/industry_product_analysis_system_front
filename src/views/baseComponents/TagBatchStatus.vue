<template>
  <Tag class="large" :color="getBatchStatusColor(props.value!!)">
    ● {{ getListItemLabel(BatchStatusList, props.value!!) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { BatchStatus } from "/@/enums/model";
  import { BatchStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: BatchStatus;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
  });

  /** 获取状态颜色 */
  function getBatchStatusColor(status: BatchStatus) {
    if (status == BatchStatus.DEFAULT) {
      return "";
    } else if (status == BatchStatus.STOCK_IN) {
      return "success";
    } else if (status == BatchStatus.BACK) {
      return "red";
    }
  }
</script>
