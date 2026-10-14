<template>
  <Form
    class="detail"
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :labelCol="{ style: { width: '110px' } }"
  >
    <!-- 1、产品批次-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、产品批次-基础信息" />
    <div class="w-580px ml-32px">
      <Row :gutter="20">
        <Col :span="14">
          <Form.Item class="!mb-0px" label="产品批次号">
            <p>{{ batchInfo?.batchNo }}</p>
          </Form.Item>

          <Form.Item class="!mb-0px" v-if="batchInfo?.productTaskId" label="关联生产任务单">
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
          <Form.Item class="!mb-0px" label="数量">
            <p>{{ batchInfo?.supplyValue }}</p>
          </Form.Item>
        </Col>
        <Col :span="10">
          <Form.Item class="!mb-0px" label="备注">
            <p>{{ batchInfo?.memo }}</p>
          </Form.Item>
        </Col>
      </Row>
    </div>

    <!-- 2、产品批次-检测信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2、产品批次-检测信息" />
    <div class="ml-32px">
      <Form.Item name="detectionType" label="检测类型">
        <Radio.Group v-model:value="formData.detectionMode" button-style="solid" @change="onDetectionTypeChange">
          <Radio.Button :value="item.value" v-for="item in DetectionModeList" :key="item.value">{{
            item.label
          }}</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <div>
        <BatchDetectionTable
          v-if="formData.detectionMode === DetectionMode.SOME_CHECK"
          v-model:value="productDetectionList"
          hideColumns="result"
        />
        <BatchDetectionTable v-else v-model:value="productDetectionList" hideColumns="result,action" />

        <div class="text-right mt-12px" v-if="formData.detectionMode === DetectionMode.SOME_CHECK">
          <p class="text-primary hover-underline" @click="handleAllQualified">一键合格</p>
        </div>

        <p v-if="formData.detectionMode === DetectionMode.SOME_CHECK" class="text-warn"
          >- 抽检需要记录每项的检测情况;</p
        >
        <p v-else class="text-warn">- 全检上述信息仅作为参考项；</p>
      </div>
    </div>

    <!-- 3、物料批次-检测结果 -->
    <SubTitle :size="AntUniversalSize.small" title="3、物料批次-检测结果" />
    <div class="w-580px ml-32px">
      <Form.Item name="detectionDate" label="检测日期">
        <DatePicker
          :allow-clear="false"
          class="!w-120px"
          v-model:value="tempData.detectionDate"
          @change="handleDetectionDateChange"
          placeholder="请填写"
        />
      </Form.Item>

      <Form.Item v-if="isSomecheck" name="spotcheckValue" label="抽检数量">
        <InputNumber
          :min="0"
          :max="batchInfo?.supplyValue"
          placeholder="请填写"
          v-model:value="formData.spotcheckValue"
        />
      </Form.Item>

      <Form.Item v-if="isAllcheck" name="allcheckQualifiedValue" label="合格数量">
        <InputNumber
          class=""
          :min="0"
          :max="batchInfo?.supplyValue"
          placeholder="请填写"
          v-model:value="formData.allcheckQualifiedValue"
        />
      </Form.Item>

      <Form.Item v-if="isAllcheck" name="allcheckUnqualifiedValue" label="不合格数量">
        <InputNumber
          :min="0"
          :max="batchInfo?.supplyValue"
          placeholder="请填写"
          v-model:value="formData.allcheckUnqualifiedValue"
        />
      </Form.Item>

      <Form.Item name="detectionConclusion" label="检测结论">
        <Radio.Group v-model:value="formData.detectionConclusion">
          <Radio :value="item.value" v-for="item in BatchDetectionConclusionList" :key="item.value">{{
            item.label
          }}</Radio>
        </Radio.Group>
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
  import {
    FormInstance,
    Button,
    Form,
    Select,
    Input,
    DatePicker,
    InputNumber,
    Modal,
    Row,
    Col,
    Radio,
    message,
  } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed, toRaw } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { DetectionMode, DetectionResult, SpotcheckType } from "/@/enums/model/index";
  import { productBatchDetail } from "/@/api/productBatch";
  import { productBatchDetectionAdd, productBatchDetectionEdit } from "/@/api/productBatchDetection";
  import { productTaskDetail, productTaskList } from "/@/api/productTask";
  import { ProductBatchDetail, ProductBatchInfo } from "/@/api/model/productBatch";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { productListAll } from "/@/api/product";
  import dayjs, { Dayjs } from "dayjs";
  import { ProductInfo } from "/@/api/model/product";
  import { getTimeNo, debounce, formatDateByDayjs } from "/@/utils/util";
  import { ProductTaskInfo } from "/@/api/model/productTask";
  import { defaultPageSize } from "/@/config";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { ProductBatchDetectionDetail, ProductBatchDetectionInfo } from "/@/api/model/productBatchDetection";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { DetectionModeList } from "/@/config/data";
  import { BatchDetectionConclusionList } from "/@/config/data";
  import { productBatchDetectionDetail } from "/@/api/productBatchDetection";
  import BatchDetectionTable from "/@/views/components/BatchDetectionTable/index.vue";
  import { productDetectionListAll } from "/@/api/productDetection";
  import { DetectionInfoBatchDetectionExpand } from "/@/api/model";
  import TextNoEdit from "/@/views/baseComponents/TextNoEdit.vue";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    mode?: CommonComponentMode;
    id?: number;
    productBatchId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.ADD,
    id: undefined,
    productBatchId: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const batchInfo = ref<ProductBatchDetail>();

  const productDetectionList = ref<DetectionInfoBatchDetectionExpand[]>([]);

  const tempData = reactive<{
    detectionDate?: Dayjs;
  }>({
    detectionDate: dayjs(),
  });

  const formData = reactive<Partial<ProductBatchDetectionInfo>>({
    id: undefined,
    productBatchId: undefined,
    detectionMode: DetectionMode.SOME_CHECK,
    detectionJson: "",
    detectionDate: formatDateByDayjs(),
    detectionConclusion: undefined,
    spotcheckValue: undefined,
    allcheckQualifiedValue: undefined,
    allcheckUnqualifiedValue: undefined,
    memo: "",
  });

  const formRules = getFormRules();

  const isAddMode = props.mode === CommonComponentMode.ADD;
  const isEditMode = props.mode === CommonComponentMode.EDIT;
  const isDetailMode = props.mode === CommonComponentMode.DETAIL;

  const modeText = isEditMode ? "编辑检测" : "完成检测";

  const isSomecheck = computed(() => formData.detectionMode === DetectionMode.SOME_CHECK);
  const isAllcheck = computed(() => formData.detectionMode === DetectionMode.ALL_CHECK);

  onMounted(async () => {
    const { id, productBatchId } = props;

    if (isEditMode || isDetailMode) {
      await toGetNeedInfo();

      // 1、获取产品批次详情
      await toGetProductBatchInfo(productBatchId!!);

      // 2、获取产品批次检测详情
      const detecionInfo = await productBatchDetectionDetail(id!!);
      Object.keys(formData).forEach((key: keyof ProductBatchDetectionInfo) => {
        setPropertyValue(formData, key, detecionInfo[key]);
      });

      // 特殊字段处理
      const { detectionDate, detectionJson } = detecionInfo;
      // 检测日期
      tempData.detectionDate = dayjs(detectionDate);
      // 触发更新
      handleDetectionDateChange();

      // 检测JSON转化
      const detectionJsonList = JSON.parse(detectionJson);
      console.log(detectionJsonList);
      productDetectionList.value = detectionJsonList;
    } else {
      await toGetProductBatchInfo(productBatchId!!);
      const { productId } = batchInfo.value!!;

      // 获取产品检测项
      toGetProuctDetectionList(productId);
    }
  });

  /** 获取产品批次详情 */
  async function toGetProductBatchInfo(productBatchId: number) {
    // 获取产品批次详情
    const bInfo = await productBatchDetail(productBatchId);

    // 同步业务数据
    formData.productBatchId = productBatchId;

    // 同步批次数据
    batchInfo.value = bInfo;
  }

  /** 临时数据-检测时间变更 */
  async function handleDetectionDateChange() {
    const date = tempData.detectionDate!!;
    if (date) {
      const d = date.format("YYYY-MM-DD HH:mm:ss");
      formData.detectionDate = d;
    } else {
      formData.detectionDate = undefined;
    }
  }

  /** 一键合格 */
  function handleAllQualified() {
    const pdList = [...productDetectionList.value];
    pdList.forEach((i) => {
      i.result = DetectionResult.QUALIFIED;
    });
    productDetectionList.value = pdList;
  }

  /** 检测类型变化 */
  function onDetectionTypeChange() {}

  /** 获取必要信息 */
  async function toGetNeedInfo() {}

  /** 获取产品检测项 */
  async function toGetProuctDetectionList(productId: number) {
    const pdList = await productDetectionListAll(productId);
    productDetectionList.value = pdList;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    // 如果是抽检 校验检测列表值
    const { detectionMode } = formData;
    if (detectionMode === DetectionMode.SOME_CHECK) {
      const allDone = productDetectionList.value.every((i) => typeof i.result === "number");
      if (!allDone) {
        message.warn("请完成表格内全部检测项！");
        return;
      }
    }

    // 二级校验
    await validForm();

    // 注入 detectionJson
    const pdList = unref(productDetectionList);
    const detectionJson = JSON.stringify(pdList);
    formData.detectionJson = detectionJson;

    const data = toRaw(formData);
    console.log(data);
    await productBatchDetectionAdd(data);

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
