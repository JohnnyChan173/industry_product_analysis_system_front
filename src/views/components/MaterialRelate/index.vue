<template>
  <div v-if="isEditMode" class="hover-opacity">
    <Cascader
      v-model:value="selectValue"
      :options="selectOptions"
      placeholder="选择物料"
      :showSearch="true"
      showArrow
      :filterOption="false"
      @change="handleSelectValueChange"
    />
  </div>

  <div v-else>
    <p>{{ selectValueText }}</p>
  </div>
</template>

<script setup lang="ts">
  import { Cascader } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, computed, ref, onMounted, watch } from "vue";
  import { useDataStore } from "/@/store";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { getMaterialWholeText } from "/@/config/parse";

  interface Props {
    mode?: CommonComponentMode;
    materialId?: number;
    materialSpecsId?: number;
    allowMaterialIds?: number[];
    allowMaterialSpecsIds?: number[];
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    materialId: undefined,
    materialSpecsId: undefined,
    allowMaterialIds: () => [],
    allowMaterialSpecsIds: () => [],
  });

  const emits = defineEmits(["update:materialId", "update:materialSpecsId"]);

  const dataStore = useDataStore();

  const isEditMode = props.mode === CommonComponentMode.EDIT;

  const selectValue = ref<number[]>([]);

  const selectOptions = computed(() => {
    const { allowMaterialIds, allowMaterialSpecsIds } = props;

    // 获取全部物料列表
    const mlList = dataStore.materialListAll;

    // 数据结构化
    const options: any[] = [];

    for (let i = 0; i < mlList.length; i++) {
      const materialInfo = mlList[i];
      const { id: value, materialName: label, materialSpecsList } = materialInfo;

      // 如果存在 allowMaterialIds
      if (allowMaterialIds.length) {
        const findMaterial = allowMaterialIds.find((mid) => mid === materialInfo.id);
        if (!findMaterial) {
          continue;
        }
      }

      const data = {
        value,
        label,
        children: [] as any[],
      };
      options.push(data);

      for (let j = 0; j < materialSpecsList.length; j++) {
        const materialSpecsInfo = materialSpecsList[j];

        // 如果存在 allowMaterialSpecsIds
        if (allowMaterialSpecsIds.length) {
          const findMaterialSpecs = allowMaterialSpecsIds.find((mid) => mid === materialSpecsInfo.id);
          if (!findMaterialSpecs) {
            continue;
          }
        }

        const { id: value, specsName: label } = materialSpecsInfo;
        const specsData = {
          value,
          label,
        };
        data.children.push(specsData);
      }
    }

    return options;
  });

  const selectValueText = computed(() => {
    // 找到 materialInfo 和 materialSpecsInfo
    const [materialId, materialSpecsId] = selectValue.value;
    const text = getMaterialWholeText(materialId, materialSpecsId);
    return text;
  });

  watch(
    [() => props.materialId, () => props.materialSpecsId],
    () => {
      // 同步一次数据
      const { materialId, materialSpecsId } = props;
      if (materialId && materialSpecsId) {
        selectValue.value = [materialId, materialSpecsId];
      }
    },
    { immediate: true }
  );

  onMounted(() => {});

  /** 选择值变化 */
  function handleSelectValueChange() {
    const sv = selectValue.value || [];
    const [materialId, materialSpecsId] = sv;

    emits("update:materialId", materialId);
    emits("update:materialSpecsId", materialSpecsId);
  }
</script>

<style></style>
