<template>
  <Tag class="large" :color="getMaterialPrepareTaskStatusColor(props.value!!)">
    ● {{ getListItemLabel(MaterialPrepareTaskStatusList, props.value!!) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { MaterialPrepareTaskStatus } from "/@/enums/model";
  import { MaterialPrepareTaskStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: MaterialPrepareTaskStatus;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
  });

  /** 获取状态颜色 */
  function getMaterialPrepareTaskStatusColor(status: MaterialPrepareTaskStatus) {
    if (status == MaterialPrepareTaskStatus.READY) {
      return "";
    } else if (status == MaterialPrepareTaskStatus.DOING) {
      return "blue";
    } else if (status == MaterialPrepareTaskStatus.COMPLETE) {
      return "#87d068";
    } else if (status == MaterialPrepareTaskStatus.SOME_COMPLETE) {
      return "#FFAB70";
    }
  }
</script>
