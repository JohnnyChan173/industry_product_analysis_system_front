<template>
  <Form autocomplete="off" :model="formData" :rules="formRules" ref="formRef" :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="{ style: { width: '130px' } }">
    <!-- 1.虚拟工位-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1.虚拟工位-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="stationId" label="关联物理工位">
        <Select allowClear placeholder="请选择" v-model:value="formData.stationId">
          <Select.Option v-for="{ id, stationName } in stationList" :key="id" :value="id">
            {{ stationName }}
            <span v-if="_isStationRela(id)" class="text-primary">[已关联]</span>
            <span v-if="_isStationOutput(id)" class="text-success">[产出结算]</span>
          </Select.Option>
        </Select>
      </Form.Item>

      <!-- <Form.Item name="staffId" label="工位员工">
        <Select allowClear placeholder="请选择" v-model:value="formData.staffId" @change="handleStaffChange">
          <Select.Option v-for="{ id, staffName } in leaderStaffList" :key="id" :value="id">
              {{ staffName }}
            </Select.Option>
        </Select>
      </Form.Item> -->

      <Form.Item name="craftProcedureIds" label="关联工序[可多选]">
        <InputSelectPanel multiple :raw-select-list="craftProcedureList" :labelFn="selectLabelFn"
          v-model:value="formData.craftProcedureIds" @change="handleCraftProcedureIdsChange"
          placeholder="请输入产品名称或编号过滤" />
      </Form.Item>

      <Form.Item name="virtualStationName" label="虚拟工位名称">
        <Input :maxlength="6" v-model:value="formData.virtualStationName" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="exceedAvgBeatMax" label="超平均值次数上限">
        <Input :maxlength="6" v-model:value="formData.exceedAvgBeatMax" placeholder="请输入" />
      </Form.Item>

    </div>

    <!-- 2.虚拟工位-更多信息 -->
    <SubTitle :size="AntUniversalSize.small" title="2.虚拟工位-更多信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="virtualStationProductWeight" label="工位产品重量">
        <InputNumber class="!w-90px" v-model:value="formData.virtualStationProductWeight" :min="0" placeholder="请输入"
          addon-after="克" />
        <p class="text-gray-400">- 运转到该工位的产品重量（加工前）；</p>
      </Form.Item>

      <!-- <Form.Item name="beatFormat" class="!mb-12px">
        <template #label>
          <Popover placement="top">
            <template #content>
              <p class="text-danger">- 会决定平台相关图表的呈现：</p>
              <p>- 若需要对工位的节拍数值进行处理，可输入表达式； </p>
              <p>- 表达式如 (x/4)+3，可以复杂化，校验通过即可。 </p>
            </template>
<p class="flex items-center">
  <QuestionCircleOutlined class="!text-secondary pr-2px" />
  <span>节拍数值处理</span>
</p>
</Popover>
</template>

