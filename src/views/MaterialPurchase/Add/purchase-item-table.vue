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
        <span class="text-gray-400">未设置采购物料</span>
      </template>
      <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialPurchaseItemInfo>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 采购物料 -->
        <template v-if="column.dataIndex === 'materialId'">
          <MaterialRelate
            :mode="CommonComponentMode.DETAIL"
            :materialId="record.materialId"
            :materialSpecsId="record.materialSpecsId"
          />
        </template>

        <!-- 可编辑项 -->
        <template v-if="['price', 'value'].includes(column.dataIndex)">
          <div>
            <!-- 规格 -->
            <!-- 如果是单价 焦点 -->
            <InputNumber
              v-if="editableData[record.uuid] && column.dataIndex === 'price'"
              v-focus
              :min="0"
              v-model:value="editableData[record.uuid][column.dataIndex]"
              style="margin: -5px 0"
              @keyup.enter.stop="save(record.uuid)"
            />

            <!-- 其他 -->
            <InputNumber
              v-else-if="editableData[record.uuid] && ['value'].includes(column.dataIndex)"
              :min="0"
              v-model:value="editableData[record.uuid][column.dataIndex]"
              style="margin: -5px 0"
              @keyup.enter.stop="save(record.uuid)"
            />

            <!-- 文本项 -->
            <template v-else>
              <span v-if="column.dataIndex === 'price'">￥{{ text }}</span>
              <span v-else>{{ text }}</span>
            </template>
          </div>
        </template>

        <!-- 合计 -->
        <template v-if="column.key === 'priceTotal'"> ￥{{ record.price * record.value || 0 }} </template>

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

              <Popconfirm title="确认删除规格？" @confirm="del(record.uuid)">
                <span class="text-danger hover-opacity">删除</span>
              </Popconfirm>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div v-if="isEditMode" class="text-right mt-12px">
      <Button type="primary" ghost @click="handleMaterialAdd">添加物料 +</Button>
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
  </div>
</template>

<script setup lang="ts">
  import { Button, Table, Divider, Popconfirm, InputNumber, Modal, message } from "ant-design-vue";
  import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits, watch, computed, nextTick } from "vue";
  import { delay, randomId } from "/@/utils/util";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { cloneDeep } from "lodash";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { useColumnsTools } from "/@/hooks/web/useColumnsTools";
  import { MaterialPurchaseItemInfo } from "/@/api/model/materialPurchaseItem";
  import { AntModalWidth } from "/@/enums/antEnum";
  import MaterialSelect from "/@/views/components/MaterialSelect/index.vue";
  import MaterialRelate from "/@/views/components/MaterialRelate/index.vue";

  interface Props {
    mode?: CommonComponentMode;
    value: MaterialPurchaseItemInfo[];
    showHeader?: boolean;
    hideColumns?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    value: () => [],
    showHeader: true,
  });

  const emits = defineEmits(["update:value"]);

  const materialPurchaseItemList = ref<MaterialPurchaseItemInfo[]>([]);

  const { columns } = useTable();
  const { curColumns, toHideColumns } = useColumnsTools(columns);

  const disabledMaterialSpecsIds = computed(() => materialPurchaseItemList.value.map((i) => i.materialSpecsId));

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

  toHideColumns(props.hideColumns);

  const editableData = reactive<any>({});

  const isEditMode = props.mode === CommonComponentMode.EDIT;

  watch(
    () => props.value,
    (v) => {
      materialPurchaseItemList.value = v;
    },
    { immediate: true }
  );

  watch(
    () => materialPurchaseItemList.value,
    (v) => {
      emits("update:value", v);
    },
    { immediate: true }
  );

  onMounted(async () => {});

  /** 变化 - 物料关联提交 */
  async function onMaterialSelectSubmitOk(checkedKeys: string[], list: any[]) {
    console.log(checkedKeys, list);

    for (let i = 0; i < checkedKeys.length; i++) {
      const ck = checkedKeys[i];
      const [materialId, materialSpecsId] = ck.split("-").map((i) => Number(i));
      // 循环触发新增
      await addNewMaterialPurchaseItem(materialId, materialSpecsId);
    }

    modalMaterialSelectState.visible = false;
  }

  /** 追加新增物料 */
  async function addNewMaterialPurchaseItem(materialId: number, materialSpecsId: number) {
    const ds = Array.from(materialPurchaseItemList.value);
    const dsLen = ds.length;

    const uuid = randomId();
    const itemSort = dsLen + 1;
    const price = undefined;
    const value = undefined;

    const newPurchaseItemInfo: Partial<MaterialPurchaseItemInfo> = {
      uuid,
      itemSort,
      materialId,
      materialSpecsId,
      price,
      value,
    };

    const newPurchaseItemList = [
      ...materialPurchaseItemList.value!!,
      newPurchaseItemInfo,
    ] as MaterialPurchaseItemInfo[];

    materialPurchaseItemList.value = newPurchaseItemList;

    // 追加编辑项
    nextTick(async () => {
      await delay(250);
      edit(uuid);
    });
  }

  /** 添加物料 */
  async function handleMaterialAdd() {
    modalMaterialSelectState.title = "采购订单-物料添加";
    modalMaterialSelectState.visible = true;
  }

  // 重排列表
  function toSortSpecsList() {
    const newSpecsList = Array.from(materialPurchaseItemList.value);
    newSpecsList.sort((a, b) => a.itemSort!! - b.itemSort!!);
    materialPurchaseItemList.value = newSpecsList;
  }

  function edit(uuid: string) {
    editableData[uuid] = cloneDeep(materialPurchaseItemList.value.filter((item: any) => uuid === item.uuid)[0]);
  }

  async function save(uuid: string) {
    const data = editableData[uuid];

    // 数据检查
    if (!data.value) {
      message.warn("请输入数量");
      return;
    }

    Object.assign(materialPurchaseItemList.value.filter((item: any) => uuid === item.uuid)[0], editableData[uuid]);
    delete editableData[uuid];

    toSortSpecsList();
  }

  function cancel(uuid: string) {
    delete editableData[uuid];
  }

  async function del(uuid: string) {
    const newSpecsList = materialPurchaseItemList.value.filter((i) => i.uuid !== uuid);
    materialPurchaseItemList.value = newSpecsList;

    toSortSpecsList();
  }
</script>

<style></style>
