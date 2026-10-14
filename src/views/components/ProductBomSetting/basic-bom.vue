<template>
  <div>
    <Table
      class="headerify borderify"
      bordered
      rowKey="id"
      :dataSource="props.value"
      :loading="loading"
      :columns="columns"
      size="small"
      :pagination="false"
      :showHeader="props.showHeader"
    >
      <template #emptyText>
        <span class="text-gray-400">未添加物料</span>
      </template>
      <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductBomDetailExpand>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 物料类型 -->
        <template v-if="column.key === 'materialType'">
          <span>
            {{ record.materialInfo.dictItemMaterialTypeInfo.itemValue }}
          </span>
        </template>

        <!-- 规格料号 -->
        <template v-if="column.key === 'materialSpecsNo'">
          <span>
            {{ record.materialSpecsInfo.specsNo }}
          </span>
        </template>

        <!-- 物料名称 -->
        <template v-if="column.key === 'materialName'">
          <span class="text-primary">
            {{ record.materialInfo.materialName }}
          </span>
        </template>

        <!-- 规格名称 -->
        <template v-if="column.key === 'materialSpecsName'">
          <span class="text-primary">
            {{ record.materialSpecsInfo.specsName }}
          </span>
        </template>

        <!-- 图号 -->
        <template v-if="column.key === 'materialSpecsDrawNo'">
          <span>
            {{ record.materialSpecsInfo.drawNo || "/" }}
          </span>
        </template>

        <!-- 可编辑项；用量 -->
        <template v-if="['value'].includes(column.dataIndex)">
          <div>
            <InputNumber
              v-if="editableData[record.id] && column.dataIndex == 'value'"
              v-focus
              v-model:value="editableData[record.id][column.dataIndex]"
              :min="0"
              style="margin: -5px 0"
              @keyup.enter.stop="save(record.id)"
            />

            <!-- 文本项 -->
            <template v-else>
              <div class="text-primary" @click="edit(record.id)">
                {{ text * number }}
              </div>
            </template>
          </div>
        </template>

        <!-- 单位 -->
        <template v-if="column.key === 'materialUnit'">
          <span class="text-gray-400">
            {{ record.materialInfo.dictItemMaterialUnitInfo.itemValue }}
          </span>
        </template>

        <!-- 库存 -->
        <template v-if="column.dataIndex === 'batchStockTotal'">
          <span :class="_getStockCheckClass(record)">
            {{ text }}
          </span>
        </template>

        <template v-if="column.key === 'action'">
          <div class="editable-row-operations">
            <span v-if="editableData[record.id]">
              <a @click="save(record.id)">确定</a>
              <Divider type="vertical" />

              <span class="text-gray-400 hover-opacity" @click="cancel(record.id)">取消</span>
            </span>

            <span v-else>
              <a @click="edit(record.id)">编辑</a>
              <Divider type="vertical" />

              <Popconfirm :title="`确认删除BOM项:${record.materialInfo.materialName}？`" @confirm="del(record.id)">
                <span class="text-danger hover-opacity">删除</span>
              </Popconfirm>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div v-if="isEditMode" class="text-right mt-6px">
      <Button type="primary" ghost @click="handleBOMBasicAdd">添加物料 +</Button>
    </div>
  </div>

  <!-- 弹窗 - 物料关联组件 -->
  <Modal
    :style="{ minWidth: AntModalWidth.sm }"
    v-model:visible="modalMaterialSelectState.visible"
    :title="modalMaterialSelectState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <MaterialSelect
      class="!-mt-20px"
      :disabledMaterialSpecsIds="disabledMaterialSpecsIds"
      @submit:ok="onMaterialSelectSubmitOk"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { defineEmits, withDefaults, defineProps, reactive, ref, computed } from "vue";
  import { Button, Table, Divider, Popconfirm, Modal, InputNumber, message } from "ant-design-vue";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import { BodyCellData } from "/#/antd";
  import { ProductBomDetailExpand } from "/@/api/model/productBom";
  import { useTable } from "./useTable";
  import MaterialSelect from "/@/views/components/MaterialSelect/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { cloneDeep } from "lodash";
  import { productBomAdd, productBomDel, productBomEdit } from "/@/api/productBom";
  import { ProductAttrDetail } from "/@/api/model/productAttr";
  import { ProductAttrValueDetail } from "/@/api/model/productAttrValue";
  import { ProductDetail } from "/@/api/model/product";
  import { useDataStore } from "/@/store";

  interface Props {
    mode?: CommonComponentMode;
    number?: number;
    value: ProductBomDetailExpand[];
    productId: number;
    productAttrId?: number;
    productAttrValueId?: number;
    disabledMaterialSpecsIds?: number[];
    showStock?: boolean;
    showHeader?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.DETAIL,
    number: 1,
    value: () => [],
    productId: undefined,
    productAttrId: undefined,
    productAttrValueId: undefined,
    disabledMaterialSpecsIds: () => [],
    showStock: false,
    showHeader: true,
  });

  const dataStore = useDataStore();

  const emits = defineEmits(["update:value"]);

  const loading = ref(false);

  const editableData = reactive<any>({});

  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const isEditMode = props.mode === CommonComponentMode.EDIT;

  const productInfo = computed(() => dataStore.getProductInfo(props.productId));
  const productAttrInfo = computed(() => {
    if (props.productAttrId) {
      return dataStore.getProductAttrInfo(props.productAttrId);
    }
    return undefined;
  });

  const productAttrValueInfo = computed(() => {
    if (props.productAttrValueId) {
      return dataStore.getProductAttrValueInfo(props.productAttrValueId);
    }
    return undefined;
  });

  /** 表单数据 */
  let { columns } = useTable();

  // 改变表单列
  columns = updateColumns(columns);

  /** 弹窗 - 物料关联组件 */
  const modalMaterialSelectState = reactive<{
    title: string;
    visible: boolean;
    productAttrId?: number;
  }>({
    title: "",
    visible: false,
    productAttrId: undefined,
  });

  /** 获取库存检测样式 */
  function _getStockCheckClass(record: ProductBomDetailExpand) {
    const { value, batchStockTotal } = record;
    const { number } = props;

    if (typeof number === "number") {
      const valid = batchStockTotal >= number * value;
      if (valid) {
        return "stock-valid";
      } else {
        return "stock-invalid";
      }
    }
  }

  /** 根据模式改变表单列 */
  function updateColumns(columns: any[]) {
    // 是否需要显示库存
    if (!props.showStock) {
      columns = columns.filter((i) => i.dataIndex !== "batchStockTotal");
    }
    if (!isEditMode) {
      columns = columns.filter((i) => i.key !== "action");
    }

    return columns;
  }

  /** 基础BOM-添加 */
  async function handleBOMBasicAdd() {
    const pai = productAttrInfo.value;
    console.log(pai);
    if (pai) {
      const { id, attrName } = pai;
      modalMaterialSelectState.productAttrId = id;
      modalMaterialSelectState.title = `${attrName}-物料添加:`;
    } else {
      modalMaterialSelectState.title = `基础物料添加:`;
    }

    modalMaterialSelectState.visible = true;
  }

  /** 变化 - 物料关联提交 */
  async function onMaterialSelectSubmitOk(checkedKeys: string[], list: any[]) {
    console.log(checkedKeys, list);

    const addList: any[] = [];

    for (let i = 0; i < checkedKeys.length; i++) {
      const ck = checkedKeys[i];
      const [materialId, materialSpecsId] = ck.split("-").map((i) => Number(i));
      const { materialInfo, materialSpecsInfo } = list[i];

      const productBomData: any = {
        productId: productInfo.value?.id,
        productInfo: productInfo.value,
        productAttrId: productAttrInfo.value?.id,
        productAttrInfo: productAttrInfo.value,
        productAttrValueId: productAttrValueInfo.value?.id,
        productAttrValueInfo: productAttrValueInfo.value,
        materialId: materialId,
        materialInfo: materialInfo,
        materialSpecsId: materialSpecsId,
        materialSpecsInfo: materialSpecsInfo,
        value: 0,
      };

      const newBomId = await productBomAdd(productBomData);
      productBomData.id = newBomId;
      addList.push(productBomData);
    }

    const newList = [...props.value, ...addList];

    // 触发列表更新
    emits("update:value", newList);

    message.success(CommonOperatorTip.OK);
    modalMaterialSelectState.visible = false;
  }

  function edit(id: number) {
    const data = cloneDeep(props.value.filter((item: any) => id === item.id)[0]);
    editableData[id] = data;
  }

  async function save(id: number) {
    const data = editableData[id];

    await productBomEdit(data);

    Object.assign(props.value.filter((item: any) => id === item.id)[0], data);

    delete editableData[id];
  }

  function cancel(id: number) {
    delete editableData[id];
  }

  async function del(id: number) {
    await productBomDel(id);

    const newList = props.value.filter((i) => i.id !== id);

    // 触发列表更新
    emits("update:value", newList);
  }
</script>

<style lang="less" scoped>
  .stock-valid {
    background: @color-success;
    color: #fff;
    .center();
  }
  .stock-invalid {
    background: @color-warn;
    color: #fff;
    .center();
  }
</style>
