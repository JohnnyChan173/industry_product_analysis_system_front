<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、采购订单-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、采购订单-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="purchaseNo" label="采购单编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.purchaseNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item name="supplierId" label="供应商对象">
        <div class="flex items-center">
          <Select
            allowClear
            placeholder="请选择"
            v-model:value="formData.supplierId"
            :showSearch="true"
            showArrow
            :filterOption="false"
            @search="onSupplierSearch"
          >
            <Select.Option v-for="{ id, supplierName } in supplierFilterList" :key="id" :value="id">
              {{ supplierName }}
            </Select.Option>
          </Select>
          <span class="absolute -right-8 text-primary hover-opacity" @click="handleSupplierAddClick"> 创建 </span>
        </div>
      </Form.Item>

      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="选填" />
      </Form.Item>
    </div>

    <!-- 2、采购订单-物料信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2、采购订单-物料信息" />
    <div>
      <Form.Item name="materialPurchaseItemList" label="" :autoLink="false">
        <PurchaseItemTable v-model:value="formData.materialPurchaseItemList" />
      </Form.Item>
      <p class="text-warn">总金额：￥{{ getMaterialPurchasePriceTotal(formData.materialPurchaseItemList) }}</p>
    </div>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item v-if="!isDetailMode">
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
      <TextNoEdit v-else />
    </div>
  </Form>

  <!-- 弹窗 - 创建供应商 -->
  <Modal
    v-model:visible="modalSupplierAddState.visible"
    :title="modalSupplierAddState.title"
    :footer="null"
    destroyOnClose
  >
    <SupplierAdd :id="modalSupplierAddState.id" @change="handleSupplierAddChange" />
  </Modal>
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
    Radio,
    message,
  } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed, toRaw } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import { materialPurchaseDetail, materialPurchaseEdit, materialPurchaseAdd } from "/@/api/materialPurchase";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { InfoCircleOutlined, LinkOutlined } from "@ant-design/icons-vue";
  import { productListAll } from "/@/api/product";
  import dayjs, { Dayjs } from "dayjs";
  import { ProductInfo } from "/@/api/model/product";
  import { debounce, getTimeNo } from "/@/utils/util";
  import { MaterialPurchaseTypeList } from "/@/config/data";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { CommonCheck, MaterialPurchaseType } from "/@/enums/model";
  import { randomMaterialPurchaseNo } from "/@/config/parse/number";
  import { getMaterialPurchasePriceTotal } from "/@/config/parse";
  import ProductBom from "/@/views/Product/ProductBom/index.vue";
  import { productBomStockCheck } from "/@/api/productBom";
  import { SupplierInfo } from "/@/api/model/supplier";
  import { MaterialPurchaseAddData, MaterialPurchaseInfo } from "/@/api/model/materialPurchase";
  import { supplierListAll } from "/@/api/supplier";
  import PurchaseItemTable from "./purchase-item-table.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import SupplierAdd from "/@/views/Supplier/Add/index.vue";
  import TextNoEdit from "/@/views/baseComponents/TextNoEdit.vue";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    mode?: CommonComponentMode;
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.ADD,
    id: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<MaterialPurchaseAddData>({
    id: undefined,
    purchaseNo: "",
    supplierId: undefined,
    memo: "",
    materialPurchaseItemList: [],
  });

  /** 弹窗 - 创建供应商 */
  const modalSupplierAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "创建供应商",
  });

  const supplierRawList = ref<SupplierInfo[]>([]);
  const supplierFilterList = ref<SupplierInfo[]>([]);

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    await toGetNeedInfo();

    if (isEditMode) {
      const { id } = props;
      const info = await materialPurchaseDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof MaterialPurchaseInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      // 赋值随机编号
      handleRandomNo();
    }
  });

  /** SupplierAdd 组件变化 */
  async function handleSupplierAddChange() {
    await toGetSupplierListAll();
    modalSupplierAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 创建员工 */
  function handleSupplierAddClick() {
    modalSupplierAddState.id = undefined;
    modalSupplierAddState.visible = true;
    modalSupplierAddState.title = "创建供应商";
  }

  /** 供应商搜索 */
  function onSupplierSearch(input?: string) {
    if (input) {
      const fList = supplierRawList.value.filter((i) => i.supplierName.includes(input) || i.supplierNo.includes(input));
      supplierFilterList.value = fList;
    } else {
      supplierFilterList.value = supplierRawList.value;
    }
  }

  /** 获取全部供应商列表 */
  async function toGetSupplierListAll() {
    // 获取供应商列表
    const pList = await supplierListAll();
    supplierRawList.value = pList;
    onSupplierSearch();
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    await toGetSupplierListAll();
  }

  /** 随机生成编号 */
  async function handleRandomNo() {
    const no = randomMaterialPurchaseNo();
    formData.purchaseNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    const data = toRaw(formData) as MaterialPurchaseAddData;

    // 检查物料列表
    const list = data.materialPurchaseItemList;
    const allValueOk = list.every((i) => typeof i.value === "number");
    if (!allValueOk) {
      message.warn("存在物料未填写数量！");
      return;
    }

    // 编辑模式
    if (isEditMode) {
      await materialPurchaseEdit(data);
    } else {
      await materialPurchaseAdd(data);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
