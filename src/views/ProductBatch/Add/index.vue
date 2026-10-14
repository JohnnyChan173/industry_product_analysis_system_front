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
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="batchNo" label="产品批次号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.batchNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomBatchNo" />
        </div>
      </Form.Item>

      <Form.Item label="关联生产单">
        <Select
          allowClear
          placeholder="请选择"
          v-model:value="formData.productTaskId"
          :showSearch="true"
          showArrow
          :filterOption="false"
          @search="onProductTaskSearch"
          @change="onProductTaskChange"
        >
          <Select.Option v-for="{ id, taskNo } in productTaskSelectList" :key="id" :value="id">
            {{ taskNo }}
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="productId" label="批次产品">
        <ProductRelate
          v-model:productId="formData.productId"
          v-model:productAttrValueIdsList="formData.productAttrValueIdsList"
        />
      </Form.Item>

      <Form.Item name="supplyValue" label="数量">
        <InputNumber class="!w-150px" v-model:value="formData.supplyValue" :min="0" placeholder="请输入" />
      </Form.Item>

      <!-- 2、物料批次-其他信息 -->
      <SubTitle :size="AntUniversalSize.small" title="2、物料批次-其他信息" />

      <Form.Item name="recordDate" label="录入时间">
        <DatePicker
          :allow-clear="false"
          v-model:value="tempData.recordDate"
          @change="handleTempDataPlanCompleteDateChange"
        />
      </Form.Item>

      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="选填" />
      </Form.Item>
    </div>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item v-if="!isDetailMode">
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
      <TextNoEdit v-else />
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, InputNumber, DatePicker } from "ant-design-vue";
  import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { productBatchDetail, productBatchEdit, productBatchAdd } from "/@/api/productBatch";
  import { productTaskDetail, productTaskList } from "/@/api/productTask";
  import { ProductBatchInfo } from "/@/api/model/productBatch";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { getTimeNo, debounce, formatDateByDayjs } from "/@/utils/util";
  import { ProductTaskInfo } from "/@/api/model/productTask";
  import { defaultPageSize } from "/@/config";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { randomProductBatchNo } from "/@/config/parse/number";
  import dayjs, { Dayjs } from "dayjs";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import TextNoEdit from "/@/views/baseComponents/TextNoEdit.vue";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    mode?: CommonComponentMode;
    id?: number;
    productTaskId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.ADD,
    id: undefined,
    productTaskId: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<ProductBatchInfo>>({
    id: undefined,
    batchNo: "",
    recordDate: "",
    productTaskId: undefined,
    productId: undefined,
    productAttrValueIdsList: [],
    supplyValue: undefined,
    memo: "",
  });

  const tempData = reactive<{
    recordDate?: Dayjs;
  }>({
    recordDate: dayjs(),
  });

  const productTaskSelectList = ref<ProductTaskInfo[]>([]);

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const isDetailMode = props.mode === CommonComponentMode.DETAIL;

  const modeText = isEditMode ? "编辑" : "创建";

  const debounceGetProductTaskList = debounce(toGetProductTaskList);

  onMounted(async () => {
    await toGetNeedInfo();
    const { id, productTaskId } = props;

    if (isEditMode) {
      const info = await productBatchDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof ProductBatchInfo) => {
        setPropertyValue(formData, key, info[key]);
      });

      // 特殊字段处理
      const { recordDate, productTaskId } = info;
      tempData.recordDate = dayjs(recordDate);

      // 触发更新
      handleTempDataPlanCompleteDateChange();

      // 获取对应任务单号的详情
      if (productTaskId) {
        const taskInfo = await productTaskDetail(info.productTaskId);
        productTaskSelectList.value = [taskInfo];
      }
    } else {
      // 赋值随机编号
      handleRandomBatchNo();
      // 触发更新
      handleTempDataPlanCompleteDateChange();

      if (productTaskId) {
        await toSyncProductTaskSelectListById(productTaskId);
      } else {
        await toGetProductTaskList();
      }
    }
  });

  /** 根据采购单id同步下拉列表 */
  async function toSyncProductTaskSelectListById(productTaskId: number) {
    // 获取对应任务单号的详情
    const taskInfo = await productTaskDetail(productTaskId);
    productTaskSelectList.value = [taskInfo];
    formData.productTaskId = productTaskId;
    onProductTaskChange(productTaskId);
  }

  /** 临时数据-交付时间变更 */
  function handleTempDataPlanCompleteDateChange() {
    const date = tempData.recordDate!!;
    const d = date.format("YYYY-MM-DD HH:mm:ss");
    formData.recordDate = d;
  }

  /** 物料单变化 */
  function onProductTaskChange(id: number) {
    const taskInfo = productTaskSelectList.value.find((i) => i.id === id);
    if (taskInfo) {
      const { productId, productAttrValueIdsList, productNumber } = taskInfo;
      // 同步产品
      formData.productId = productId;
      formData.productAttrValueIdsList = productAttrValueIdsList;
      formData.supplyValue = productNumber;
    }
  }

  /** 生产任务单搜索 */
  function onProductTaskSearch(input: string) {
    debounceGetProductTaskList(input);
  }

  /** 获取生产任务单列表 */
  async function toGetProductTaskList(keyword?: string) {
    const data = { pageNum: 1, pageSize: defaultPageSize, sort: "id desc", keyword };

    const { records } = await productTaskList(data);
    productTaskSelectList.value = records;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {}

  /** 随机生成任务单号 */
  async function handleRandomBatchNo() {
    const no = randomProductBatchNo();
    formData.batchNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    // 编辑模式
    if (isEditMode) {
      await productBatchEdit(formData);
    } else {
      await productBatchAdd(formData);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
