<template>
  <Form
    autocomplete="off"
    :model="formData"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、应用信息 -->
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="configName" label="应用名称">
        {{ formData.configName }}
      </Form.Item>

      <Form.Item name="configValue" label="应用值">
        {{ formData.configValue }}
      </Form.Item>

      <Form.Item name="configType" label="应用类型">
        {{ IndustryconfgConfigTypeList.find((item) => item.value == formData.configType)?.label || "" }}
      </Form.Item>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal, message } from "ant-design-vue";
  import { onMounted, ref, reactive, unref } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";

  import { IndustryconfgConfigTypeList } from "/@/config/data";
  import { IndustryconfgInfo } from "/@/api/model/Industryconfg";
  import { IndustryconfgDetail } from "/@/api/Industryconfg";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });



  const formData = reactive<Partial<IndustryconfgInfo>>({
    id: undefined,
    configName: undefined,
    configValue: undefined,
    configType: undefined,
  });

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    // 获取应用详情数据
    const { id } = props;
    const info = await IndustryconfgDetail(id!!);
    formData.id = id;
    formData.configName = info.configName;
    formData.configValue = info.configValue;
    formData.configType = info.configType;
  });

</script>

<style></style>
