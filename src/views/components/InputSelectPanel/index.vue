<template>
  <Select
    class="my-select"
    :mode="multiple ? 'multiple' : undefined"
    :showSearch="true"
    showArrow
    allowClear
    :value="props.selectIds"
    :placeholder="placeholder"
    :filterOption="false"
    @change="onSelectChange"
    @search="onSelectSearch"
  >
    <Select.Option v-for="item in selectOptions" :key="item.id" :value="item.id">
      <span>{{ props.labelFn(item) }}</span>
    </Select.Option>
  </Select>
</template>

<script setup lang="ts">
  import { Select } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, ref, watch } from "vue";
  interface Props {
    multiple?: boolean;
    rawSelectList: any[];
    selectIds: number[];
    labelFn: any;
    placeholder?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    multiple: false,
    rawSelectList: () => [],
    selectIds: () => [],
    labelFn: (item: any) => item.label,
    placeholder: "请选择",
  });

  const emits = defineEmits(["change"]);

  const selectOptions = ref<any[]>([]);

  watch(
    () => props.rawSelectList,
    () => {
      selectOptions.value = props.rawSelectList;
    },
    { immediate: true }
  );

  /** 变化 - 关键字  */
  function onSelectSearch(input: string) {
    const { labelFn, rawSelectList } = props;
    const filterList = rawSelectList.filter((item: any) => labelFn(item).includes(input));
    selectOptions.value = filterList;
  }

  /** 选中变化 */
  function onSelectChange(ids: number[] | number) {
    emits("change", ids);
    // selectOptions.value = rawSelectList.value;
  }
</script>

<style></style>
