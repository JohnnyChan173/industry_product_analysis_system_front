<template>
  <Tag class="large" :color="getProductDeliveryTaskStatusColor(props.value!!)">
    ● {{ getListItemLabel(ProductDeliveryTaskStatusList, props.value!!) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { ProductDeliveryTaskStatus } from "/@/enums/model";
  import { ProductDeliveryTaskStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: ProductDeliveryTaskStatus;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
  });

  /** 获取状态颜色 */
  function getProductDeliveryTaskStatusColor(status: ProductDeliveryTaskStatus) {
    if (status == ProductDeliveryTaskStatus.READY) {
      return "";
    } else if (status == ProductDeliveryTaskStatus.DOING) {
      return "blue";
    } else if (status == ProductDeliveryTaskStatus.COMPLETE) {
      return "#87d068";
    } else if (status == ProductDeliveryTaskStatus.SOME_COMPLETE) {
      return "#FFAB70";
    }
  }
</script>
