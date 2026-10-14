<template>
  <Tag class="large" :color="getBatchDetectionStatusColor(value!!)">
    ● {{ getListItemLabel(BatchDetectionStatusList, value!!) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { BatchDetectionStatus } from "/@/enums/model";
  import { BatchDetectionStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: BatchDetectionStatus;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
  });

  /** 获取状态颜色 */
  function getBatchDetectionStatusColor(status: BatchDetectionStatus) {
    if (status == BatchDetectionStatus.DEFAULT) {
      return "";
    } else if (status == BatchDetectionStatus.QUALIFIED) {
      return "success";
    } else if (status == BatchDetectionStatus.UNQUALIFIED) {
      return "red";
    }
  }
</script>
