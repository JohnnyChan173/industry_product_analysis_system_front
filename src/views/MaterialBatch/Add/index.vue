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
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="batchNo" label="物料批次号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.batchNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item label="关联采购单">
        <Select
          allowClear
          placeholder="请选择"
          v-model:value="formData.materialPurchaseId"
          :showSearch="true"
          showArrow
          :filterOption="false"
          @search="onMaterialPurchaseSearch"
          @change="onMaterialPurchaseChange"
        >
          <Select.Option v-for="{ id, purchaseNo } in materialPurchaseSelectList" :key="id" :value="id">
            {{ purchaseNo }}
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="materialId" label="批次物料">
        <MaterialRelate
          v-model:materialId="formData.materialId"
          v-model:materialSpecsId="formData.materialSpecsId"
          :allowMaterialIds="allowMaterialIds"
          :allowMaterialSpecsIds="allowMaterialSpecsIds"
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
  import { materialBatchDetail, materialBatchEdit, materialBatchAdd } from "/@/api/materialBatch";
  import { materialPurchaseDetail, materialPurchaseList } from "/@/api/materialPurchase";
  import { MaterialBatchInfo } from "/@/api/model/materialBatch";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { getTimeNo, debounce } from "/@/utils/util";
  import { MaterialPurchaseDetail, MaterialPurchaseInfo } from "/@/api/model/materialPurchase";
  import { defaultPageSize } from "/@/config";
  import MaterialRelate from "/@/views/components/MaterialRelate/index.vue";
  import TextNoEdit from "/@/views/baseComponents/TextNoEdit.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { randomMaterialBatchNo } from "/@/config/parse/number";
  import dayjs, { Dayjs } from "dayjs";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    mode?: CommonComponentMode;
    id?: number;
    materialPurchaseId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.ADD,
    id: undefined,
    materialPurchaseId: undefined,
  });

  const emits = defineEmits(["change:ok"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<MaterialBatchInfo>>({
    id: undefined,
    batchNo: "",
    recordDate: "",
    materialPurchaseId: undefined,
    materialId: undefined,
    materialSpecsId: undefined,
    supplyValue: undefined,
    memo: "",
  });

  const tempData = reactive<{
    recordDate?: Dayjs;
  }>({
    recordDate: dayjs(),
  });

  const materialPurchaseSelectList = ref<MaterialPurchaseDetail[]>([]);

  const allowMaterialIds = ref<number[]>([]);
  const allowMaterialSpecsIds = ref<number[]>([]);

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const isDetailMode = props.mode === CommonComponentMode.DETAIL;

  const modeText = isEditMode ? "编辑" : "创建";

  const debounceGetMaterialPurchaseList = debounce(toGetMaterialPurchaseList);

  onMounted(async () => {
    await toGetNeedInfo();
    const { id, materialPurchaseId } = props;

    if (isEditMode) {
      const info = await materialBatchDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof MaterialBatchInfo) => {
        setPropertyValue(formData, key, info[key]);
      });

      // 特殊字段处理
      const { recordDate, materialPurchaseId } = info;
      tempData.recordDate = dayjs(recordDate);

      // 触发更新
      handleTempDataPlanCompleteDateChange();

      // 获取对应任务单号的详情
      if (materialPurchaseId) {
        await toSyncMaterialPurchaseSelectListById(materialPurchaseId);
      }
    } else {
      // 赋值随机编号
      handleRandomNo();
      // 触发更新
      handleTempDataPlanCompleteDateChange();

      if (materialPurchaseId) {
        await toSyncMaterialPurchaseSelectListById(materialPurchaseId);
      } else {
        await toGetMaterialPurchaseList();
      }
    }
  });

  /** 根据采购单id同步下拉列表 */
  async function toSyncMaterialPurchaseSelectListById(materialPurchaseId: number) {
    // 获取对应任务单号的详情
    const taskInfo = await materialPurchaseDetail(materialPurchaseId);
    materialPurchaseSelectList.value = [taskInfo];
    formData.materialPurchaseId = materialPurchaseId;
    onMaterialPurchaseChange(materialPurchaseId);
  }

  /** 临时数据-交付时间变更 */
  function handleTempDataPlanCompleteDateChange() {
    const date = tempData.recordDate!!;
    const d = date.format("YYYY-MM-DD HH:mm:ss");
    formData.recordDate = d;
  }

  /** 物料单变化 */
  function onMaterialPurchaseChange(id: number) {
    const purchaseInfo = materialPurchaseSelectList.value.find((i) => i.id === id);
    if (purchaseInfo) {
      const { materialPurchaseItemList } = purchaseInfo;
      allowMaterialIds.value = materialPurchaseItemList.map((i) => i.materialId);
      allowMaterialSpecsIds.value = materialPurchaseItemList.map((i) => i.materialSpecsId);
      // 如果物料仅一款 则同步批次物料
      if (materialPurchaseItemList.length === 1) {
        formData.materialId = materialPurchaseItemList[0].materialId;
        formData.materialSpecsId = materialPurchaseItemList[0].materialSpecsId;
        formData.supplyValue = materialPurchaseItemList[0].value;
      }
    } else {
      allowMaterialIds.value = [];
      allowMaterialSpecsIds.value = [];
    }
    console.log(allowMaterialIds.value, allowMaterialSpecsIds.value);
  }

  /** 物料单搜索 */
  function onMaterialPurchaseSearch(input: string) {
    debounceGetMaterialPurchaseList(input);
  }

  /** 获取采购单列表 */
  async function toGetMaterialPurchaseList(keyword?: string) {
    const data = { pageNum: 1, pageSize: defaultPageSize, sort: "id desc", keyword };

    const { records } = await materialPurchaseList(data);
    materialPurchaseSelectList.value = records;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {}

  /** 随机生成编号 */
  async function handleRandomNo() {
    const no = randomMaterialBatchNo();
    formData.batchNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    // 编辑模式
    if (isEditMode) {
      await materialBatchEdit(formData);
    } else {
      await materialBatchAdd(formData);
    }

    emits("change:ok");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
