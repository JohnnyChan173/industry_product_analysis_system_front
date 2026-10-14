<template>
  <span class="text-gray-400"> {{ materialUnitText }}</span>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps, onMounted, computed } from "vue";
  import { useDataStore } from "/@/store";

  interface Props {
    materialId: number;
  }

  const props = withDefaults(defineProps<Props>(), {});

  const dataStore = useDataStore();

  const materialUnitText = computed(() => {
    const { materialListAll: ml } = dataStore;
    const { materialId } = props;
    const m = ml.find((i) => i.id === materialId);
    console.log(materialId,m)

    if (m) {
      return m.dictItemMaterialUnitInfo.itemValue;
    } else {
      return "";
    }
  });

  onMounted(() => {});
</script>

<style></style>
