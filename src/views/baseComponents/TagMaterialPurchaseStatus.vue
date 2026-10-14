<template>
  <Tag class="large" :color="getMaterialPurchaseStatusColor(value!!)">
    ● {{ getListItemLabel(MaterialPurchaseStatusList, value!!) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { MaterialPurchaseStatus } from "/@/enums/model";
  import { MaterialPurchaseStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: MaterialPurchaseStatus;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
  });

  /** 获取状态颜色 */
  function getMaterialPurchaseStatusColor(status: MaterialPurchaseStatus) {
    if (status == MaterialPurchaseStatus.READY) {
      return "";
    } else if (status == MaterialPurchaseStatus.DOING) {
      return "blue";
    } else if (status == MaterialPurchaseStatus.COMPLETE) {
      return "#87d068";
    }
  }
</script>
