<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、供应商-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、供应商-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="supplierNo" label="供应商编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.supplierNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item name="supplierName" label="供应商名称">
        <Input v-model:value="formData.supplierName" placeholder="请输入" />
      </Form.Item>
    </div>

    <!-- 2、供应商-其他信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2、供应商-其他信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item label="负责人">
        <Input v-model:value="formData.leader" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="contract" label="联系方式">
        <Input :maxLength="11" v-model:value="formData.contract" placeholder="请输入" />
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
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { supplierDetail, supplierEdit, supplierAdd } from "/@/api/supplier";
  import { SupplierInfo } from "/@/api/model/supplier";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { randomSupplierNo } from "/@/config/parse/number";
  import { LinkOutlined } from "@ant-design/icons-vue";

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

  const formData = reactive<Partial<SupplierInfo>>({
    id: undefined,
    supplierNo: "",
    supplierName: "",
    leader: "",
    contract: "",
    memo: "",
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await supplierDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof SupplierInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      // 赋值随机编号
      handleRandomNo();
    }
  });

  /** 随机生成任务单号 */
  async function handleRandomNo() {
    const no = randomSupplierNo();
    formData.supplierNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 编辑模式
    if (isEditMode) {
      await supplierEdit(formData);
    } else {
      await supplierAdd(formData);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
