<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 顶部选项卡 -->
    <Radio.Group v-model:value="panelIndex" button-style="solid" class="!h-auto">
      <Radio.Button :value="0">工序基础信息</Radio.Button>
      <!-- <Radio.Button :disabled="true" :value="1">工序过程特性</Radio.Button> -->
    </Radio.Group>
    <div style="border-bottom: 1px solid #ccc; margin-top: -4px"> </div>

    <!-- 工序基础信息-面板 -->
    <template v-if="panelIndex === 0">
      <!-- 1、工序基础信息 -->
      <SubTitle :size="AntUniversalSize.small" title="1、工序基础信息" />
      <div :style="formNormalParams.divItemStyle">
        <Form.Item name="procedureName" label="工序名称">
          <Input v-model:value="formData.procedureName" placeholder="请输入" />
        </Form.Item>
        <!-- 工序编号 -->
        <Form.Item name="procedureNo" label="工序编号">
          <Input v-model:value="formData.procedureNo" placeholder="请输入" />
        </Form.Item>
        <Form.Item name="procedureType" label="工序类型">
          <Radio.Group v-model:value="formData.procedureType">
            <Radio v-for="item in ProcedureTypeList" :key="item.value" :value="item.value">
              {{ item.label }}
            </Radio>
          </Radio.Group>
        </Form.Item>
<!-- 
        <Form.Item label="过程特性">
          <Checkbox v-model:checked="procedureProcessCheck" @change="handleProcedureProcessCheckChange">具备</Checkbox>
        </Form.Item> -->

        <Form.Item label="工序描述">
          <Input.TextArea :rows="4" v-model:value="formData.procedureDesc" placeholder="选填" />
        </Form.Item>
      </div>
    </template>

    <!-- 工序过程特性-面板 -->
    <template v-else> </template>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Input, Radio, Checkbox } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed, watch } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { CraftProcedureInfo } from "/@/api/model/craftProcedure";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { CommonCheck } from "/@/enums/model";
  import { ProcedureTypeList } from "/@/config/data";
  import { randomId } from "/@/utils/util";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    info?: CraftProcedureInfo;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });

  const emits = defineEmits(["change:add", "change:edit"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<CraftProcedureInfo>>({
    id: undefined,
    procedureUuid: randomId(),
    procedureName: undefined,
    procedureType: undefined,
    procedureProcess: CommonCheck.FALSE,
    procedureSort: 0,
    procedureDesc: "",
    procedureNo: undefined,

  });

  const procedureProcessCheck = ref(false);
  const panelIndex = ref(0);

  const formRules = getFormRules();

  const isEditMode = !!props.info;
  const modeText = isEditMode ? "编辑" : "创建";

  watch(
    () => formData.procedureProcess,
    (v) => {
      procedureProcessCheck.value = v ? true : false;
    },
    { immediate: true }
  );

  onMounted(async () => {
    if (isEditMode && props.info) {
      const { info } = props;
      console.log(info);

      Object.keys(formData).forEach((key: keyof CraftProcedureInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    }
  });

  /** 选择框-点击 */
  async function handleProcedureProcessCheckChange() {
    formData.procedureProcess = procedureProcessCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    // 编辑模式
    if (isEditMode) {
      emits("change:edit", formData);
    } else {
      emits("change:add", formData);
    }
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
