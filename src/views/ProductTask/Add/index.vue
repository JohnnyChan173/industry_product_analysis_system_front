<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、生产任务单-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、生产任务单-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="taskType" label="任务单类型">
        <Radio.Group v-model:value="formData.taskType">
          <Radio v-for="item in ProductTaskTypeList" :key="item.value" :value="item.value">{{ item.label }}</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item v-if="formData.taskType === ProductTaskType.SALE" name="saleOrderNo" label="关联销售订单">
        <Input v-model:value="formData.saleOrderNo" placeholder="请输入销售订单号(外部系统)" />
      </Form.Item>

      <Form.Item name="taskNo" label="任务单编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.taskNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomTaskNo" />
        </div>
      </Form.Item>

      <!-- <Form.Item name="customName" label="客户名称">
        <Input v-model:value="formData.customName" placeholder="请输入" />
      </Form.Item> -->

      <Form.Item name="productId" label="生产产品">
        <ProductRelate
          v-model:productId="formData.productId"
          v-model:productAttrValueIdsList="formData.productAttrValueIdsList"
          @update:productId="handleProductChange"
          @update:productAttrValueIdsList="handleProductChange"
        />
      </Form.Item>

      <Form.Item name="lineId" label="生产产线">
        <LineRelate v-model:lineId="formData.lineId" />
      </Form.Item>

      <Form.Item name="productNumber" label="生产数量">
        <div class="flex items-center">
          <InputNumber
            class="!w-150px"
            v-model:value="formData.productNumber"
            :min="0"
            placeholder="请输入"
            @change="handleProductChange"
          />
          <div
            v-if="formData.productId && formData.productNumber"
            class="flex items-center"
            @click="handleProductBomCheck"
          >
            <p v-if="productBomStockCheckResult === CommonCheck.FALSE" class="flex items-center"
              ><span class="text-warn underline hover-opacity ml-12px">BOM库存异常</span>
              <InfoCircleOutlined class="!text-warn ml-3px"
            /></p>
            <p v-else-if="productBomStockCheckResult === CommonCheck.TRUE" class="flex items-center"
              ><span class="text-success underline hover-opacity ml-12px">BOM库存正常</span>
              <InfoCircleOutlined class="!text-success ml-3px"
            /></p>
            <p v-else><span class="text-gray-400 ml-12px">BOM库存检测中...</span> </p>
          </div>
        </div>
      </Form.Item>

      <!-- 2、生产任务单-其他信息 -->
      <SubTitle :size="AntUniversalSize.small" title="2、生产任务单-其他信息" />

      <Form.Item name="planCompleteDate" label="计划完成时间">
        <DatePicker v-model:value="tempData.planCompleteDate" @change="handleTempDataPlanCompleteDateChange" />
      </Form.Item>

      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="选填" />
      </Form.Item>
    </div>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>

  <!-- 弹窗 - BOM检测 -->
  <Modal
    :style="{ width: '1320px' }"
    v-model:visible="modalProductBomState.visible"
    title="产品BOM-库存检测"
    :footer="null"
    destroyOnClose
  >
    <ProductBom
      mode="stock-check"
      :productId="formData.productId!!"
      :productAttrValueIdsList="formData.productAttrValueIdsList!!"
      :number="formData.productNumber"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal, Radio } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import { productTaskDetail, productTaskEdit, productTaskAdd } from "/@/api/productTask";
  import { ProductTaskInfo } from "/@/api/model/productTask";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { InfoCircleOutlined, LinkOutlined } from "@ant-design/icons-vue";
  import { productListAll } from "/@/api/product";
  import dayjs, { Dayjs } from "dayjs";
  import { ProductInfo } from "/@/api/model/product";
  import { debounce, getTimeNo, parseList2Ids } from "/@/utils/util";
  import { ProductTaskTypeList } from "/@/config/data";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { CommonCheck, ProductTaskType } from "/@/enums/model";
  import { randomProductTaskNo } from "/@/config/parse/number";
  import ProductBom from "/@/views/Product/ProductBom/index.vue";
  import { productBomStockCheck } from "/@/api/productBom";
  import LineRelate from "/@/views/components/LineRelate/index.vue";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<ProductTaskInfo>>({
    id: undefined,
    taskType: ProductTaskType.PREPARE,
    saleOrderNo: "",
    taskNo: "",
    lineId: undefined,
    productId: undefined,
    productAttrValueIdsList: [],
    productNumber: undefined,
    planCompleteDate: "",
    memo: "",
  });

  const tempData = reactive<{
    planCompleteDate?: Dayjs;
  }>({
    planCompleteDate: dayjs(),
  });

  const productSelectList = ref<ProductInfo[]>([]);
  const productBomStockCheckResult = ref<CommonCheck>();

  const debounceToProductBomStockCheck = debounce(toProductBomStockCheck, 500);

  const formRules = getFormRules();

  /** 弹窗 - 产品BOM日志 */
  const modalProductBomState = reactive<{
    visible: boolean;
  }>({
    visible: false,
  });

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    await toGetNeedInfo();

    if (isEditMode) {
      const { id } = props;
      const info = await productTaskDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof ProductTaskInfo) => {
        setPropertyValue(formData, key, info[key]);
      });

      // 特殊字段处理
      const { planCompleteDate } = info;
      tempData.planCompleteDate = dayjs(planCompleteDate);

      // 触发更新
      handleTempDataPlanCompleteDateChange();
    } else {
      // 赋值随机编号
      handleRandomTaskNo();

      // 触发更新
      handleTempDataPlanCompleteDateChange();
    }
  });

  /** 产品BOM库存检测 */
  async function toProductBomStockCheck() {
    const { productId, productAttrValueIdsList, productNumber } = formData;
    if (productId && productNumber) {
      const data = {
        productId,
        productAttrValueIdsList: parseList2Ids(productAttrValueIdsList || []),
        number: productNumber,
      };
      const result = await productBomStockCheck(data);
      productBomStockCheckResult.value = result;
    } else {
      productBomStockCheckResult.value = undefined;
    }
  }

  /** 产品选择变化 */
  async function handleProductChange() {
    productBomStockCheckResult.value = undefined;
    debounceToProductBomStockCheck();
  }

  /** 产品BOM检测 */
  function handleProductBomCheck() {
    modalProductBomState.visible = true;
  }

  /** 临时数据-交付时间变更 */
  function handleTempDataPlanCompleteDateChange() {
    const date = tempData.planCompleteDate!!;
    const d = date.format("YYYY-MM-DD HH:mm:ss");
    formData.planCompleteDate = d;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    // 获取产品列表
    const pList = await productListAll();
    productSelectList.value = pList;
  }

  /** 随机生成任务单号 */
  async function handleRandomTaskNo() {
    const no = randomProductTaskNo();
    formData.taskNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    // 编辑模式
    if (isEditMode) {
      await productTaskEdit(formData);
    } else {
      await productTaskAdd(formData);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
