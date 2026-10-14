<template>
  <span v-if="info" class="text-warn">{{ getListItemLabel(AddonEventTypeList, info.eventType) }}</span>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps } from "vue";
  import { AddonEventInfo } from "/@/api/model/addonEvent";
  import { AddonEventStatus } from "/@/enums/model";
  import { AddonEventStatusList, AddonEventTypeList, getListItemLabel } from "/@/config/data";

  interface Props {
    info: AddonEventInfo;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });
</script>
