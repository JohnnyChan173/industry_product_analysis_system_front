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
    <!-- 基础信息 -->
    <FormTitle :size="AntUniversalSize.small" title="基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="workshopNo" label="车间编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.workshopNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item name="workshopName" label="车间名称">
        <Input v-model:value="formData.workshopName" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="workshopType" label="车间描述">
        <Input v-model:value="formData.workshopDesc" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="staffId" label="车间主任">
        <Select allowClear placeholder="请选择" v-model:value="formData.staffId" @change="handleChange">
            <Select.Option v-for="{ id, staffName } in leaderStaffList" :key="id" :value="id">
              {{ staffName }}
            </Select.Option>
          </Select>
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
  import { FormInstance, Button, Form, Input, Select } from "ant-design-vue";
  import { ref, reactive, unref, watch, defineProps, defineEmits, computed, onMounted } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import FormTitle from "/@/components/Title/FormTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { ApiExecuteMode, StaffType } from "/@/enums/model";
  import { WorkshopInfo } from "/@/api/model/workshop";
  import { workshopAdd, workshopDetail, workshopEdit } from "/@/api/workshop";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { randomWorkshopNo } from "/@/config/parse/number";
import { staffListAll } from "/@/api/staff";
import { StaffInfo } from "/@/api/model/staff";

  const resetCSSPrefix = getResetCSSPrefix();

  const props = defineProps({
    id: {
      type: Number,
    },
  });

  const emits = defineEmits(["change"]);
  const leaderStaffList = ref<StaffInfo[]>([]);



  const isEditMode = !!props.id;
  const modeText = isEditMode ? ApiExecuteMode.edit : ApiExecuteMode.create;

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<Partial<WorkshopInfo>>({
    id: undefined,
    workshopNo: "",
    workshopName: "",
    workshopDesc: "",
    staffId: undefined,
    staffName: "",
    staffNo: "",
  });

  const formRules = getFormRules(formData);

  watch(
    () => props.id,
    async (id) => {
      if (id) {
        const info = await workshopDetail(id);
        Object.keys(info).map((key: keyof WorkshopInfo) => {
          setPropertyValue(formData, key, info[key]);
        });
      }
    },
    { immediate: true }
  );

  onMounted(async () => {
    await toGetLeaderListAll();
    const { id } = props;
    if (isEditMode) {
      const info = await workshopDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(info).map((key: keyof WorkshopInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      // 赋值随机编号
      handleRandomNo();
    }
  });

  /** 随机生成编号 */
  async function handleRandomNo() {
    const no = randomWorkshopNo();
    formData.workshopNo = no;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    const editMode = unref(isEditMode);
    await validForm();
    if (editMode) {
      await workshopEdit(unref(formData));
    } else {
      await workshopAdd(unref(formData));
    }
    emits("change", editMode);
    resetForm();
  }
async function toGetLeaderListAll() {
    const leList = await staffListAll(StaffType.CJZR);
    leaderStaffList.value = leList;
  }
  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
  /** 变化 - 绑定车间主任 */
  function handleChange() {
    formData.staffId = formData.staffId;
    formData.staffName = leaderStaffList.value.find((item) => item.id === formData.staffId)?.staffName || "";
    formData.staffNo = leaderStaffList.value.find((item) => item.id === formData.staffId)?.staffNo || "";
  }
</script>

<style></style>
