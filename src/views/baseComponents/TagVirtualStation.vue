<template>
  <span v-if="info" class="text-primary"> {{ info.virtualStationSort + 1 }}-{{ info.virtualStationName }} </span>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps } from "vue";
  import { VirtualStationInfo } from "/@/api/model/virtualStation";

  interface Props {
    info: VirtualStationInfo;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });
</script>
