<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、产品-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、产品-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="productNo" label="产品编码">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.productNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleProductNoRandomClick" />
        </div>
      </Form.Item>

      <Form.Item name="productName" label="产品名称">
        <Input v-model:value="formData.productName" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="productModel" label="产品型号">
        <Input v-model:value="formData.productModel" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="dictItemProductTypeId" label="产品类型">
        <div class="flex items-center">
          <Select allowClear placeholder="产品类型" v-model:value="formData.dictItemProductTypeId">
            <Select.Option v-for="{ id, itemValue } in dataStore.dictItemProductTypeList" :key="id" :value="id">
              {{ itemValue }}
            </Select.Option>
          </Select>
          <div class="text-primary hover-opacity whitespace-nowrap ml-6px" @click="handleDictProductTypeClick">
            管理
          </div>
        </div>
      </Form.Item>

      <Form.Item name="productWeight" label="产品重量">
        <InputNumber
          class="!w-90px"
          v-model:value="formData.productWeight"
          :min="0"
          placeholder="请输入"
          addon-after="克" 
        />
      </Form.Item>
    </div>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>

  <!-- 弹窗 - 配置字典 -->
  <Modal
    :style="{ width: '520px' }"
    v-model:visible="modalConfigState.visible"
    :title="`配置字典: ${modalConfigState.dictName}`"
    :footer="null"
    destroyOnClose
    @cancel="handleConfigModalCancel"
  >
    <Config :dictId="modalConfigState.id" :dictNo="modalConfigState.dictNo" />
  </Modal>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { productDetail, productEdit, productAdd } from "/@/api/product";
  import { ProductInfo } from "/@/api/model/product";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { randomId } from "/@/utils/util";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { randomProductNo } from "/@/config/parse/number";

  const resetCSSPrefix = getResetCSSPrefix();

  const dataStore = useDataStore();

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<ProductInfo>>({
    id: undefined,
    productNo: undefined,
    productName: undefined,
    productModel: undefined,
    dictItemProductTypeId: undefined,
    productWeight: undefined,
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  /** 弹窗 - 配置字典 */
  const modalConfigState = reactive<{
    id?: number;
    visible: boolean;
    dictName: string;
    dictNo: string;
  }>({
    id: undefined,
    visible: false,
    dictName: "",
    dictNo: "",
  });

  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await productDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof ProductInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      toRandomProductNo();
    }
  });

  /** 初始化产品编码 */
  function toRandomProductNo() {
    const productNo = randomProductNo();
    formData.productNo = productNo;
  }

  /** 随机化产品编码 */
  function handleProductNoRandomClick() {
    toRandomProductNo();
  }

  /** 点击 - 产品类型字典管理 */
  async function handleDictProductTypeClick() {
    const { dictId } = dataStore.dictItemProductTypeList[0];
    // 获取字典类型
    const dictInfo = await dictDetail(dictId);
    handleDictConfig(dictId, dictInfo);
  }

  /** 点击 - 配置字典 */
  function handleDictConfig(id: number, record: DictInfo) {
    modalConfigState.id = id;
    modalConfigState.dictName = record.dictName;
    modalConfigState.visible = true;
  }

  /** ConfigModal 弹窗关闭 */
  async function handleConfigModalCancel() {
    modalConfigState.visible = false;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 编辑模式
    if (isEditMode) {
      await productEdit(formData);
    } else {
      await productAdd(formData);
    }

    await dataStore.initProductList();

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
