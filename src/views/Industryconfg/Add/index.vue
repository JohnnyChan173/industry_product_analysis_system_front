<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、应用信息 -->
    <div :style="formNormalParams.divItemStyle">

    <Form.Item name="configName" label="应用名称">
      <Input v-model:value="formData.configName" placeholder="请输入" />
    </Form.Item>

    <Form.Item name="configValue" label="应用值">
      <Input v-model:value="formData.configValue" placeholder="请输入" />
    </Form.Item>

    <Form.Item name="configType" label="应用类型">
      <Select v-model:value="formData.configType" :options="IndustryconfgConfigTypeList" placeholder="请选择" />
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
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal, message } from "ant-design-vue";
  import { onMounted, ref, reactive, unref } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import { getFormRules } from "./useForm";

  import { IndustryconfgConfigTypeList } from "/@/config/data";
  import { IndustryconfgInfo } from "/@/api/model/Industryconfg";
  import { IndustryconfgAdd, IndustryconfgDetail, IndustryconfgEdit } from "/@/api/Industryconfg";

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

  const formData = reactive<Partial<IndustryconfgInfo>>({
    id: undefined,
    configName: undefined,
    configValue: undefined,
    configType: undefined,
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    if (isEditMode) {
      // 获取应用详情数据
      console.log(props.id);
      const { id } = props;
      const info = await IndustryconfgDetail(id!!);
      formData.id = id;
      formData.configName = info.configName;
      formData.configValue = info.configValue;
      formData.configType = info.configType;
    }
  });

  /** 随机生成任务单号 */

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    if (isEditMode) {
      // 编辑模式
      await IndustryconfgEdit(formData as IndustryconfgInfo);
    } else {
      // 创建模式
      await IndustryconfgAdd(formData as IndustryconfgInfo);
    }
    // 编辑模式
    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
