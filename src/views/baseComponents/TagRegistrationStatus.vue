<template>
  <Tag :class="size" :color="getRegistrationStatusColor(props.value)">
    ● {{ getListItemLabel(RegistrationStatusList, props.value) }}
  </Tag>
</template>

<script setup lang="ts">
  import { Tag } from "ant-design-vue";
  import { withDefaults, defineProps } from "vue";
  import { RegistrationInfo } from "/@/api/model/registration";
  import { RegistrationStatus } from "/@/enums/model";
  import { RegistrationStatusList, getListItemLabel } from "/@/config/data";

  interface Props {
    value: RegistrationStatus;
    size?: "small" | "large";
  }

  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
    size: "large",
  });

  /** 获取状态颜色 */
  function getRegistrationStatusColor(status: RegistrationStatus) {
    if (status == RegistrationStatus.NOT_REGISTRATION) {
      return "";
    } else if (status == RegistrationStatus.IN_REGISTRATION) {
      return "blue";
    } else if (status == RegistrationStatus.END_REGISTRATION) {
      return "#87d068";
    }
  }
</script>
