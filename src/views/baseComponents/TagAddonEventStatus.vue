<template>
  <Tag v-if="info" class="large" :color="getAddonEventStatusColor(info.eventStatus)">
    ● {{ getListItemLabel(AddonEventStatusList, info.eventStatus) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { AddonEventInfo } from "/@/api/model/addonEvent";
  import { AddonEventStatus } from "/@/enums/model";
  import { AddonEventStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    info: AddonEventInfo;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });

  /** 获取安灯事件颜色 */
  function getAddonEventStatusColor(status: AddonEventStatus) {
    if (status == AddonEventStatus.INVALID) {
      return "";
    } else if (status == AddonEventStatus.PROCESSING) {
      return "blue";
    } else if (status == AddonEventStatus.READY) {
      return "orange";
    } else if (status == AddonEventStatus.PROCESSED) {
      return "#87d068";
    }
  }
</script>
