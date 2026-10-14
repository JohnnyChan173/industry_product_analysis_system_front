<template>
  <!-- <BackBtn /> -->

  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、用户基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、用户基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="dictNo" label="字典编号" :rules="[{ required: true, message: '请输入内容' }]">
        <Input v-model:value="formData.dictNo" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="dictName" label="字典名称" :rules="[{ required: true, message: '请输入内容' }]">
        <Input v-model:value="formData.dictName" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="dictDesc" label="字典描述">
        <Input v-model:value="formData.dictDesc" placeholder="请输入" />
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
  import { FormInstance, Button, Form, Input } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { DictInfo } from "/@/api/model/dict";
  import { dictAdd, dictDetail, dictEdit } from "/@/api/dict";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { compModeText } from "/@/utils/util";

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

  const formData = reactive<Partial<DictInfo>>({
    id: undefined,
    dictNo: undefined,
    dictName: undefined,
    dictDesc: undefined,
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = compModeText(isEditMode);

  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await dictDetail(id!!);

      Object.keys(formData).map((key: keyof DictInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    }
  });

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    const data = unref(formData) as any;

    // 编辑模式
    if (isEditMode) {
      await dictEdit(data);
    } else {
      await dictAdd(data);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
