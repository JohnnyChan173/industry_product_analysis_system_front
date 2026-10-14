<template>
  <div>
    <Form
      autocomplete="off"
      :model="formData"
      :rules="formRules"
      ref="formRef"
      :class="`${resetCSSPrefix}-form-normal`"
      :labelCol="{ style: { width: '150px' } }"
    >
      <SubTitle :size="AntUniversalSize.small" title="1、物料检测项-基础信息" />

      <div class="w-520px">
        <Form.Item name="detectionName" label="检测项名称">
          <Input v-focus v-model:value="formData.detectionName" placeholder="请输入" />
        </Form.Item>

        <Form.Item name="detectionWeight" label="检测项权重">
          <Radio.Group v-model:value="formData.detectionWeight">
            <Radio v-for="item in DetectionWeightList" :key="item.value" :value="item.value">{{ item.label }}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="detectionType" label="检测项类型">
          <Radio.Group v-model:value="formData.detectionType">
            <Radio v-for="item in DetectionTypeList" :key="item.value" :value="item.value">{{ item.label }}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          v-if="formData.detectionType === DetectionType.MEASURE"
          required
          label="计量值区间"
          class="form-item-secondary"
        >
          <!-- 策略 - 计量值区间 -->
          <Form.Item name="detectionMax" label="上限USL">
            <InputNumber v-model:value="formData.detectionMax" :min="0" :max="9999" placeholder="请输入" />
          </Form.Item>

          <Form.Item name="detectionBase" label="中心限CL">
            <InputNumber v-model:value="formData.detectionBase" :min="0" :max="9999" placeholder="请输入" />
          </Form.Item>

          <Form.Item name="detectionMin" label="下限LSL">
            <InputNumber v-model:value="formData.detectionMin" :min="0" :max="9999" placeholder="请输入" />
          </Form.Item>
          <p class="text-12px text-gray-400"> - 根据实际检测项填写计量范围； </p>
        </Form.Item>

        <Form.Item label="检测要求">
          <Input.TextArea :rows="4" v-model:value="formData.detectionDesc" placeholder="描述检测要求,选填" />
        </Form.Item>
      </div>

      <div :style="formNormalParams.divBtnStyle">
        <Form.Item>
          <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
          <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
        </Form.Item>
      </div>
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { Button, Input, InputNumber, FormInstance, Form, Radio } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref } from "vue";
  import { DetectionType, DetectionWeight } from "/@/enums/model";
  import { DetectionTypeList, DetectionWeightList } from "/@/config/data";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { MaterialDetectionDetail } from "/@/api/model/materialDetection";
  import { materialDetectionAdd, materialDetectionDetail, materialDetectionEdit } from "/@/api/materialDetection";
  import { useFormUtils } from "/@/hooks/antd/form";
  import { getFormRules } from "./useForm";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { formNormalParams, getResetCSSPrefix, normalBtnStyle } from "/@/config/domStyle";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { MaterialDetectionInfo } from "/@/api/model/materialDetection";

  interface Props {
    id: number;
    materialId: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    materialId: undefined,
  });

  const emits = defineEmits(["change:ok"]);

  const resetCSSPrefix = getResetCSSPrefix();

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<MaterialDetectionInfo>>({
    id: undefined,
    materialId: undefined,
    detectionName: "",
    detectionWeight: DetectionWeight.NORMAL,
    detectionType: DetectionType.COUNT,
    detectionMin: undefined,
    detectionBase: undefined,
    detectionMax: undefined,
    detectionDesc: "",
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  // mounted
  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await materialDetectionDetail(id!!);
      formData.id = id;

      console.log(info);
      Object.keys(formData).forEach((key: keyof MaterialDetectionDetail) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      const { materialId } = props;
      formData.materialId = materialId;
    }
  });

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 编辑模式
    if (isEditMode) {
      const data = formData;
      // 编辑工序
      await materialDetectionEdit(data);
    } else {
      // 创建
      const data = formData;
      await materialDetectionAdd(data);
    }

    emits("change:ok");
  }
</script>

<style lang="less" scoped></style>
