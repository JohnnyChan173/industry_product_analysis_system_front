<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、产品批次-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、产品批次-基础信息" />
    <div class="ml-32px">
      <Form.Item class="!mb-0px" label="产品批次号">
        <p>{{ batchInfo?.batchNo }}</p>
      </Form.Item>

      <Form.Item class="!mb-0px" v-if="batchInfo?.productTaskId" label="关联生产单">
        <p class="text-primary">{{ batchInfo?.productTaskInfo.taskNo }}</p>
      </Form.Item>

      <Form.Item class="!mb-0px" label="批次产品">
        <ProductRelate
          class="text-primary"
          :mode="CommonComponentMode.DETAIL"
          :productId="batchInfo?.productId"
          :productAttrValueIdsList="batchInfo?.productAttrValueIdsList"
        />
      </Form.Item>
      <Form.Item class="!mb-0px" label="库存">
        <p>{{ batchInfo?.stockValue }}</p>
      </Form.Item>
    </div>

    <!-- 2、产品批次-库存操作 -->
    <SubTitle :size="AntUniversalSize.small" title="2、产品批次-库存操作" />

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
            - 销售出库请发起【产品出库任务单-创建】;
          </p>
          <p v-else-if="formData.operationType === BatchStockLogOperationType.STOCK_IN">
            - 退货入库【暂未开设业务流】;
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
    productBatchDetail,
    productBatchEdit,
    productBatchAdd,
    productBatchStockIn,
    productBatchStockOut,
    productBatchStockReset,
  } from "/@/api/productBatch";
  import { productTaskDetail, productTaskList } from "/@/api/productTask";
  import { ProductBatchDetail, ProductBatchInfo, ProductBatchStockData } from "/@/api/model/productBatch";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { getTimeNo, debounce } from "/@/utils/util";
  import { ProductTaskInfo } from "/@/api/model/productTask";
  import { defaultPageSize } from "/@/config";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { BatchStockLogOperationType } from "/@/enums/model";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import {
    BatchStockLogOperationTypeList,
    ProductBatchStockLogOperationTypeSubList,
    getListItemLabel,
  } from "/@/config/data";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    productBatchId: number;
    productId: number;
    productAttrValueIdsList: number[];
    operationType: BatchStockLogOperationType;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    operationType: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<ProductBatchStockData>>({
    productBatchId: props.productBatchId,
    productId: props.productId,
    productAttrValueIdsList: props.productAttrValueIdsList,
    operationType: props.operationType,
    operationTypeSub: undefined,
    value: undefined,
    memo: "",
  });

  const batchInfo = ref<ProductBatchDetail>();

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
    let subList: any[] = Array.from(ProductBatchStockLogOperationTypeSubList).map((i) => ({ ...i, disabled: true }));
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
    const { productBatchId } = props;
    // 获取产品批次详情
    const bInfo = await productBatchDetail(productBatchId!!);

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
      fn = productBatchStockOut;
    } else if (operationType === BatchStockLogOperationType.STOCK_IN) {
      fn = productBatchStockIn;
    } else {
      fn = productBatchStockReset;
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
