<template>
  <div>
    <Table
      class="headerify borderify"
      bordered
      rowKey="id"
      :dataSource="props.value"
      :columns="columns"
      size="small"
      :pagination="false"
    >
      <template #bodyCell="{ text, record, index, column }: BodyCellData<DetectionInfoBatchDetectionExpand>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 检测项权重 -->
        <template v-if="column.dataIndex === 'detectionWeight'">
          <span :class="text === DetectionWeight.IMPORTANT && 'text-primary'">
            {{ getListItemLabel(DetectionWeightList, text) }}
          </span>
        </template>

        <!-- 检测项类型 -->
        <template v-if="column.dataIndex === 'detectionType'">
          {{ getListItemLabel(DetectionTypeList, text) }}
        </template>

        <!-- 计量值区间 -->
        <template v-if="column.key === 'detectionMeasureSection'">
          <span v-if="record.detectionType === DetectionType.MEASURE">
            {{ getDetectionMeasureSectionText(record) }}
          </span>
          <span v-else>/</span>
        </template>

        <template v-if="column.key === 'action'">
          <div v-if="record.detectionType === DetectionType.MEASURE">
            <InputNumber class="!w-full" v-model:value="record.measureValue" placeholder="测量值" />
          </div>
          <Radio.Group v-model:value="record.result">
            <Radio v-for="item in BatchDetectionConclusionList" :key="item.value" :value="item.value">{{
              item.label
            }}</Radio>
          </Radio.Group>
        </template>
      </template>
    </Table>

  </div>
</template>

<script setup lang="ts">
  import {
    Button,
    Table,
    Divider,
    Select,
    Input,
    Popconfirm,
    message,
    Modal,
    Radio,
    InputNumber,
  } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick } from "vue";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { productDetectionDel, productDetectionListAll } from "/@/api/productDetection";
  import { getDetectionMeasureSectionText } from "/@/config/parse";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { ProductDetectionInfo } from "/@/api/model/productDetection";
  import {
    DetectionTypeList,
    DetectionWeightList,
    getListItemLabel,
    BatchDetectionConclusionList,
  } from "/@/config/data";
  import { DetectionType, DetectionWeight } from "/@/enums/model";
  import { DetectionInfoBatchDetectionExpand } from "/@/api/model";

  interface Props {
    value: DetectionInfoBatchDetectionExpand[];
    hideColumns?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: () => [],
    hideColumns: "",
  });

  const emits = defineEmits(["update:value"]);

  /** 表单数据 */
  let { columns } = useTable();

  columns = toUpdateColumns(columns);

  /** 数据 */
  const state = reactive({
    loading: true,
    total: 0,
  });

  onMounted(async () => {
    await toGetNeedInfo();
  });

  /** 更新列 */
  function toUpdateColumns(columns: any[]) {
    const { hideColumns } = props;
    const hl = hideColumns.split(",");
    const newColumns = columns.filter((i) => !hl.includes(i.key));
    return newColumns;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}
</script>

<style lang="less" scoped></style>
