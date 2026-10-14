<template>
  <div v-loading:absolute="loading">
    <Form
      autocomplete="off"
      :model="formData"
      :rules="formRules"
      ref="formRef"
      :class="`${resetCSSPrefix}-form-normal`"
      :labelCol="formNormalParams.labelCol"
    >
      <SubTitle :size="AntUniversalSize.small" title="1、生产登记-基础信息" />

      <div :style="formNormalParams.divItemStyle">
        <Form.Item name="lineId" label="登记产线">
          <Select
            v-model:value="formData.lineId"
            show-search
            allow-clear
            :disabled="submitting"
            placeholder="请选择产线"
            :filter-option="filterOption"
            @change="handleLineChange"
          >
            <Select.Option v-for="item in lineList" :key="item.id" :value="item.id">
              {{ item.lineName || item.lineNo || item.id }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="taskId" label="关联任务单">
          <Select
            v-model:value="formData.taskId"
            show-search
            allow-clear
            :disabled="!formData.lineId || submitting"
            placeholder="请选择任务单（选填）"
            :filter-option="false"
            @search="handleProductTaskSearch"
            @change="handleTaskChange"
          >
            <Select.Option v-for="item in productTaskList" :key="item.id" :value="item.id">
              {{ item.taskNo || item.id }}
            </Select.Option>
          </Select>
        </Form.Item>

        <div v-if="selectedTaskInfo" class="task-summary">
          <div>生产产品：{{ selectedTaskInfo.productInfo?.productName || selectedTaskInfo.productName || "/" }}</div>
          <div>生产数量：{{ selectedTaskInfo.productNumber ?? "/" }}</div>
          <div>计划完成：{{ formatDateText(selectedTaskInfo.planCompleteDate) }}</div>
          <div>
            生产进度：{{ selectedTaskInfo.registrationActualProductNumber || 0 }} /
            {{ selectedTaskInfo.productNumber || 0 }}
          </div>
          <div>任务单备注：{{ selectedTaskInfo.memo || "/" }}</div>
        </div>

        <Form.Item name="virtualLineKey" label="产品&工艺">
          <Select
            v-model:value="formData.virtualLineKey"
            show-search
            :disabled="!formData.lineId || submitting"
            placeholder="请选择产品&工艺"
            :filter-option="filterOption"
            @change="handleVirtualLineChange"
          >
            <Select.Option v-for="item in virtualLineOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="计划生产">
          <div class="flex items-center">
            <InputNumber
              class="!w-180px"
              v-model:value="formData.planProductNumber"
              :min="0"
              :precision="0"
              :disabled="submitting"
              placeholder="请输入"
            />
            <span class="ml-8px text-gray-400">选填，0 即不限</span>
          </div>
        </Form.Item>

        <Form.Item label="拍照存证" v-if="copyFromId">
          <span class="text-gray-400">重新登记不会继承原登记照片，新登记的 filePathList 为空。</span>
        </Form.Item>

        <Form.Item label="备注">
          <Input.TextArea
            v-model:value="formData.memo"
            :disabled="submitting"
            :rows="3"
            placeholder="选填"
          />
        </Form.Item>
      </div>

      <SubTitle :size="AntUniversalSize.small" title="2、工位登记" />

      <div :style="formNormalParams.divItemStyle">
        <div class="mb-10px flex items-center justify-between">
          <span>
            已登记：<b :class="isAllStationSigned ? 'text-success' : 'text-warn'">
              {{ signedStationCount }} / {{ staffSignList.length }}
            </b>
          </span>
          <Button size="small" :disabled="!staffSignList.length || submitting" @click="handleOneTouchSign">
            一键考勤
          </Button>
        </div>

        <Table
          size="small"
          rowKey="virtualStationId"
          :dataSource="staffSignList"
          :columns="staffColumns"
          :pagination="false"
          :scroll="{ y: 300 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'order'">
              {{ index + 1 }}
            </template>

            <template v-else-if="column.dataIndex === 'staffId'">
              <Select
                class="!w-full"
                v-model:value="record.staffId"
                allow-clear
                show-search
                :disabled="submitting"
                placeholder="请选择员工"
                :filter-option="filterOption"
                @change="(value) => handleStaffChange(record, value)"
              >
                <Select.Option v-for="staff in getAvailableStaffList(record)" :key="staff.id" :value="staff.id">
                  {{ staff.staffName }}
                </Select.Option>
              </Select>
            </template>

            <template v-else-if="column.dataIndex === 'signStatus'">
              <Switch
                :checked="record.signStatus === StaffSignStatus.DOING"
                :disabled="submitting"
                checked-children="已登记"
                un-checked-children="未登记"
                @change="(checked) => handleSignStatusChange(record, checked)"
              />
            </template>
          </template>
        </Table>
      </div>

      <div :style="formNormalParams.divBtnStyle">
        <Form.Item>
          <Button
            class="mr-12px"
            type="primary"
            :style="normalBtnStyle"
            :loading="submitting"
            @click="handleClick"
          >
            {{ copyFromId ? "重新创建并开始生产" : "创建并开始生产" }}
          </Button>
          <Button :style="normalBtnStyle" :disabled="submitting" @click="handleResetClick">重置</Button>
        </Form.Item>
      </div>
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, InputNumber, Table, Switch, Modal, message } from "ant-design-vue";
  import { computed, onMounted, reactive, ref, withDefaults, defineProps, defineEmits } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { lineListAll } from "/@/api/line";
  import { productTaskList as getProductTaskList, productTaskDetail } from "/@/api/productTask";
  import { virtualLineListByLineId, virtualLineDetail } from "/@/api/virtualLine";
  import { staffListAll } from "/@/api/staff";
  import {
    registrationAdd,
    registrationDetail,
    registrationDetailGetByLatest,
    registrationStaffSign,
    registrationStart,
  } from "/@/api/registration";
  import { RegistrationStatus, StaffSignStatus, StaffType } from "/@/enums/model";
  import { formatDateByDayjs } from "/@/utils/util";

  interface Props {
    /** 保留 id，防止外部旧调用报错；本组件只负责创建生产登记，不会用 id 覆盖历史登记。 */
    id?: number;
    /** 历史生产登记 id：读取其配置并作为新登记模板。 */
    copyFromId?: number;
    /** 分页行原始数据：用于 Modal 打开瞬间先回填产线等基础字段，详情接口随后补全。 */
    copySource?: any;
  }

  interface StaffSignRow {
    staffName: string;
    virtualStationName: string;
    startDate: string;
    endDate: string;
    signStatus: number;
    absentMemo: string;
    productRegistrationId?: number;
    lineId?: number;
    virtualLineId?: number;
    stationId?: number;
    virtualStationId?: number;
    staffId?: number | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    copyFromId: undefined,
    copySource: undefined,
  });

  const emits = defineEmits<{
    (e: "change", id: number, data: any): void;
  }>();

  const copyFromId = computed(() => props.copyFromId);
  const resetCSSPrefix = getResetCSSPrefix();
  const formRef = ref<FormInstance>();
  const { validForm } = useFormUtils(formRef);

  const loading = ref(true);
  const submitting = ref(false);
  const lineList = ref<any[]>([]);
  const productTaskList = ref<any[]>([]);
  const virtualLineListData = ref<any[]>([]);
  const staffList = ref<any[]>([]);
  const staffSignList = ref<StaffSignRow[]>([]);
  const sourceRegistrationInfo = ref<any>();

  const formData = reactive<any>({
    lineId: undefined,
    taskId: undefined,
    virtualLineId: undefined,
    virtualLineKey: undefined,
    productId: undefined,
    productAttrValueIdsList: [],
    craftId: undefined,
    planProductNumber: 0,
    memo: "",
    filePathList: [],
  });

  function firstValue(...values: any[]) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
  }

  function firstNumber(...values: any[]) {
    const value = firstValue(...values);
    if (value === undefined) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  /**
   * 重新登记时，分页行已经包含 lineId / taskInfo / productId 等基础字段。
   * 先同步回填，确保 Modal 一打开就能看到原登记对应的产线，而不是等待详情接口后还是空表单。
   */
  function applyCopySourceBase(source: any = props.copySource) {
    if (!source) return;

    formData.lineId = firstNumber(source.lineId, source.lineInfo?.id, formData.lineId);
    formData.taskId = firstNumber(source.taskId, source.productTaskId, source.taskInfo?.id, formData.taskId);
    formData.virtualLineId = firstNumber(source.virtualLineId, source.virtualLineInfo?.id, formData.virtualLineId);
    formData.productId = firstNumber(source.productId, source.productInfo?.id, formData.productId);
    formData.craftId = firstNumber(source.craftId, source.craftInfo?.id, formData.craftId);
    formData.productAttrValueIdsList = [
      ...(source.productAttrValueIdsList || formData.productAttrValueIdsList || []),
    ];
    formData.planProductNumber = Number(
      firstValue(source.planProductNumber, source.productNumber, formData.planProductNumber, 0),
    );
    formData.memo = firstValue(source.memo, formData.memo, "") || "";
    formData.filePathList = [];
  }

  // copySource 是父列表点击“重新登记”时同步传入的，所以这里可以在首次渲染前直接带出原产线。
  applyCopySourceBase();

  const formRules = getFormRules();

  const staffColumns = [
    { title: "序号", key: "order", width: 60 },
    { title: "工位", dataIndex: "virtualStationName", width: 180 },
    { title: "员工", dataIndex: "staffId", width: 220 },
    { title: "登记状态", dataIndex: "signStatus", width: 130 },
  ];

  const selectedTaskInfo = computed(() => productTaskList.value.find((item) => item.id === formData.taskId));

  const virtualLineOptions = computed(() => {
    const options: any[] = [];

    virtualLineListData.value.forEach((virtualLineInfo) => {
      const craftInfo = virtualLineInfo.craftInfo || {};
      const productList = craftInfo.craftProductList || [];

      productList.forEach((productInfo: any) => {
        options.push({
          label: `${productInfo.productName || productInfo.productNo || productInfo.id}【${craftInfo.craftName || "未命名工艺"}】`,
          value: buildVirtualLineKey(virtualLineInfo.id, craftInfo.id, productInfo.id),
          virtualLineId: virtualLineInfo.id,
          craftId: craftInfo.id,
          productId: productInfo.id,
          virtualLineInfo,
        });
      });
    });

    return options;
  });

  const signedStationCount = computed(
    () => staffSignList.value.filter((item) => item.signStatus === StaffSignStatus.DOING).length,
  );

  const isAllStationSigned = computed(
    () => staffSignList.value.length > 0 && signedStationCount.value === staffSignList.value.length,
  );

  onMounted(async () => {
    loading.value = true;
    try {
      await Promise.all([toGetLineList(), toGetStaffList()]);

      if (copyFromId.value) {
        await initFromRegistration(copyFromId.value);
      }
    } finally {
      loading.value = false;
    }
  });

  function buildVirtualLineKey(virtualLineId?: number, craftId?: number, productId?: number) {
    return `${virtualLineId || ""}_${craftId || ""}_${productId || ""}`;
  }

  function filterOption(input: string, option: any) {
    const text = String(option?.children?.[0]?.children || option?.children || option?.label || "");
    return text.toLowerCase().includes(String(input || "").toLowerCase());
  }

  function formatDateText(value?: string) {
    if (!value) return "/";
    return String(value).split(" ")[0];
  }

  async function toGetLineList() {
    lineList.value = (await lineListAll()) || [];
  }

  async function toGetStaffList() {
    staffList.value = (await staffListAll(StaffType.PUGONG)) || [];
  }

  /**
   * 生产任务单列表：完全对齐小程序端请求参数。
   * 小程序使用 pageSize=10 + lineId + keyword，避免 PC 端放大 pageSize 后触发后端分页校验。
   */
  async function toGetProductTaskList(keyword?: string) {
    if (!formData.lineId) {
      productTaskList.value = [];
      return;
    }

    const res = await getProductTaskList({
      pageNum: 1,
      pageSize: 10,
      sort: "id desc",
      lineId: formData.lineId,
      keyword: keyword || undefined,
    } as any);

    productTaskList.value = Array.isArray(res?.records) ? res.records : [];
  }

  async function ensureSourceTaskInList(taskId?: number, fallbackTask?: any) {
    if (!taskId || productTaskList.value.some((item) => Number(item.id) === Number(taskId))) return;

    try {
      const taskInfo = await productTaskDetail(taskId);
      if (taskInfo) productTaskList.value.unshift(taskInfo);
    } catch (error) {
      // 历史任务单可能不在当前前 10 条里；详情失败时至少保留分页行中的 taskInfo 作为显示项。
      if (fallbackTask) {
        productTaskList.value.unshift({ ...fallbackTask, id: taskId });
      } else {
        console.warn("重新登记：原任务单详情加载失败", { taskId, error });
      }
    }
  }

  /**
   * 虚拟产线列表：对齐小程序端，直接调用 /virtualLine/listByLineId。
   * 不再使用 /virtualLine/list + pageSize=200，避免分页接口参数/返回结构差异。
   */
  async function toGetVirtualLineList(autoSelect = true) {
    if (!formData.lineId) {
      virtualLineListData.value = [];
      return;
    }

    const records = await virtualLineListByLineId(Number(formData.lineId));
    virtualLineListData.value = Array.isArray(records) ? records : [];

    // 与小程序保持一致：只有一个可选“产品&工艺”时自动选中。
    const options = virtualLineOptions.value;
    if (autoSelect && options.length === 1) {
      formData.virtualLineKey = options[0].value;
      await handleVirtualLineChange(options[0].value);
    }
  }

  let productTaskSearchTimer: ReturnType<typeof setTimeout> | undefined;
  function handleProductTaskSearch(keyword: string) {
    if (productTaskSearchTimer) clearTimeout(productTaskSearchTimer);
    productTaskSearchTimer = setTimeout(() => {
      toGetProductTaskList(keyword).catch((error) => {
        console.error("获取生产任务单失败", error);
      });
    }, 300);
  }

  async function ensureVirtualLineDetail(virtualLineId: number) {
    let info = virtualLineListData.value.find((item) => item.id === virtualLineId);
    const hasFullData = info?.craftInfo && Array.isArray(info?.virtualStationList);

    if (!hasFullData) {
      info = await virtualLineDetail(virtualLineId);
      const index = virtualLineListData.value.findIndex((item) => item.id === virtualLineId);
      if (index >= 0) virtualLineListData.value.splice(index, 1, info);
      else virtualLineListData.value.push(info);
    }

    return info;
  }

  async function handleLineChange() {
    formData.taskId = undefined;
    clearVirtualLineSelection();
    staffSignList.value = [];

    if (!formData.lineId) {
      productTaskList.value = [];
      virtualLineListData.value = [];
      return;
    }

    await Promise.all([toGetProductTaskList(), toGetVirtualLineList()]);
  }

  async function handleTaskChange(taskId?: number) {
    if (!taskId) return;

    const taskInfo = productTaskList.value.find((item) => item.id === taskId);
    if (!taskInfo) return;

    formData.productId = taskInfo.productId || taskInfo.productInfo?.id;
    formData.productAttrValueIdsList = [...(taskInfo.productAttrValueIdsList || [])];
    formData.planProductNumber = Number(taskInfo.productNumber || 0);

    await syncVirtualLineByProduct(formData.productId);
  }

  async function syncVirtualLineByProduct(productId?: number) {
    if (!productId) return;

    let option = virtualLineOptions.value.find((item) => item.productId === productId);

    // 分页列表如果没有带完整 craftProductList，则逐条补详情后再匹配产品。
    if (!option) {
      for (const item of [...virtualLineListData.value]) {
        await ensureVirtualLineDetail(item.id);
      }
      option = virtualLineOptions.value.find((item) => item.productId === productId);
    }

    if (option) {
      formData.virtualLineKey = option.value;
      await handleVirtualLineChange(option.value);
    }
  }

  async function handleVirtualLineChange(value?: string) {
    if (!value) {
      clearVirtualLineSelection();
      staffSignList.value = [];
      return;
    }

    let option = virtualLineOptions.value.find((item) => item.value === value);
    if (!option) return;

    const virtualLineInfo = await ensureVirtualLineDetail(option.virtualLineId);
    option = virtualLineOptions.value.find((item) => item.value === value) || option;

    formData.virtualLineId = option.virtualLineId;
    formData.craftId = option.craftId || virtualLineInfo?.craftInfo?.id;
    formData.productId = option.productId;

    generateStaffSignList(virtualLineInfo);
  }

  function clearVirtualLineSelection() {
    formData.virtualLineKey = undefined;
    formData.virtualLineId = undefined;
    formData.productId = undefined;
    formData.craftId = undefined;
    formData.productAttrValueIdsList = [];
  }

  function generateStaffSignList(virtualLineInfo: any) {
    const sourceSignMap = new Map<number, any>();
    (sourceRegistrationInfo.value?.staffSignList || []).forEach((item: any) => {
      const virtualStationId = item.virtualStationId ?? item.virtualStationInfo?.id;
      if (virtualStationId) sourceSignMap.set(virtualStationId, item);
    });

    staffSignList.value = (virtualLineInfo?.virtualStationList || []).map((virtualStationInfo: any) => {
      const stationInfo = virtualStationInfo.stationInfo || {};
      const sourceSign = sourceSignMap.get(virtualStationInfo.id);
      const sourceStaffId = sourceSign?.staffId ?? sourceSign?.staffInfo?.id;
      const defaultStaffId = sourceStaffId ?? stationInfo.staffId;
      const staffInfo = staffList.value.find((item) => item.id === defaultStaffId);

      return {
        staffName: sourceSign?.staffName || sourceSign?.staffInfo?.staffName || staffInfo?.staffName || "",
        virtualStationName: virtualStationInfo.virtualStationName || "",
        startDate: formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss"),
        endDate: "",
        signStatus: StaffSignStatus.DOING,
        absentMemo: "",
        productRegistrationId: undefined,
        lineId: formData.lineId,
        virtualLineId: formData.virtualLineId,
        stationId: virtualStationInfo.stationId ?? stationInfo.id,
        virtualStationId: virtualStationInfo.id,
        staffId: defaultStaffId || undefined,
      } as StaffSignRow;
    });
  }

  function handleOneTouchSign() {
    staffSignList.value.forEach((item) => {
      item.signStatus = StaffSignStatus.DOING;
    });
  }

  function handleSignStatusChange(record: StaffSignRow, checked: boolean) {
    record.signStatus = checked ? StaffSignStatus.DOING : StaffSignStatus.NOT_DO;
  }

  function getAvailableStaffList(current: StaffSignRow) {
    const usedStaffIds = new Set(
      staffSignList.value
        .filter((item) => item !== current && item.staffId)
        .map((item) => Number(item.staffId)),
    );
    return staffList.value.filter((item) => !usedStaffIds.has(Number(item.id)) || Number(item.id) === Number(current.staffId));
  }

  function handleStaffChange(record: StaffSignRow, staffId?: number) {
    const staff = staffList.value.find((item) => item.id === staffId);
    record.staffName = staff?.staffName || "";
    record.staffId = staffId;
  }

  async function initFromRegistration(id: number) {
    // 先再次应用分页行基础信息，保证即使详情请求较慢，原产线也已经在表单中。
    applyCopySourceBase();

    const info = await registrationDetail(id);
    if (!info) {
      message.error("原登记不存在，无法重新登记");
      return;
    }

    sourceRegistrationInfo.value = info;
    const source = props.copySource || {};

    const lineId = firstNumber(info.lineId, info.lineInfo?.id, source.lineId, source.lineInfo?.id);
    const taskId = firstNumber(
      info.taskId,
      info.productTaskId,
      info.taskInfo?.id,
      source.taskId,
      source.productTaskId,
      source.taskInfo?.id,
    );
    const virtualLineId = firstNumber(
      info.virtualLineId,
      info.virtualLineInfo?.id,
      source.virtualLineId,
      source.virtualLineInfo?.id,
    );
    const productId = firstNumber(info.productId, info.productInfo?.id, source.productId, source.productInfo?.id);
    const craftId = firstNumber(info.craftId, info.craftInfo?.id, source.craftId, source.craftInfo?.id);

    formData.lineId = lineId;
    formData.taskId = taskId;
    formData.virtualLineId = virtualLineId;
    formData.productId = productId;
    formData.craftId = craftId;
    formData.productAttrValueIdsList = [
      ...(info.productAttrValueIdsList || source.productAttrValueIdsList || []),
    ];
    formData.planProductNumber = Number(
      firstValue(info.planProductNumber, source.planProductNumber, info.productNumber, source.productNumber, 0),
    );
    formData.memo = firstValue(info.memo, source.memo, "") || "";
    formData.filePathList = [];

    if (!formData.lineId) {
      message.error("原登记没有产线信息，无法重新登记");
      return;
    }

    // 复制初始化时禁止“只有一条虚拟产线就自动覆盖选择”，必须优先恢复原登记自己的产品/工艺。
    await Promise.all([toGetProductTaskList(), toGetVirtualLineList(false)]);
    await ensureSourceTaskInList(taskId, info.taskInfo || source.taskInfo);

    let virtualLineInfo: any;
    if (virtualLineId) {
      virtualLineInfo = await ensureVirtualLineDetail(virtualLineId);
    }

    // 某些历史登记详情字段不全时，根据原产品从当前产线的虚拟产线配置中重新定位。
    if (!virtualLineInfo && productId) {
      await syncVirtualLineByProduct(productId);
      virtualLineInfo = formData.virtualLineId
        ? await ensureVirtualLineDetail(Number(formData.virtualLineId))
        : undefined;
    }

    if (!virtualLineInfo) {
      message.warning("已带出原登记产线，但未找到原产品对应的虚拟产线，请手动选择产品&工艺");
      return;
    }

    const finalProductId = firstNumber(productId, formData.productId);
    const finalCraftId = firstNumber(craftId, virtualLineInfo?.craftInfo?.id, formData.craftId);
    const finalVirtualLineId = firstNumber(virtualLineId, virtualLineInfo?.id, formData.virtualLineId);

    formData.virtualLineId = finalVirtualLineId;
    formData.productId = finalProductId;
    formData.craftId = finalCraftId;

    // 确保原登记的产品在选项中，即便 listByLineId 返回的数据未完整带 craftProductList。
    const craftInfo = virtualLineInfo?.craftInfo || {};
    if (!Array.isArray(craftInfo.craftProductList)) craftInfo.craftProductList = [];
    if (finalProductId && !craftInfo.craftProductList.some((item: any) => Number(item.id) === Number(finalProductId))) {
      craftInfo.craftProductList.push(
        info.productInfo ||
          source.productInfo || {
            id: finalProductId,
            productName: `产品#${finalProductId}`,
          },
      );
    }
    virtualLineInfo.craftInfo = craftInfo;

    formData.virtualLineKey = buildVirtualLineKey(finalVirtualLineId, finalCraftId, finalProductId);
    generateStaffSignList(virtualLineInfo);
  }

  function buildRegistrationPayload() {
    return {
      lineId: formData.lineId,
      taskId: formData.taskId || undefined,
      virtualLineId: formData.virtualLineId,
      productId: formData.productId,
      productAttrValueIdsList: [...(formData.productAttrValueIdsList || [])],
      craftId: formData.craftId,
      planProductNumber: Number(formData.planProductNumber || 0),
      memo: formData.memo || "",
      // 每一次登记的存证独立，复制创建不继承历史照片。
      filePathList: [],
    };
  }

  async function validateBeforeSubmit() {
    await validForm();

    if (!formData.lineId || !formData.productId || !formData.virtualLineId) {
      message.error("请完整选择登记产线及产品&工艺");
      return false;
    }

    if (!staffSignList.value.length) {
      message.error("当前产品&工艺没有可登记工位");
      return false;
    }

    const latest = await registrationDetailGetByLatest(formData.lineId);
    if (latest?.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
      message.warning(`当前产线已有进行中的登记：${latest.registrationNo}`);
      return false;
    }

    if (!isAllStationSigned.value) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: "存在未登记工位",
          content: "未登记工位的信号可能无法正常归属，仍然开始生产吗？",
          okText: "继续创建",
          cancelText: "返回修改",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!confirmed) return false;
    }

    return true;
  }

  /** 创建生产登记 -> 工位登记 -> 开始生产 */
  async function handleClick() {
    if (submitting.value) return;
    const valid = await validateBeforeSubmit();
    if (!valid) return;

    submitting.value = true;
    const registrationData = buildRegistrationPayload();
    let registrationId: number | undefined;

    try {
      // 1. 创建生产登记：字段与小程序 formData 保持一致。
      registrationId = await registrationAdd(registrationData as any);
    } catch (error) {
      console.error("[生产登记] registrationAdd 失败", { registrationData, error });
      message.error("创建生产登记失败");
      submitting.value = false;
      return;
    }

    try {
      // 2. 工位员工登记：沿用小程序的数据结构，只重新注入新 registrationId。
      const now = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
      const staffData = staffSignList.value.map((item) => ({
        ...item,
        startDate: now,
        endDate: "",
        productRegistrationId: registrationId,
        lineId: registrationData.lineId,
        virtualLineId: registrationData.virtualLineId,
      }));

      await registrationStaffSign(staffData as any);
    } catch (error) {
      console.error("[生产登记] registrationStaffSign 失败", { registrationId, error });
      message.error("生产登记已创建，但工位登记失败");
      submitting.value = false;
      return;
    }

    try {
      // 3. 开始生产。
      const newRegistrationId = (await registrationStart(registrationId)) || registrationId;
      emits("change", newRegistrationId, registrationData);
    } catch (error) {
      console.error("[生产登记] registrationStart 失败", { registrationId, error });
      message.error("生产登记已创建，但开始生产失败");
    } finally {
      submitting.value = false;
    }
  }

  async function handleResetClick() {
    formRef.value?.clearValidate?.();
    sourceRegistrationInfo.value = undefined;
    staffSignList.value = [];

    formData.lineId = undefined;
    formData.taskId = undefined;
    clearVirtualLineSelection();
    formData.planProductNumber = 0;
    formData.memo = "";
    formData.filePathList = [];
    productTaskList.value = [];
    virtualLineListData.value = [];

    if (copyFromId.value) {
      loading.value = true;
      try {
        await initFromRegistration(copyFromId.value);
      } finally {
        loading.value = false;
      }
    }
  }
</script>

<style lang="less" scoped>
  .task-summary {
    margin: -4px 0 18px 120px;
    padding: 10px 12px;
    line-height: 1.8;
    color: #8c8c8c;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
  }
</style>
