<template>
  <div>
    <Table
      class="borderify headerify"
      bordered
      rowKey="id"
      :dataSource="dataSource"
      :loading="state.loading"
      :columns="columns"
      size="small"
      :pagination="false"
    >
      <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductDetectionInfo>">
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
          <a @click="handleEdit(record)">编辑</a>
          <Divider type="vertical" />

          <Popconfirm :title="`确认删除检测项:${record.detectionName}？`" @confirm="handleDel(record)">
            <span class="text-danger hover-opacity">删除</span>
          </Popconfirm>
        </template>
      </template>
    </Table>
    <div class="text-right mt-12px">
      <Button type="primary" @click="handleAdd">创建检测项 +</Button>
    </div>

    <p class="text-warn">- 检测项适用当前产品全部选项；</p>
  </div>

  <!-- 弹窗 - 检测项创建 -->
  <Modal
    :style="{ minWidth: AntModalWidth.md }"
    v-model:visible="modalDetectionAddState.visible"
    :title="modalDetectionAddState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <ProductDetectionAdd
      class="!-mt-20px"
      :id="modalDetectionAddState.id"
      :productId="modalDetectionAddState.productId"
      :attrSort="modalDetectionAddState.attrSort"
      @change:ok="onDetectionAddChangeOk"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { Button, Table, Divider, Select, Input, Popconfirm, message, Modal } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick } from "vue";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { productDetectionDel, productDetectionListAll } from "/@/api/productDetection";
  import { getDetectionMeasureSectionText } from "/@/config/parse";
  import { AntModalWidth } from "/@/enums/antEnum";
  import ProductDetectionAdd from "../ProductDetectionAdd/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { ProductDetectionInfo } from "/@/api/model/productDetection";
  import { DetectionTypeList, DetectionWeightList, getListItemLabel } from "/@/config/data";
  import { DetectionType, DetectionWeight } from "/@/enums/model";

  interface Props {
    productId: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    productId: undefined,
  });

  const emits = defineEmits(["change:ok"]);

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 产品检测项创建 */
  const modalDetectionAddState = reactive<{
    id?: number;
    productId?: number;
    attrSort?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    productId: undefined,
    attrSort: undefined,
    visible: false,
    title: "",
  });

  /** 数据 */
  const state = reactive({
    loading: true,
    total: 0,
  });

  onMounted(async () => {
    await toGetNeedInfo();
    toGetList();
  });

  /** 获取产品检测项列表 */
  async function toGetList() {
    const { productId } = props;
    const records = await productDetectionListAll(productId);

    state.loading = false;
    dataSource.value = records;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 变化 - 产品检测项创建变化 */
  async function onDetectionAddChangeOk() {
    await toGetList();
    emits("change:ok");
    modalDetectionAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 产品检测项-创建 */
  async function handleAdd() {
    const { productId } = props;
    const attrSort = dataSource.value.length;
    modalDetectionAddState.id = undefined;
    modalDetectionAddState.productId = productId;
    modalDetectionAddState.attrSort = attrSort;
    modalDetectionAddState.visible = true;
    modalDetectionAddState.title = `产品-检测项管理-创建`;
  }

  /** 产品检测项-编辑 */
  async function handleEdit(record: ProductDetectionInfo) {
    const { id, productId, detectionName } = record;
    modalDetectionAddState.id = id;
    modalDetectionAddState.productId = productId;
    modalDetectionAddState.visible = true;
    modalDetectionAddState.title = `产品-检测项管理-编辑: ${detectionName}`;
  }

  async function handleDel(record: ProductDetectionInfo) {
    const { id } = record;
    await productDetectionDel(id);
    await toGetList();
    message.success(CommonOperatorTip.OK);
  }
</script>

<style lang="less" scoped></style>
