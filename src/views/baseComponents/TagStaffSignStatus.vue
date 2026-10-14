<template>
  <p v-if="info" :class="getStaffSignStatusColor(info.signStatus)">
    {{ getListItemLabel(StaffSignStatusList, info.signStatus) }}
  </p>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { StaffSignInfo } from "/@/api/model/staffSign";
  import { StaffSignStatus } from "/@/enums/model";
  import { StaffSignStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    info: StaffSignInfo;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });

  /** 获取颜色 */
  function getStaffSignStatusColor(status: StaffSignStatus) {
    if (status == StaffSignStatus.ABSENT) {
      return "text-danger";
    } else if (status == StaffSignStatus.DOING) {
      return "text-success";
    } else if (status == StaffSignStatus.DONE) {
      return "text-success";
    } else if (status == StaffSignStatus.NOT_DO) {
      return "text-gray-400";
    }
  }
</script>
