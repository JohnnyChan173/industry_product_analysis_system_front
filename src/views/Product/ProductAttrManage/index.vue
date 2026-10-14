<template>
  <div>
    <Table
      bordered
      rowKey="id"
      :dataSource="dataSource"
      :loading="state.loading"
      :columns="columns"
      size="small"
      :pagination="false"
    >
      <template #emptyText>
        <span class="text-gray-400">暂无选项</span>
      </template>
      <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductAttrDetail>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 选项值 -->
        <template v-if="column.dataIndex === 'productAttrValueList'">
          {{ getProductAttrValueListText(record.productAttrValueList) }}
        </template>

        <template v-if="column.key === 'action'">
          <a @click="handleEdit(record)">编辑</a>
          <Divider type="vertical" />

          <Popconfirm :title="`确认删除选项:${record.attrName}？`" @confirm="handleDel(record)">
            <span class="text-danger hover-opacity">删除</span>
          </Popconfirm>
        </template>
      </template>
    </Table>
    <div class="text-right mt-12px">
      <Button type="primary" @click="handleAdd">创建选项 +</Button>
    </div>

    <p class="text-warn">- 产品选项会影响产品BOM配置；</p>
  </div>

  <!-- 弹窗 - 选项创建 -->
  <Modal
    :style="{ minWidth: AntModalWidth.md }"
    v-model:visible="modalAttrAddState.visible"
    :title="modalAttrAddState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <ProductAttrAdd
      class="!-mt-20px"
      :id="modalAttrAddState.id"
      :productId="modalAttrAddState.productId"
      :attrSort="modalAttrAddState.attrSort"
      @change:ok="onAttrAddChangeOk"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { Button, Table, Divider, Select, Input, Popconfirm, message, Modal } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick } from "vue";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { productAttrDel, productAttrListAll } from "/@/api/productAttr";
  import { ProductAttrDetail, ProductAttrInfo } from "/@/api/model/productAttr";
  import { getProductAttrValueListText } from "/@/config/parse";
  import { AntModalWidth } from "/@/enums/antEnum";
  import ProductAttrAdd from "../ProductAttrAdd/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";

  interface Props {
    productId: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    productId: undefined,
  });

  const emits = defineEmits(["change:ok"]);

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 产品选项创建 */
  const modalAttrAddState = reactive<{
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

  /** 获取产品选项列表 */
  async function toGetList() {
    const { productId } = props;
    const records = await productAttrListAll(productId);

    state.loading = false;
    dataSource.value = records;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 变化 - 产品选项创建变化 */
  async function onAttrAddChangeOk() {
    await toGetList();
    emits("change:ok");
    modalAttrAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 产品选项-创建 */
  async function handleAdd() {
    const { productId } = props;
    const attrSort = dataSource.value.length;
    modalAttrAddState.id = undefined;
    modalAttrAddState.productId = productId;
    modalAttrAddState.attrSort = attrSort;
    modalAttrAddState.visible = true;
    modalAttrAddState.title = `产品-选项管理-创建`;
  }

  /** 产品选项-编辑 */
  async function handleEdit(record: ProductAttrInfo) {
    const { id, productId, attrName } = record;
    modalAttrAddState.id = id;
    modalAttrAddState.productId = productId;
    modalAttrAddState.visible = true;
    modalAttrAddState.title = `产品-选项管理-编辑: ${attrName}`;
  }

  async function handleDel(record: ProductAttrInfo) {
    const { id } = record;
    await productAttrDel(id);
    await toGetList();
    message.success(CommonOperatorTip.OK);
  }
</script>

<style lang="less" scoped></style>