<Input v-model:value="formData.beatFormat" placeholder="请输入表达式，如 x/4 " />
</Form.Item> -->

      <Form.Item label="启用功能" class="!my-0px">
        <Checkbox v-model:checked="needGeneralCheck" @change="handleGeneralCheckChange">
          {{ ModuleAbility.GENERAL }}
        </Checkbox>
        <Checkbox v-model:checked="needAddonCheck" @change="handleAddonCheckChange">
          {{ ModuleAbility.ADDON }}
        </Checkbox>
        <Checkbox v-model:checked="needWristbandCheck" @change="handleWristbandCheckChange">
          {{ ModuleAbility.WRISTBAND }}
        </Checkbox>
        <Checkbox v-model:checked="needGroundCheck" @change="handleGroundCheckChange">
          {{ ModuleAbility.GROUND }}
        </Checkbox>
        <Checkbox v-model:checked="needScaleCheck" @change="handleScaleCheckChange">
          {{ ModuleAbility.SCALE }}
        </Checkbox>
      </Form.Item>

      <Form.Item class="!mt-12px">
        <template #label><span class="text-success-d text-18px">产出工位</span></template>
        <div class="leading-38px">
          <Checkbox v-model:checked="outputStationCheck" @change="handleOutputCheckChange"> 是 </Checkbox>
        </div>
        <div class="text-warn">
          <p>- 产出工位理论存在1个，也允许多个</p>
          <p>- 产出工位每次信号量触发，即产出产品数量+1</p>
        </div>
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
import { QuestionCircleOutlined } from "@ant-design/icons-vue";
import { FormInstance, Button, Form, Input, Checkbox, Select, Popover, InputNumber } from "ant-design-vue";
import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits, watch, computed } from "vue";
import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
import { useFormUtils } from "/@/hooks/antd/form";
import SubTitle from "/@/components/Title/SubTitle.vue";
import { getFormRules } from "./useForm";
import { AntUniversalSize } from "/@/enums/antEnum";
import { setPropertyValue } from "/@/utils/typeTools";
import { CommonCheck, ModuleAbility, StaffType } from "/@/enums/model";
import { StationInfo } from "/@/api/model/station";
import { VirtualStationDetail, VirtualStationInfo } from "/@/api/model/virtualStation";
import InputSelectPanel from "/@/views/components/InputSelectPanel/index.vue";
import { CraftProcedureDetail } from "/@/api/model/craftProcedure";
import { randomId } from "/@/utils/util";
import { craftDetail } from "/@/api/craft";
import { productDetail } from "/@/api/product";
import { staffListAll } from "/@/api/staff";
import { StaffInfo } from "/@/api/model/staff";

const resetCSSPrefix = getResetCSSPrefix();

interface Props {
  virtualStationList: VirtualStationInfo[];
  stationList: StationInfo[];
  craftProcedureList: CraftProcedureDetail[];
  info?: VirtualStationInfo;
  productWeight: number;
}

const props = withDefaults(defineProps<Props>(), {
  stationList: () => [],
  craftProcedureList: () => [],
  info: undefined,
  productWeight: undefined,
});

const emits = defineEmits(["change:add", "change:edit"]);

const formRef = ref<FormInstance>();
const { validForm, resetForm } = useFormUtils(formRef);

const formData = reactive<Partial<VirtualStationDetail>>({
  id: undefined,
  virtualLineId: undefined,
  virtualStationName: "",
  virtualStationSort: 0,
  virtualStationUuid: randomId(),
  virtualStationProductWeight: undefined,
  beatFormat: "",
  needAddon: 0,
  needWristband: 0,
  needGround: 0,
  needGeneral: 0,
  needScale: 0,
  outputStation: 0,
  stationId: undefined,
  stationInfo: undefined,
  craftProcedureIds: [],
  craftProcedureList: [],
  exceedAvgBeatMax: undefined,
  staffId: undefined,
  staffNo: undefined,
  staffName: undefined,
});

const needAddonCheck = ref(false);
const needWristbandCheck = ref(false);
const needGroundCheck = ref(false);
const needGeneralCheck = ref(false);
const needScaleCheck = ref(false);
const outputStationCheck = ref(false);

const leaderStaffList = ref<StaffInfo[]>([]);

const formRules = getFormRules();

const isEditMode = !!props.info;
const modeText = isEditMode ? "编辑" : "创建";

const hasOutputStation = computed(() => props.virtualStationList.find((i) => i.outputStation));

// 安灯复选
watch(
  () => formData.needAddon,
  (v) => {
    needAddonCheck.value = v ? true : false;
  },
  { immediate: true }
);

// 佩戴静电手环复选
watch(
  () => formData.needWristband,
  (v) => {
    needWristbandCheck.value = v ? true : false;
  },
  { immediate: true }
);

// 接地复选
watch(
  () => formData.needGround,
  (v) => {
    needGroundCheck.value = v ? true : false;
  },
  { immediate: true }
);

// 通用输入复选
watch(
  () => formData.needGeneral,
  (v) => {
    needGeneralCheck.value = v ? true : false;
  },
  { immediate: true }
);

