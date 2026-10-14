<template>
  <div>
    <Table
      class="headerify borderify"
      bordered
      rowKey="uuid"
      :dataSource="props.value"
      :columns="curColumns"
      size="small"
      :pagination="false"
      :showHeader="props.showHeader"
    >
      <template #emptyText>
        <span class="text-gray-400">未设置出库产品</span>
      </template>
      <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductDeliveryTaskDemandInfo>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 出库产品 -->
        <template v-if="column.dataIndex === 'productId'">
          <ProductRelate
            :mode="CommonComponentMode.DETAIL"
            :productId="record.productId"
            :productAttrValueIdsList="record.productAttrValueIdsList"
          />
        </template>

        <!-- 库存 -->
        <template v-if="column.dataIndex === 'stockValueTotal'">
          <span class="text-prmary" v-if="typeof text === 'number'">
            {{ text }}
          </span>
          <span v-else class="text-gray-400">(暂无批次库存)</span>
        </template>

        <!-- 可编辑项 -->
        <template v-if="['demandValue'].includes(column.dataIndex)">
          <div>
            <!-- 如果是需求数量 焦点 -->
            <InputNumber
              v-if="editableData[record.uuid] && column.dataIndex === 'demandValue'"
              v-focus
              :min="0"
              :max="record.stockValueTotal"
              v-model:value="editableData[record.uuid][column.dataIndex]"
              style="margin: -5px 0"
              @keyup.enter.stop="save(record.uuid)"
            />

            <!-- 文本项 -->
            <template v-else>
              <span>{{ text }}</span>
            </template>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <div class="editable-row-operations">
            <span v-if="editableData[record.uuid]">
              <a @click="save(record.uuid)">确定</a>
              <Divider type="vertical" />

              <span class="text-gray-400 hover-opacity" @click="cancel(record.uuid)">取消</span>
            </span>
            <span v-else>
              <a @click="edit(record.uuid)">编辑</a>
              <Divider type="vertical" />

              <Popconfirm title="确认删除产品？" @confirm="del(record.uuid)">
                <span class="text-danger hover-opacity">删除</span>
              </Popconfirm>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div v-if="isEditMode" class="text-right mt-12px">
      <ProductRelate
        :productId="tempData.productId"
        :productAttrValueIdsList="tempData.productAttrValueIdsList"
        @change:ok="handleProductRelateChange"
        ref="productRelateRef"
      >
        <Button type="primary" ghost @click="handleProductAdd">添加产品 +</Button>
      </ProductRelate>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Button, Table, Divider, Popconfirm, InputNumber, Modal, message } from "ant-design-vue";
  import {
    onMounted,
    ref,
    reactive,
    withDefaults,
    defineProps,
    defineEmits,
    watch,
    computed,
    nextTick,
    toRef,
    unref,
  } from "vue";
  import { delay, parseList2Ids, randomId } from "/@/utils/util";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { cloneDeep } from "lodash";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { useColumnsTools } from "/@/hooks/web/useColumnsTools";
  import { AntModalWidth } from "/@/enums/antEnum";
  import MaterialSelect from "/@/views/components/MaterialSelect/index.vue";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { ProductDeliveryTaskDemandInfo } from "/@/api/model/productDeliveryTaskDemand";
  import { productGetProductStock } from "/@/api/product";
  import { isProductExistInList } from "/@/config/parse";

  interface Props {
    mode?: CommonComponentMode;
    value: ProductDeliveryTaskDemandInfo[];
    showHeader?: boolean;
    hideColumns?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    value: () => [],
    showHeader: true,
  });

  const emits = defineEmits(["update:value"]);

  const productDeliveryTaskList = ref<ProductDeliveryTaskDemandInfo[]>([]);

  const productRelateRef = ref();

  const { columns } = useTable();
  const { curColumns, toHideColumns } = useColumnsTools(columns);

  toHideColumns(props.hideColumns);

  const editableData = reactive<any>({});

  const tempData = reactive<any>({ productId: undefined, productAttrValueIds: [] });

  const isEditMode = props.mode === CommonComponentMode.EDIT;

  watch(
    () => props.value,
    (v) => {
      productDeliveryTaskList.value = v;
    },
    { immediate: true }
  );

  watch(
    () => productDeliveryTaskList.value,
    (v) => {
      emits("update:value", v);
    },
    { immediate: true }
  );

  onMounted(async () => {});

  /** 变化 - 物料关联提交 */
  async function handleProductRelateChange(productId: number, productAttrValueIdsList: number[]) {
    // 触发新增
    const list = unref(productDeliveryTaskList.value);
    const existItem = isProductExistInList(productId, productAttrValueIdsList, list);
    if (existItem) {
      message.warn("出库产品已存在");
    } else {
      await addNewProductDeliveryItem(productId, productAttrValueIdsList);
    }

    tempData.productId = undefined;
    tempData.productAttrValueIdsList = [];
  }

  /** 追加新增物料 */
  async function addNewProductDeliveryItem(productId: number, productAttrValueIdsList: number[]) {
    const ds = Array.from(productDeliveryTaskList.value);
    const dsLen = ds.length;

    const uuid = randomId();
    const demandSort = dsLen + 1;
    const demandValue = undefined;

    // 获取产品库存
    const stockValueTotal = await productGetProductStock(productId, parseList2Ids(productAttrValueIdsList));

    const newPurchaseItemInfo: Partial<ProductDeliveryTaskDemandInfo> = {
      uuid,
      demandSort,
      productId,
      productAttrValueIdsList,
      demandValue,
      stockValueTotal,
    };

    const newPurchaseItemList = [
      ...productDeliveryTaskList.value!!,
      newPurchaseItemInfo,
    ] as ProductDeliveryTaskDemandInfo[];

    productDeliveryTaskList.value = newPurchaseItemList;

    // 追加编辑项
    nextTick(async () => {
      await delay(250);
      edit(uuid);
    });
  }

  /** 添加产品 */
  async function handleProductAdd() {
    productRelateRef.value.openSelectModal();
  }

  // 重排列表
  function toSortDemandList() {
    const newSpecsList = Array.from(productDeliveryTaskList.value);
    newSpecsList.sort((a, b) => a.demandSort!! - b.demandSort!!);
    productDeliveryTaskList.value = newSpecsList;
  }

  function edit(uuid: string) {
    editableData[uuid] = cloneDeep(productDeliveryTaskList.value.filter((item: any) => uuid === item.uuid)[0]);
  }

  async function save(uuid: string) {
    const data = editableData[uuid];

    // 数据检查
    if (!data.demandValue) {
      message.warn("请输入出库数量");
      return;
    }

    Object.assign(productDeliveryTaskList.value.filter((item: any) => uuid === item.uuid)[0], editableData[uuid]);
    delete editableData[uuid];

    toSortDemandList();
  }

  function cancel(uuid: string) {
    delete editableData[uuid];
  }

  async function del(uuid: string) {
    const newSpecsList = productDeliveryTaskList.value.filter((i) => i.uuid !== uuid);
    productDeliveryTaskList.value = newSpecsList;

    toSortDemandList();
  }
</script>

<style></style>
