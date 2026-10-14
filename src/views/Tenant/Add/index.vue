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
    <!-- 1、租户基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、租户基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="tenantName" label="租户名称">
        <Input v-model:value="formData.tenantName" placeholder="请输入" />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="请输入" />
      </Form.Item>
    </div>

    <!-- 2、租户账号信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2、租户账号信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="tenantMainAccount" label="租户主账号" v-if="!isEditMode">
        <Input v-model:value="formData.tenantMainAccount" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="validDate" label="有效期至">
        <div class="flex items-center">
          <DatePicker
            v-model:value="tempData.validDate"
            @change="handleTempDataValidDateChange"
            valueFormat="YYYY-MM-DD"
          />
        </div>
        <p class="text-primary" v-if="tempData.validDate">- 剩余 {{ validDateRest }} 天</p>
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
  import { FormInstance, Button, Form, Input, DatePicker, Checkbox } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { CommonCheck } from "/@/enums/model";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { TenantInfo } from "/@/api/model/tenant";
  import dayjs, { Dayjs } from "dayjs";
  import { tenantAdd, tenantDetail, tenantEdit } from "/@/api/tenant";

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

  const formData = reactive<Partial<TenantInfo & { tenantMainAccount: string }>>({
    id: undefined,
    tenantName: "",
    memo: "",
    tenantMainAccount: "",
    validDate: "",
  });

  const tempData = reactive<{
    validDate?: Dayjs;
  }>({
    validDate: undefined,
  });

  const validDateRest = computed(() => {
    const dayjsDate = dayjs(tempData.validDate!!);
    console.log("dayjsDatedayjsDatedayjsDate", dayjsDate);
    if (dayjsDate) {
      const t1 = dayjsDate.toDate().getTime();
      const t2 = Date.now();

      const od = Math.ceil((t1 - t2) / 1000 / 60 / 60 / 24);
      return od;
    } else {
      return 0;
    }
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await tenantDetail(id!!);

      Object.keys(formData).map((key: keyof TenantInfo) => {
        setPropertyValue(formData, key, info[key]);
      });

      // 特殊字段处理
      const { validDate } = info;
      tempData.validDate = dayjs(validDate);
    }
  });

  /** 临时数据-有效期至变更 */
  function handleTempDataValidDateChange() {
    console.log("tempDatatempDatatempData", tempData);
    const date = tempData.validDate!!;
    const d = date;
    formData.validDate = d + " 23:59:59";
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    const data = unref(formData) as any;

    // 编辑模式
    if (isEditMode) {
      await tenantEdit(data);
    } else {
      await tenantAdd(data);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