// 秤盘复选
watch(
  () => formData.needScale,
  (v) => {
    needScaleCheck.value = v ? true : false;
  },
  { immediate: true }
);

// 产出工位复选
watch(
  () => formData.outputStation,
  (v) => {
    outputStationCheck.value = v ? true : false;
  },
  { immediate: true }
);

onMounted(async () => {
  await toGetNeedInfo();

  const { info, productWeight } = props;

  if (isEditMode && info) {
    console.log(info);

    Object.keys(formData).forEach((key: keyof VirtualStationInfo) => {
      setPropertyValue(formData, key, info[key]);
    });
  }
  if (!isEditMode) {
    // 自动赋值物理工位
    toSyncCurrentStation();
  }

  // 2024-9-18 新增如果没有产品重量 就赋初值
  // 如果当前工位产品重量不存在，赋初值
  if (!formData.virtualStationProductWeight) {
    formData.virtualStationProductWeight = productWeight;
  }
});

/** 检测工位是否被关联 */
function _isStationRela(id: number) {
  const vl = props.virtualStationList;
  return vl.find((i) => i.stationId === id);
}

/** 检测工位是否为产出结算 */
function _isStationOutput(id: number) {
  // 反向找虚拟工位
  const vs = props.virtualStationList.find((i) => i.stationId === id);
  if (vs) {
    return vs.outputStation;
  }
}

/** 自动同步最新工位 */
function toSyncCurrentStation() {
  const { stationList, virtualStationList } = props;
  const lastStationId = virtualStationList[virtualStationList.length - 1]?.stationId;
  let index = stationList.findIndex((i) => i.id === lastStationId);
  index = Math.min(index + 1, stationList.length - 1);
  formData.stationId = stationList[index].id;
}

/** 变化-工序选择 */
function handleCraftProcedureIdsChange(ids: number[]) {
  injectProcedureList();

  // 取第一个工序名称 作为默认虚拟工位名称
  const { craftProcedureList } = props;
  const id = ids[0];
  if (id) {
    const procedureInfo = craftProcedureList.find((j) => j.id == id);
    formData.virtualStationName = procedureInfo?.procedureName;
  } else {
    formData.virtualStationName = "";
  }
}

/** 工序信息注入至列表 */
function injectProcedureList() {
  const { craftProcedureList } = props;
  const ids = formData.craftProcedureIds;

  const cpList = ids?.map((id) => craftProcedureList.find((j) => j.id == id));
  formData.craftProcedureList = cpList as any;
}

function selectLabelFn(item: CraftProcedureDetail) {
  return item.procedureName;
}

/** 获取必要信息 */
async function toGetNeedInfo() {
  injectProcedureList();
  await toGetLeaderListAll();
}

/** 变化-佩戴静电手环 */
async function handleAddonCheckChange() {
  formData.needAddon = needAddonCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
}

/** 变化-佩戴静电手环 */
async function handleWristbandCheckChange() {
  formData.needWristband = needWristbandCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
}

/** 变化-佩戴静电手环 */
async function handleGroundCheckChange() {
  formData.needGround = needGroundCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
}

/** 变化-佩戴静电手环 */
async function handleGeneralCheckChange() {
  formData.needGeneral = needGeneralCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
}

/** 变化-秤盘 */
async function handleScaleCheckChange() {
  formData.needScale = needScaleCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
}

/** 变化-产出工位 */
async function handleOutputCheckChange() {
  formData.outputStation = outputStationCheck.value ? CommonCheck.TRUE : CommonCheck.FALSE;
}
async function toGetLeaderListAll() {
  const leList = await staffListAll(StaffType.PUGONG);
  leaderStaffList.value = leList;
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
/** 变化-工位员工 */
function handleStaffChange(id: number) {
  formData.staffId = id;
  formData.staffNo = leaderStaffList.value.find((i) => i.id === id)?.staffNo;
  formData.staffName = leaderStaffList.value.find((i) => i.id === id)?.staffName;
}
</script>

<style></style>
