<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、物料批次-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、物料批次-基础信息" />
    <div class="ml-32px">
      <Form.Item class="!mb-0px" label="物料批次号">
        <p>{{ batchInfo?.batchNo }}</p>
      </Form.Item>

      <Form.Item class="!mb-0px" v-if="batchInfo?.materialPurchaseId" label="关联采购单">
        <p class="text-primary">{{ batchInfo?.materialPurchaseInfo.purchaseNo }}</p>
      </Form.Item>

      <Form.Item class="!mb-0px" label="批次物料">
        <MaterialRelate
          class="text-primary"
          :mode="CommonComponentMode.DETAIL"
          :materialId="batchInfo?.materialId"
          :materialSpecsId="batchInfo?.materialSpecsId"
        />
      </Form.Item>
      <Form.Item class="!mb-0px" label="库存">
        <p>
          <span>{{ batchInfo?.stockValue }}</span>
        </p>
      </Form.Item>
    </div>

    <!-- 2、物料批次-库存操作 -->
    <SubTitle :size="AntUniversalSize.small" title="2、物料批次-库存操作" />

    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="operationType" label="操作类型">
        <Radio.Group v-model:value="formData.operationType" button-style="solid" @change="onOperationTypeChange">
          <Radio.Button v-for="{ label, value } in BatchStockLogOperationTypeList" :value="value" :key="value">{{
            label
          }}</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="operationTypeSub" :label="`${stockText}类型`">
        <Radio.Group v-model:value="formData.operationTypeSub" button-style="solid">
          <Radio
            v-for="{ label, value, disabled } in operationSubList"
            :value="value"
            :key="value"
            :disabled="disabled"
            >{{ label }}</Radio
          >
        </Radio.Group>
        <div class="text-gray-400">
          <p v-if="formData.operationType === BatchStockLogOperationType.STOCK_OUT">
            - 生产出库请在生产任务单创建后，完成【备料任务单】;
          </p>
          <p v-else-if="formData.operationType === BatchStockLogOperationType.STOCK_IN">
            - 退料入库请在生产任务单完成后，完成【退料任务单】。
          </p>
        </div>
      </Form.Item>

      <Form.Item name="value" :label="`${stockText}数量`">
        <InputNumber
          class="!w-150px"
          v-model:value="formData.value"
          :min="0"
          placeholder="请输入"
          :max="formData.operationType === BatchStockLogOperationType.STOCK_OUT ? batchInfo?.stockValue : Infinity"
        />
      </Form.Item>

      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="选填" />
      </Form.Item>
    </div>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ stockText }}</Button>
      </Form.Item>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, InputNumber, Radio } from "ant-design-vue";
  import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits, computed, toRaw } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import {
    materialBatchDetail,
    materialBatchEdit,
    materialBatchAdd,
    materialBatchStockIn,
    materialBatchStockOut,
    materialBatchStockReset,
  } from "/@/api/materialBatch";
  import { materialTaskDetail, materialTaskList } from "/@/api/materialTask";
  import { MaterialBatchDetail, MaterialBatchInfo, MaterialBatchStockData } from "/@/api/model/materialBatch";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { getTimeNo, debounce } from "/@/utils/util";
  import { MaterialTaskInfo } from "/@/api/model/materialTask";
  import { defaultPageSize } from "/@/config";
  import MaterialRelate from "/@/views/components/MaterialRelate/index.vue";
  import { BatchStockLogOperationType } from "/@/enums/model";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import {
    BatchStockLogOperationTypeList,
    MaterialBatchStockLogOperationTypeSubList,
    getListItemLabel,
  } from "/@/config/data";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    materialBatchId: number;
    materialId: number;
    materialSpecsId: number;
    operationType: BatchStockLogOperationType;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    operationType: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<MaterialBatchStockData>>({
    materialBatchId: props.materialBatchId,
    materialId: props.materialId,
    materialSpecsId: props.materialSpecsId,
    operationType: props.operationType,
    operationTypeSub: undefined,
    value: undefined,
    memo: "",
  });

  const batchInfo = ref<MaterialBatchDetail>();

  const stockText = computed(() => {
    const text = getListItemLabel(BatchStockLogOperationTypeList, formData.operationType!!);
    return text;
  });

  const operationSubList = ref<any[]>([]);

  const formRules = getFormRules();

  onMounted(async () => {
    toSyncOperationType();

    await toGetNeedInfo();
  });

  /** 同步操作类型 */
  function toSyncOperationType() {
    const { operationType } = formData;
    let subList: any[] = Array.from(MaterialBatchStockLogOperationTypeSubList).map((i) => ({ ...i, disabled: true }));
    if (operationType === BatchStockLogOperationType.STOCK_OUT) {
      subList = subList.slice(0, 2);
    } else if (operationType === BatchStockLogOperationType.STOCK_IN) {
      subList = subList.slice(2, 4);
    } else {
      subList = subList.slice(4, 6);
    }

    subList[0].disabled = false;
    operationSubList.value = subList;
    formData.operationTypeSub = subList[0].value;
  }

  /** 操作类型变化 */
  function onOperationTypeChange() {
    toSyncOperationType();
    console.log(operationSubList.value, formData.operationTypeSub);
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    const { materialBatchId } = props;
    // 获取物料批次详情
    const bInfo = await materialBatchDetail(materialBatchId!!);

    // 同步批次数据
    batchInfo.value = bInfo;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    const { operationType, value } = formData;
    let fn: any;
    // 策略模式
    if (operationType === BatchStockLogOperationType.STOCK_OUT) {
      fn = materialBatchStockOut;
    } else if (operationType === BatchStockLogOperationType.STOCK_IN) {
      fn = materialBatchStockIn;
    } else {
      fn = materialBatchStockReset;
    }

    const data = toRaw(formData);

    await fn(data);

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
