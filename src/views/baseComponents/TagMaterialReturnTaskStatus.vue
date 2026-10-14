<template>
  <div>
    <span v-if="props.productTaskStatus !== ProductTaskStatus.COMPLETE" class="text-gray-400">待完成后退料</span>
    <Tag v-else class="large" :color="getMaterialReturnTaskStatusColor(props.value!!)">
      ● {{ getListItemLabel(MaterialReturnTaskStatusList, props.value!!) }}
    </Tag>
  </div>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { MaterialReturnTaskStatus, ProductTaskStatus } from "/@/enums/model";
  import { MaterialReturnTaskStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: MaterialReturnTaskStatus;
    productTaskStatus: ProductTaskStatus;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
    productTaskStatus: undefined,
  });

  /** 获取状态颜色 */
  function getMaterialReturnTaskStatusColor(status: MaterialReturnTaskStatus) {
    if (status == MaterialReturnTaskStatus.READY) {
      return "";
    } else if (status == MaterialReturnTaskStatus.DOING) {
      return "blue";
    } else if (status == MaterialReturnTaskStatus.COMPLETE) {
      return "#87d068";
    } else if (status == MaterialReturnTaskStatus.SOME_COMPLETE) {
      return "#FFAB70";
    }
  }
</script>
