<template>
  <div class="product-batch-edit">
    <Table
      :dataSource="draftList"
      :columns="columns"
      rowKey="id"
      size="small"
      bordered
      :pagination="false"
      :scroll="{ y: 680 }"
    >
      <template #bodyCell="{ record, index, column }">
        <template v-if="column.key === 'order'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'productNo'">
          <Input v-model:value="record.productNo" placeholder="产品编码" />
        </template>
        <template v-else-if="column.key === 'productName'">
          <Input v-model:value="record.productName" placeholder="产品名称" />
        </template>
        <template v-else-if="column.key === 'productModel'">
          <Input v-model:value="record.productModel" placeholder="产品型号" />
        </template>
        <template v-else-if="column.key === 'productWeight'">
          <InputNumber v-model:value="record.productWeight" addon-after="克" :min="0" style="width: 100%" />
        </template>
        <template v-else-if="column.key === 'dictItemProductTypeId'">
          <div class="product-type-field">
            <Select
              allowClear
              placeholder="产品类型"
              v-model:value="record.dictItemProductTypeId"
              style="width: 100%"
            >
              <Select.Option v-for="{ id, itemValue } in dataStore.dictItemProductTypeList" :key="id" :value="id">
                {{ itemValue }}
              </Select.Option>
            </Select>
            <div class="text-primary hover-opacity whitespace-nowrap" @click="handleDictProductTypeClick">管理</div>
          </div>
        </template>
      </template>
    </Table>

    <div class="actions">
      <Button :disabled="saving" @click="emit('cancel')">取消</Button>
      <Button type="primary" :loading="saving" @click="save">确认修改</Button>
    </div>

    <!-- 弹窗 - 配置字典 -->
    <Modal
      :width="520"
      v-model:visible="modalConfigState.visible"
      :title="`配置字典: ${modalConfigState.dictName}`"
      :footer="null"
      destroyOnClose
      @cancel="handleConfigModalCancel"
    >
      <Config :dictId="modalConfigState.id" :dictNo="modalConfigState.dictNo" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from "vue";
  import { Button, Input, InputNumber, Select, Table, Modal, message } from "ant-design-vue";
  import type { ProductDetail } from "/@/api/model/product";
  import type { DictInfo } from "/@/api/model/dict";
  import { useDataStore } from "/@/store";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { productUpdateBatch } from "/@/api/product";

  const props = defineProps<{ list: ProductDetail[] }>();
  const emit = defineEmits<{
    (event: "save", records: ProductDetail[]): void;
    (event: "cancel"): void;
  }>();
  const dataStore = useDataStore();
  const saving = ref(false);

  // 独立编辑草稿，取消时不会修改父页面的列表。
  const draftList = ref<ProductDetail[]>(JSON.parse(JSON.stringify(props.list)));
  // 在草稿初始化完成后保留基准，避免默认值被误判为修改。
  const originalList: ProductDetail[] = JSON.parse(JSON.stringify(draftList.value));
  const editableFields = ['productNo', 'productName', 'productModel', 'productWeight', 'dictItemProductTypeId'] as const;

  function getChangedRecords(): ProductDetail[] {
    return draftList.value.flatMap((record, index) => {
      const current = record as unknown as Record<string, unknown>;
      const original = originalList[index] as unknown as Record<string, unknown>;
      const changes: Record<string, unknown> = { id: current.id };
      for (const field of editableFields) {
        const normalize = (value: unknown) => {
          // 多选角色顺序不影响实际内容；空值采用相同口径比较。
          if (Array.isArray(value)) return JSON.stringify([...value].sort());
          return value == null || value === "" ? null : value;
        };
        if (normalize(current[field]) !== normalize(original[field])) {
          // undefined 在 JSON 中会被忽略，清空选择时显式传 null。
          changes[field] = current[field] === undefined ? null : current[field];
        }
      }
      return Object.keys(changes).length > 1 ? [changes as unknown as ProductDetail] : [];
    });
  }

  const columns = [
    { title: "序号", key: "order", width: 55 },
    { title: "产品编码", key: "productNo", dataIndex: "productNo", width: 180 },
    { title: "产品名称", key: "productName", dataIndex: "productName", width: 240 },
    { title: "产品型号", key: "productModel", dataIndex: "productModel", width: 200 },
    { title: "产品重量", key: "productWeight", dataIndex: "productWeight", width: 180 },
    { title: "产品类型", key: "dictItemProductTypeId", dataIndex: "dictItemProductTypeId", width: 280 },
  ];

  const modalConfigState = reactive<{
    id?: number;
    visible: boolean;
    dictName: string;
    dictNo: string;
  }>({ id: undefined, visible: false, dictName: "", dictNo: "" });

  async function handleDictProductTypeClick() {
    const dictId = dataStore.dictItemProductTypeList[0]?.dictId;
    if (dictId == null) {
      message.warning("暂无产品类型字典，请先配置产品类型");
      return;
    }
    const dictInfo = await dictDetail(dictId);
    handleDictConfig(dictId, dictInfo);
  }

  function handleDictConfig(id: number, record: DictInfo) {
    modalConfigState.id = id;
    modalConfigState.dictName = record.dictName;
    modalConfigState.dictNo = record.dictNo;
    modalConfigState.visible = true;
  }

  function handleConfigModalCancel() {
    modalConfigState.visible = false;
  }

  async function save() {
    if (saving.value) return;
    if (!draftList.value.length) {
      message.warning("请先选择产品");
      return;
    }
    if (draftList.value.some((item) => !item.productNo?.trim() || !item.productName?.trim())) {
      message.warning("产品编码和产品名称不能为空");
      return;
    }
    const changedRecords = getChangedRecords();
    if (!changedRecords.length) {
      message.info("没有修改的数据");
      return;
    }
    saving.value = true;
    try {
      await productUpdateBatch(changedRecords);
      message.success("保存成功");
      emit("save", draftList.value);
    } catch (error) {
      message.error("保存失败，请重试");
    } finally {
      saving.value = false;
    }
  }
</script>

<style scoped>
  .product-type-field { display: flex; align-items: center; gap: 6px; }
  .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
</style>
