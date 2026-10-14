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
    <!-- 1、员工基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、员工基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="staffNo" label="员工编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.staffNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>
      <Form.Item name="staffName" label="员工姓名">
        <Input v-model:value="formData.staffName" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="staffType" label="员工类型">
        <Select placeholder="请选择" v-model:value="formData.staffType" @change="handleStaffTypeChange">
          <Select.Option v-for="{ value, label } in StaffTypeList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea :rows="4" v-model:value="formData.memo" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="workshopId" label="所属车间">
        <Select placeholder="请选择" v-model:value="formData.workshopId"  showArrow>
          <Select.Option v-for="{ id, workshopName } in WorkshopList" :key="id" :value="id">
            {{ workshopName }}
          </Select.Option>
        </Select>
      </Form.Item>
    </div>

    <!-- 2、员工账号信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2、员工账号信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="roleKeys" label="用户角色">
        <Select placeholder="请选择" v-model:value="formData.roleKeys" mode="multiple" showArrow>
          <Select.Option v-for="{ value, label } in TenantValidRoleKeyList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="phoneNumber" label="手机号">
        <Input :maxLength="11" v-model:value="formData.phoneNumber" placeholder="选填(可用于账号登录)" />
      </Form.Item>

      <Form.Item name="username" label="用户名" v-if="!isEditMode">
        <Input
          class="addon-before"
          :addon-before="userInfoStore.username"
          v-model:value="formData.username"
          placeholder="请输入"
        />
      </Form.Item>

      <Form.Item label="用户名" v-else>
        <p class="text-gray-400">{{ formData.username }}</p>
      </Form.Item>

      <Form.Item name="password" label="密码" v-if="!isEditMode">
        <Input type="password" v-model:value="formData.password" placeholder="请输入" />
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
  import { FormInstance, Button, Form, Input, DatePicker, Checkbox, Select } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { CommonCheck, StaffType, PlatformRoleKey } from "/@/enums/model";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { StaffInfo } from "/@/api/model/staff";
  import dayjs, { Dayjs } from "dayjs";
  import { staffAdd, staffDetail, staffEdit } from "/@/api/staff";
  import { StaffTypeList, TenantValidRoleKeyList } from "/@/config/data";
  import { useUserInfoStore } from "/@/store";
  import { randomStaffNo } from "/@/config/parse/number";
  import { LinkOutlined } from "@ant-design/icons-vue";
import { workshopListAll } from "/@/api/workshop";

  const resetCSSPrefix = getResetCSSPrefix();
  const WorkshopList = ref<any[]>([]);

  /** 获取车间列表；车间主任只保留自己负责的车间 */


  interface Props {
    id?: number;
    staffType?: StaffType;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    staffType: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const userInfoStore = useUserInfoStore();

  const formData = reactive<any>({
    id: undefined,
    staffNo: "",
    staffName: "",
    staffType: undefined,
    memo: "",
    roleKeys: [],
    phoneNumber: "",
    username: "",
    password: "",
  });

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    const { id, staffType } = props;

    await toGetNeedInfo();

    if (isEditMode) {
      const info = await staffDetail(id!!);

      Object.keys(formData).map((key: keyof StaffInfo) => {
        console.log(key, info[key]);
        setPropertyValue(formData, key, info[key]);
      });

      // 特殊字段处理
      formData.username = info.userInfo.username;
      formData.phoneNumber = info.userInfo.phoneNumber;
      formData.workshopId = info.workshopInfo.id;
    } else {
      // 赋值随机编号
      handleRandomNo();

      // 新增模式，判断是否带入默认员工类型
      if (staffType) {
        formData.staffType = staffType;
        handleStaffTypeChange();
      }
    }
  });

  /** 变化-员工类型 */
  async function handleStaffTypeChange() {
    const v = formData.staffType;

    // 自动同步用户角色
    if (v === StaffType.PUGONG) {
      formData.roleKeys = [PlatformRoleKey.PUGONG];
    } else if (v === StaffType.XIANZHANG) {
      formData.roleKeys = [PlatformRoleKey.XIANZHANG];
    } else if (v === StaffType.EVENT) {
      formData.roleKeys = [PlatformRoleKey.EVENT];
    } else if (v === StaffType.SPOTCHECK) {
      formData.roleKeys = [PlatformRoleKey.SPOTCHECK];
    } else if (v === StaffType.WAREHOUSE) {
      formData.roleKeys = [PlatformRoleKey.WAREHOUSE];
    }

    console.log(v);
  }

  /** 随机生成编号 */
  async function handleRandomNo() {
    const no = randomStaffNo();
    formData.staffNo = no;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetWorkshopList();
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();
    const data = unref(formData) as any;

    // 编辑模式
    if (isEditMode) {
      await staffEdit(data);
    } else {
      // 用户名拼接
      const { username } = data;

      const u = `${userInfoStore.username}${username}`;
      const composeData = Object.assign({}, data, { username: u });
      await staffAdd(composeData);
    }

    emits("change");
  }
async function toGetWorkshopList() {
    const records = await workshopListAll();
    WorkshopList.value = records;
  }
  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style lang="less" scoped>
  :deep {
    .addon-before {
      .ant-input-group-addon {
        border-top-right-radius: 0px !important;
        border-bottom-right-radius: 0px !important;
      }
      .ant-input {
        border-top-left-radius: 0px !important;
        border-bottom-left-radius: 0px !important;
      }
    }
  }
</style>
