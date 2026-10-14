<template>
  <Form
    v-loading="loading"
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、产品出库任务单-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、产品出库任务单-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="taskType" label="出库单类型">
        <Radio.Group v-model:value="formData.deliveryType">
          <Radio v-for="item in ProductDeliveryTaskTypeList" :key="item.value" :value="item.value">{{
            item.label
          }}</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item v-if="formData.deliveryType === ProductDeliveryTaskType.SALE" name="saleOrderNo" label="关联销售订单">
        <Input v-model:value="formData.saleOrderNo" placeholder="请输入销售订单号(外部系统)" />
      </Form.Item>

      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="选填" />
      </Form.Item>
    </div>

    <!-- 2、产品出库订单-物料信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2、产品出库订单-物料信息" />
    <div>
      <Form.Item name="productDeliveryTaskDemandList" label="" :autoLink="false">
        <DeliveryItemTable v-model:value="formData.productDeliveryTaskDemandList" />
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
    Radio,
    message,
  } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed, toRaw } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import {
    productDeliveryTaskDetail,
    productDeliveryTaskEdit,
    productDeliveryTaskAdd,
  } from "/@/api/productDeliveryTask";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { InfoCircleOutlined, LinkOutlined } from "@ant-design/icons-vue";
  import { productGetProductStock, productListAll } from "/@/api/product";
  import dayjs, { Dayjs } from "dayjs";
  import { ProductInfo } from "/@/api/model/product";
  import { debounce, getTimeNo, parseList2Ids } from "/@/utils/util";
  import { ProductDeliveryTaskTypeList } from "/@/config/data";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { CommonCheck, ProductDeliveryTaskType } from "/@/enums/model";
  import { randomProductDeliveryTaskNo } from "/@/config/parse/number";
  import { getProductDeliveryTaskPriceTotal } from "/@/config/parse";
  import { productBomStockCheck } from "/@/api/productBom";
  import { SupplierInfo } from "/@/api/model/supplier";
  import { ProductDeliveryTaskAddData, ProductDeliveryTaskInfo } from "/@/api/model/productDeliveryTask";
  import { supplierListAll } from "/@/api/supplier";
  import DeliveryItemTable from "./delivery-item-table.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import SupplierAdd from "/@/views/Supplier/Add/index.vue";
  import TextNoEdit from "/@/views/baseComponents/TextNoEdit.vue";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    mode?: CommonComponentMode;
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: undefined,
    id: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);
  const loading = ref(false);

  const formData = reactive<ProductDeliveryTaskAddData>({
    id: undefined,
    deliveryTaskNo: "",
    deliveryType: ProductDeliveryTaskType.SALE,
    saleOrderNo: "",
    memo: "",
    productDeliveryTaskDemandList: [],
  });

  const formRules = getFormRules();

  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    loading.value = true;
    await toGetNeedInfo();

    if (isEditMode) {
      const { id } = props;
      const info = await productDeliveryTaskDetail(id!!);
      formData.id = id;
      console.log(info);

      const { productDeliveryTaskDemandList } = info;

      // 注入库存
      for (let i = 0; i < productDeliveryTaskDemandList.length; i++) {
        const di = productDeliveryTaskDemandList[i];
        const { productId, productAttrValueIdsList } = di;
        // 获取产品库存
        const stockValueTotal = await productGetProductStock(productId, parseList2Ids(productAttrValueIdsList));
        di.stockValueTotal = stockValueTotal;
      }

      Object.keys(formData).forEach((key: keyof ProductDeliveryTaskInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      // 赋值随机编号
      handleRandomTaskNo();
    }

    loading.value = false;
  });

  /** 获取必要信息 */
  async function toGetNeedInfo() {}

  /** 随机生成产品出库订单号 */
  async function handleRandomTaskNo() {
    const no = randomProductDeliveryTaskNo();
    formData.deliveryTaskNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    const data = toRaw(formData) as ProductDeliveryTaskAddData;

    // 检查产品出库列表
    const list = data.productDeliveryTaskDemandList;
    const allValueOk = list.every((i) => typeof i.demandValue === "number");
    if (!allValueOk) {
      message.warn("存在产品出库未填写数量！");
      return;
    }

    // 编辑模式
    if (isEditMode) {
      await productDeliveryTaskEdit(data);
    } else {
      await productDeliveryTaskAdd(data);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
