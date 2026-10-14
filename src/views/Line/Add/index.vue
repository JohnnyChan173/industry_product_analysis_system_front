<template>
  <Form
    v-loading:absolute="loading"
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    class="!-mt-20px"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、产线-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、产线-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <!-- <Form.Item name="lineType" label="产线类型">
        <Radio.Group v-model:value="formData.lineType" button-style="solid">
          <Radio.Button v-for="{ label, value } in LineTypeList" :value="value" :key="value">
            {{ label }}
          </Radio.Button>
        </Radio.Group>
      </Form.Item> -->

      <Form.Item name="lineNo" label="产线编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.lineNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item name="lineName" label="产线名称">
        <Input v-model:value="formData.lineName" placeholder="请输入" />
      </Form.Item>
      <Form.Item name="lineType" label="产线类型">
        <a-radio-group v-model:value="formData.lineType">
          <a-radio :value="1">工装板线</a-radio>
          <a-radio :value="2">皮带线</a-radio>
        </a-radio-group>
      </Form.Item>

      <Form.Item name="workshopId" label="所属车间">
        <div class="flex items-center">
          <Select allowClear placeholder="请选择" v-model:value="formData.workshopId">
            <Select.Option v-for="{ id, workshopName } in workshopSelectList" :key="id" :value="id">
              {{ workshopName }}
            </Select.Option>
          </Select>
          <span
            class="text-primary text-underline hover-opacity whitespace-nowrap pl-6px"
            @click="handleWorkshopManage"
          >
            管理车间
          </span>
        </div>
      </Form.Item>

      <Form.Item name="lineLeaderStaffId" label="线长">
        <div class="flex items-center">
          <Select allowClear placeholder="请选择" v-model:value="formData.lineLeaderStaffId">
            <Select.Option v-for="{ id, staffName } in leaderStaffList" :key="id" :value="id">
              {{ staffName }}
            </Select.Option>
          </Select>
          <span class="text-primary text-underline hover-opacity whitespace-nowrap pl-6px" @click="handleStaffAddClick">
            创建线长
          </span>
        </div>
      </Form.Item>

      <Form.Item name="imagePaths" label="线体展示图片">
        <div class="!w-680px">
          <Upload v-model:value="formData.imagePaths" list-type="picture-card" />
        </div>
      </Form.Item>
    </div>

    <!-- 2、产线-事件管理员设置 -->
    <!-- <SubTitle :size="AntUniversalSize.small" title="2、产线-事件管理员（产线具备安灯模块才有效）" />
    <div class="ml-24px">
      <EventStaffTable
        v-model:materialEventStaffId="formData.materialEventStaffId"
        v-model:deviceEventStaffId="formData.deviceEventStaffId"
        v-model:qualityEventStaffId="formData.qualityEventStaffId"
        v-model:otherEventStaffId="formData.otherEventStaffId"
         v-model:multipleEventStaffId="formData.multipleEventStaffId"
      />
    </div> -->

    <!-- 3、产线-其他设置 -->
    <SubTitle :size="AntUniversalSize.small">
      <span>2、产线-其他设置</span>
      <Popover placement="top">
        <template #content>
          <p class="">- <span class="text-primary">节拍中心限</span>：产线生产产品平均耗时[秒]</p>
          <p class="text-warn font-bold">- 处于上下限内的节拍，才会被后台记录。</p>
          <p class="">- 会决定平台相关图表的呈现：</p>
        </template>
        <QuestionCircleOutlined class="!text-secondary pl-4px" />
      </Popover>
    </SubTitle>
    <div :style="formNormalParams.divItemStyle">
      <Form.Item class="!mb-12px" name="beatMax" label="节拍上限">
        <InputNumber class="!w-150px" v-model:value="formData.beatMax" :min="0" placeholder="请输入" />
      </Form.Item>

      <!-- <Form.Item class="!mb-12px" name="beatBase" label="节拍中心限">
        <InputNumber class="!w-150px" v-model:value="formData.beatBase" :min="0" placeholder="请输入" />
        <span class="text-gray-400 ml-6px">(产线生产产品平均耗时[秒])</span>
      </Form.Item> -->

      <Form.Item label="节拍下限" name="beatMin">
        <InputNumber class="!w-150px" v-model:value="formData.beatMin" :min="0" placeholder="请输入" />
      </Form.Item>
    </div>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>

  <!-- 弹窗 - 车间列表 -->
  <Modal
    :style="{ width: AntModalWidth.md }"
    v-model:visible="modalWorkshopListState.visible"
    title="车间管理"
    :footer="null"
    destroyOnClose
    @cancel="handleWorkshopListChange"
  >
    <WorkshopList />
  </Modal>

  <!-- 弹窗 - 创建员工 -->
  <Modal v-model:visible="modalStaffAddState.visible" :title="modalStaffAddState.title" :footer="null" destroyOnClose>
    <StaffAdd :id="modalStaffAddState.id" :staffType="modalStaffAddState.staffType" @change="handleStaffAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import {
    FormInstance,
    Button,
    Form,
    Select,
    Input,
    DatePicker,
    InputNumber,
    Modal,
    Popover,
    message,
    Radio,
  } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import EventStaffTable from "/@/views/components/EventStaffTable/index.vue";
  import { getFormRules } from "./useForm";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import { lineDetail, lineEdit, lineAdd } from "/@/api/line";
  import { LineDetail, LineInfo } from "/@/api/model/line";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { workshopListAll } from "/@/api/workshop";
  import { WorkshopInfo } from "/@/api/model/workshop";
  import Upload from "/@/components/Upload/index.vue";
  import { StaffInfo } from "/@/api/model/staff";
  import { LineType, StaffType } from "/@/enums/model";
  import { staffListAll } from "/@/api/staff";
  import { LinkOutlined, QuestionCircleOutlined } from "@ant-design/icons-vue";
  import { delay } from "/@/utils/util";
  import WorkshopList from "/@/views/Workshop/List/index.vue";
  import StaffAdd from "/@/views/Staff/Add/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { DEFAULT_BEAT_BASE } from "/@/config";
  import { randomLineNo } from "/@/config/parse/number";
  import { LineTypeList } from "/@/config/data";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });

  const emits = defineEmits(["change", "change:add", "change:edit"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const loading = ref(false);

  const formData = reactive<Partial<LineInfo>>({
    id: undefined,
    lineType: LineType.GZB,
    lineNo: undefined,
    lineName: undefined,
    workshopId: undefined,
    imagePaths: [],
    lineLeaderStaffId: undefined,
    materialEventStaffId: undefined,
    deviceEventStaffId: undefined,
    qualityEventStaffId: undefined,
    otherEventStaffId: undefined,
    multipleEventStaffId: undefined,
    beatMax: 9999,
    beatBase: DEFAULT_BEAT_BASE,
    beatMin: 0,
  });

  /** 弹窗 - 创建员工 */
  const modalStaffAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
    staffType?: StaffType;
  }>({
    id: undefined,
    visible: false,
    title: "创建员工",
  });

  const workshopSelectList = ref<WorkshopInfo[]>([]);

  const leaderStaffList = ref<StaffInfo[]>([]);

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  /** 弹窗 - 车间列表 管理 */
  const modalWorkshopListState = reactive<{
    visible: boolean;
  }>({
    visible: false,
  });

  onMounted(async () => {
    await toGetNeedInfo();

    if (isEditMode) {
      loading.value = true;

      const { id } = props;
      const info = await lineDetail(id!!);

      formData.id = id;
      Object.keys(formData).forEach((key: keyof LineInfo) => {
        console.log(key, info[key]);
        setPropertyValue(formData, key, info[key]);
      });

      loading.value = false;
    } else {
      // 赋值随机编号
      handleRandomNo();
    }
  });

  /** 随机生成编号 */
  async function handleRandomNo() {
    const no = randomLineNo();
    formData.lineNo = no;
  }

  /** 点击 - 创建员工 */
  function handleStaffAddClick() {
    modalStaffAddState.id = undefined;
    modalStaffAddState.visible = true;
    modalStaffAddState.title = "创建员工";
    modalStaffAddState.staffType = StaffType.XIANZHANG;
  }

  /** StaffAdd 组件变化 */
  async function handleStaffAddChange() {
    await toGetLeaderListAll();
    modalStaffAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** Workshop 组件变化 */
  async function handleWorkshopListChange() {
    await toGetWorkshopListAll();
  }

  /** 点击 - 车间管理 */
  function handleWorkshopManage() {
    modalWorkshopListState.visible = true;
  }

  /** 获取全部车间列表 */
  async function toGetWorkshopListAll() {
    const wsList = await workshopListAll();
    workshopSelectList.value = wsList;
  }

  /** 获取全部线长列表 */
  async function toGetLeaderListAll() {
    const leList = await staffListAll(StaffType.XIANZHANG);
    leaderStaffList.value = leList;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    // 获取车间列表
    await toGetWorkshopListAll();

    // 获取线长列表
    await toGetLeaderListAll();
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 校验事件管理员是否存在
    // if (
    //   !formData.deviceEventStaffId ||
    //   !formData.materialEventStaffId ||
    //   !formData.qualityEventStaffId ||
    //   !formData.otherEventStaffId
    // ) {
    //   message.warn("请选择事件管理员");
    //   return;
    // }

    // 编辑模式
    if (isEditMode) {
      const lid = await lineEdit(formData);
      emits("change:edit", lid);
    } else {
      const lid = await lineAdd(formData);

      emits("change:add", lid);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
