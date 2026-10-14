<template>
  <div>
    <Select
      style="width: 100%; min-width: 150px; margin-right: 6px"
      allowClear
      placeholder="生产产线"
      :value="props.lineId"
      @change="handleSelectChange"
      :showSearch="true"
      showArrow
      :filterOption="false"
      :size="props.size"
      @search="onLineSelectSearch"
    >
      <Select.Option v-for="{ id, lineName, lineType } in lineSelectList" :key="id" :value="id">
        <Tag v-if="isPDXLine(lineType)" color="orange">
          {{ getListItemLabel(LineTypeList, lineType) }}
        </Tag>
        <Tag v-else-if="isGZBLine(lineType)" color="#108ee9">
          {{ getListItemLabel(LineTypeList, lineType) }}
        </Tag>
        {{ lineName }}
      </Select.Option>
    </Select>
  </div>
</template>

<script setup lang="ts">
  import { Select, Tag } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, ref, computed } from "vue";
  import { LineInfo } from "/@/api/model/line";
  import { debounce } from "lodash";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { lineList } from "/@/api/line";
  import { SizeType } from "ant-design-vue/lib/config-provider";
  import { isGZBLine, isPDXLine } from "/@/config/parse";
  import { getListItemLabel, LineTypeList } from "/@/config/data";

  interface Props {
    size: SizeType;
    lineId: number;
  }
  const props = withDefaults(defineProps<Props>(), {
    size: "middle",
    lineId: undefined,
  });

  const emits = defineEmits(["update:lineId"]);

  const debounceGetLineList = debounce(toGetLineList, 200);
  const lineSelectList = ref<LineInfo[]>([]);

  const selectLine = computed(() => {
    if (props.lineId) {
      console.log(props.lineId);
      return lineSelectList.value.find((i) => i.id === props.lineId);
    }
    return undefined;
  });

  onMounted(async () => {
    await toGetLineList();
  });

  /** 线体搜索变化 */
  function handleSelectChange(lineId: number) {
    emits("update:lineId", lineId);
  }

  /** 物料单搜索 */
  function onLineSelectSearch(input: string) {
    debounceGetLineList(input);
  }

  /** 获取线体列表 */
  async function toGetLineList(keyword?: string) {
    const data = { pageNum: 1, pageSize: defaultPageSize, sort: "id asc", keyword };

    const { records } = await lineList(data);
    lineSelectList.value = records;
  }
</script>

<style></style>
