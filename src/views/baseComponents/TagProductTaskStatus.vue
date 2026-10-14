<template>
  <Tag v-if="info" class="large" :color="getProductTaskStatusColor(info.taskStatus)">
    ● {{ getListItemLabel(ProductTaskStatusList, info.taskStatus) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { ProductTaskInfo } from "/@/api/model/productTask";
  import { ProductTaskStatus } from "/@/enums/model";
  import { ProductTaskStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    info: ProductTaskInfo;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });

  /** 获取状态颜色 */
  function getProductTaskStatusColor(status: ProductTaskStatus) {
    if (status == ProductTaskStatus.NOT_DO) {
      return "";
    } else if (status == ProductTaskStatus.DOING) {
      return "blue";
    } else if (status == ProductTaskStatus.COMPLETE) {
      return "#87d068";
    }
  }
</script>
