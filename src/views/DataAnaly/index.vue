<template>
  <div class="dpanel-box" :style="{ width: panelWholeWidth + 'px' }">
    <!-- 顶部选项栏 -->
    <!-- 1. 查询条件：先选车间，再选产线 -->

    <div class="dpanel-toolbar">
      <!-- 1. 选择器区域 -->
      <div class="toolbar-selectors">
        <Select v-model:value="workshopId" class="dpanel-workshop-select" size="middle" placeholder="选择车间"
          :disabled="isXz" @change="handleWorkshopIdChange">
          <Select.Option v-for="item in workshopSelectList" :key="item.id" :value="item.id">
            {{ item.workshopName }}
          </Select.Option>
        </Select>

        <Select v-model:value="lineId" class="dpanel-line-select" size="middle" placeholder="选择产线"
          :disabled="isXz || !workshopId" @change="handleLineIdChange">
          <Select.Option v-for="item in filteredLineList" :key="item.id" :value="item.id">
            {{ item.lineName }}
          </Select.Option>
        </Select>
      </div>

      <!-- 2. 生产信息区域 -->
      <div class="toolbar-info">
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">生产产品</span>
            <Tag v-if="registrationInfo" color="blue" size="small">
              <ProductRelate class="text-primary" :mode="CommonComponentMode.DETAIL"
                :productId="registrationInfo.productId"
                :productAttrValueIdsList="registrationInfo.productAttrValueIdsList" />
            </Tag>
            <span v-else class="dpanel-sec-empty">/</span>
          </div>
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">生产状态</span>
            <span v-if="registrationInfo" class="dpanel-sec-value">
              <TagRegistrationStatus v-if="registrationInfo" :value="registrationInfo.registrationStatus"
                size="small" />

              <!-- {{ getListItemLabel(RegistrationStatusList, registrationInfo?.registrationStatus || 0) || "/" }} -->
            </span>
            <span v-else class="dpanel-sec-empty">/</span>
          </div>
        </section>

        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">开始时间</span>
            <span class="dpanel-sec-value text-gray-400">
              {{ registrationInfo?.startDate?.slice(0, -3) || "/" }}
            </span>
          </div>
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">结束时间</span>
            <span class="dpanel-sec-value text-gray-400">
              {{ registrationInfo?.endDate?.slice(0, -3) || "/" }}
            </span>
          </div>
        </section>

        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">计划数量</span>
            <span class="dpanel-sec-value" v-if="registrationInfo">
              {{ registrationInfo.planProductNumber }}
            </span>
            <span v-else class="dpanel-sec-empty">/</span>
          </div>
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">生产进度</span>
            <span class="dpanel-sec-value" v-if="registrationInfo">
              {{ latestProductData.beatProductNumber || registrationInfo.beatProductNumber || 0 }}
            </span>
            <span v-else class="dpanel-sec-empty">/</span>
          </div>
        </section>

        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">员工人数</span>
            <span class="dpanel-sec-value text-gray-400">{{ registrationInfo?.staffSignTotal || "/" }}</span>
          </div>
          <div class="dpanel-sec-item">
            <span class="dpanel-sec-label">工序数量</span>
            <span class="dpanel-sec-value text-gray-400">{{ virtualLineInfo?.virtualStationTotal || "/" }}</span>
          </div>
        </section>
      </div>

      <!-- 3. 工具栏 -->
      <div class="toolbar-tools">
        <!-- 生产登记 -->
        <Select v-model:value="registrationSelectValue" class="registration-select" placeholder="选择生产登记"
          :disabled="!lineId || historyRegistrationSelectList.length === 0" @change="handleRegistrationIdChange"
          size="middle" allowClear>
          <Select.Option v-for="{ id, startDate, productInfo } in historyRegistrationSelectList" :key="id" :value="id">
            <div class="registration-option">
              <div>{{ productInfo.productName }}</div>
              <div class="registration-option-date">
                {{ dayjs(startDate).format("YYYY-MM-DD") }}
              </div>
            </div>
          </Select.Option>
        </Select>

        <div v-if="!isHistoryRegistration" class="toolbar-btn">
          <el-button v-if="dataPolling" type="warning" size="small" @click="closePolling" plain>暂停</el-button>
          <el-button v-else type="primary" size="small" @click="openPolling" plain>恢复</el-button>
        </div>
        <Tag v-else color="orange" class="toolbar-tag">历史登记</Tag>

        <div class="toolbar-icon" @click="toggleFullscreen">
          <FullscreenOutlined v-if="!appStore.fullscreen" />
          <FullscreenExitOutlined v-else />
        </div>

        <Popover placement="bottom" trigger="click">
          <template #content>
            <Form class="detail w-320px" :labelCol="{ style: { width: '70px' } }">
              <Form.Item label="标准节拍" v-if="virtualLineInfo">
                <InputNumber v-model:value="virtualLineInfo.standardBeat" :min="10" placeholder="虚拟产线标准节拍"
                  @change="debounceToStandardBeatChange" />
              </Form.Item>
              <Form.Item v-if="lineId && registrationId">
                <Button type="primary" class="warn" @click="handleResetRegistration">重置登记</Button>
              </Form.Item>
            </Form>
          </template>
          <div class="toolbar-icon">
            <SettingOutlined />
          </div>
        </Popover>

        <div class="toolbar-icon" @click="reloadAnaly">
          <ReloadOutlined />
        </div>

        <div v-if="!isHistoryRegistration" class="mode-switch" :class="getModeTextClass" @click="handleModeChange">
          {{ modeText }}
        </div>
      </div>
    </div>

    <!-- <TestDebugger /> -->
    <!--
      当前登记：优先展示进行中登记的实时分析面板。
      历史登记：切换为生产登记详情同款面板
      （岗位登记总产能 + 岗位标准标准小时产能 + 当日线平衡）。
    -->
    <SignalAnaly v-if="isSignalMode || isHistoryRegistration" ref="signalAnalyRef" :detailView="isHistoryRegistration"
      :info="isHistoryRegistration ? registrationInfo : undefined" />

    <!-- 历史登记不显示状态分析，只显示登记详情分析面板 -->
    <StatusAnaly v-if="isStatusMode && !isHistoryRegistration" ref="statusAnalyRef"></StatusAnaly>

    <Modal v-model:visible="isFiltration" title="过滤设置" width="640px" @ok="handleOk">
      <div class="flex items-center justify-center">
        <h3 class="text-18px font-bold text-primary w-106px"> 过滤工位: </h3>
        <a-select v-model:value="FiltrationValue" mode="multiple" style="width: 100%" placeholder="请选择过滤工位" :options="virtualLineInfo!!.virtualStationList.map((i) => ({
          value: i.id,
          label: i.stationInfo.stationNo + '-' + i.virtualStationName,
        }))
          " :allowClear="true" />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { Button, Form, InputNumber, message, Modal, Popover, Select, Tag } from "ant-design-vue";
import { FullscreenExitOutlined, FullscreenOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons-vue";
import SignalAnaly from "./SignalAnaly/index.vue";
import StatusAnaly from "./StatusAnaly/index.vue";
import TestDebugger from "./TestDebugger.vue";

import { withDefaults, defineProps, computed, onMounted, ref, watch, nextTick, onUnmounted, reactive } from "vue";
import { lineListAll } from "/@/api/line";
import { workshopListAll } from "/@/api/workshop";
import { replaceUrlQuery } from "/@/utils/router";
import { debounce, formatDateByDayjs, parseSearch } from "/@/utils/util";
import { staffListAll } from "/@/api/staff";
import { RegistrationStatus, StaffType } from "/@/enums/model";
import { AnalyMode, panelWholeWidth, useData } from "./useData";
import {
  registrationAdd,
  registrationDel,
  registrationDetail,
  registrationDetailGetByLatest,
  registrationEdit,
  registrationLatestBeatProductNumber,
  registrationList,
  registrationListAll,
  registrationStaffSign,
  registrationStart,
} from "/@/api/registration";
import TagRegistrationStatus from "/@/views/baseComponents/TagRegistrationStatus.vue";
import TagProduct from "/@/views/baseComponents/TagProduct.vue";
import { virtualLineDetail, virtualLineEdit } from "/@/api/virtualLine";
import { useAppStore, useUserInfoStore } from "/@/store";
import { RegistrationDetail } from "/@/api/model/registration";
import { createLoading } from "/@/components/Loading/createLoading";
import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
import ProductRelate from "/@/views/components/ProductRelate/index.vue";
import { defaultPageSize } from "/@/config";
import AddonBoard from "/@/views/AddonBoard/index.vue";
import { useStationStore } from "/@/store";
import { updateIsFilter } from "/@/api/virtualStation.js";
import dayjs from "dayjs";
import { getListItemLabel, RegistrationStatusList } from "/@/config/data.js";

const stationStore = useStationStore();

interface Props {
  mode: AnalyMode;
}

const props = withDefaults(defineProps<Props>(), {
  mode: AnalyMode.Status,
});

const {
  lineList,
  staffList,
  lineId,
  registrationId,
  registrationInfo,
  registrationSelectList,
  virtualLineInfo,
  virtualStationList,
  selectVirtualStationId,
  dataPolling,
  clearData,
} = useData();

const appStore = useAppStore();
const { isXz, manageLineId, isCjzr, staffInfo } = useUserInfoStore();


/** 顶部选择：车间 -> 产线 -> 生产登记 */
const workshopId = ref<number | undefined>();
const workshopSelectList = ref<any[]>([]);

/**
 * 仅用于“生产登记”下拉框的显示值。
 * 默认实时展示当前登记时保持为空；只有用户手动选择登记后才显示选中值。
 */
const registrationSelectValue = ref<number | undefined>();

function getLineWorkshopId(item: any) {
  return item?.workshopId ?? item?.workshopInfo?.id;
}

const filteredLineList = computed(() => {
  const wid = workshopId.value;
  if (!wid) return [];

  return lineList.value.filter((item: any) => String(getLineWorkshopId(item)) === String(wid));
});

/**
 * 当前登记优先取“登记中”的记录，不以列表第一条或最大 ID 判断。
 * 没有进行中登记时，保留原来的最新登记展示方式。
 */
const currentRegistrationId = computed(() => {
  const records = registrationSelectList.value || [];
  const activeRegistration = records.find(
    (item: any) => String(item.registrationStatus) === String(RegistrationStatus.IN_REGISTRATION)
  );
  return (activeRegistration || records[0])?.id;
});

/** 登记下拉框只展示历史登记，不显示当前登记 */
const historyRegistrationSelectList = computed(() => {
  const currentId = currentRegistrationId.value;
  if (!currentId) return registrationSelectList.value;

  return registrationSelectList.value.filter(
    (item: any) => String(item.id) !== String(currentId)
  );
});

/** 当前是否正在查看历史登记 */
const isHistoryRegistration = computed(() => {
  const currentId = registrationId.value;
  const defaultId = currentRegistrationId.value;
  const selectedRegistration = registrationSelectList.value.find(
    (item: any) => String(item.id) === String(currentId)
  );
  const currentInfo = String(registrationInfo.value?.id) === String(currentId)
    ? registrationInfo.value
    : selectedRegistration;

  // 即使进行中登记排在后面，也必须使用实时界面。
  if (String(currentInfo?.registrationStatus) === String(RegistrationStatus.IN_REGISTRATION)) {
    return false;
  }
  if (!currentId || !defaultId) return false;
  return String(currentId) !== String(defaultId);
});

const searchMode = Number(parseSearch().mode) || props.mode;
const searchLineId = isXz ? manageLineId : Number(parseSearch().lineId) || "";

const mode = ref(searchMode);
const isSignalMode = computed(() => mode.value === AnalyMode.Signal);
const isStatusMode = computed(() => mode.value === AnalyMode.Status);
const modeText = computed(() => (isSignalMode.value ? "节拍分析" : "状态分析"));
const getModeTextClass = computed(() => (isSignalMode.value ? "signal" : "status"));

const signalAnalyRef = ref();
const statusAnalyRef = ref();
const latestProductData = reactive({
  timer: null as any,
  delay: 5000,
  beatProductNumber: 0,
});

const debounceToStandardBeatChange = debounce(onStandardBeatChange, 500);

onMounted(async () => {
  const { close } = createLoading();
  resizeAllChart();
  await toGetNeedInfo();
  close();
});

onUnmounted(() => {
  clearData();
  clearLatestProductDataInterval();
});

/** 重置登记 */
async function handleResetRegistration() {
  const lid = lineId.value!!;
  const rid = registrationId.value!!;
  // 必须是当前产线 最新的登记 且为进行中 才可以重置
  const checkRInfo = await registrationDetailGetByLatest(lid);
  if (checkRInfo.id !== rid) {
    message.warn("当前登记非产线最新登记，无法重置");
    return;
  }

  if (checkRInfo.registrationStatus === RegistrationStatus.END_REGISTRATION) {
    message.warn("当前登记已结束，无法重置");
    return;
  }

  Modal.confirm({
    title: `确认重置当前生产登记: ${checkRInfo.registrationNo}`,
    content: "目前仅会重置“开始时间”，主要用于皮带线调试",
    okText: "重置开始时间",
    cancelText: "取消",
    async onOk() {
      const { id, lineId, productId, productAttrValueIdsList } = checkRInfo;

      await registrationEdit({
        id,
        startDate: formatDateByDayjs(Date.now() - 1000, "YYYY-MM-DD HH:mm:ss"),
        lineId,
        productId,
        productAttrValueIdsList,
      });

      await reloadAnaly();
    },
    onCancel() { },
  });
}

/** 关闭轮询 */
function closePolling() {
  dataPolling.value = false;
  pauseAnaly();
}

/** 开启轮询 */
function openPolling() {
  dataPolling.value = true;
  reloadAnaly();
}

/** 变化-车间：产线自动切换到该车间第一条，随后加载该产线当前登记 */
async function handleWorkshopIdChange() {
  const firstLine = filteredLineList.value[0];
  lineId.value = firstLine?.id;

  if (!lineId.value) {
    registrationSelectValue.value = undefined;
    registrationId.value = undefined;
    registrationInfo.value = undefined;
    registrationSelectList.value = [];
    virtualLineInfo.value = undefined;
    virtualStationList.value = [];
    selectVirtualStationId.value = undefined;
    clearLatestProductDataInterval();
    await reRenderPanel();
    return;
  }

  await handleLineIdChange();
}

/** 变化-线体id：默认优先加载该产线进行中的登记 */
async function handleLineIdChange() {
  replaceUrlQuery(
    {
      lineId: lineId.value,
    },
    false
  );

  await reloadAnaly();
  signalAnalyRef.value?.setIsFirst?.(true);
}

/**
 * 变化-登记信息
 * 当前登记：保持原来的分析方式；
 * 历史登记：下面切换为生产登记详情分析面板，并关闭实时轮询。
 */
async function handleRegistrationIdChange() {
  clearLatestProductDataInterval();

  // 下拉框只是用户手动选择历史登记的入口；
  // 真正用于加载看板数据的仍然是 registrationId。
  registrationId.value = registrationSelectValue.value;

  if (isHistoryRegistration.value) {
    dataPolling.value = false;
    await pausePanel();
  } else {
    // 回到当前登记时恢复页面原来的默认实时行为。
    dataPolling.value = true;
  }

  // 等 detailView 模板分支完成切换后再重新渲染 ECharts。
  await nextTick();
  await reRenderAllData();
}

/** 过滤 */
const isFiltration = ref(false);
/** 设置过滤 */
function setFiltration(val: boolean) {
  if (val) {
    FiltrationValue.value = virtualStationList.value.filter((i) => i.isFilter).map((i) => i.id);
    // stationStore.setStationList(FiltrationValue.value);
  }
  // 过滤
  isFiltration.value = val;
}
const FiltrationValue = ref<number[]>([]);
async function onStandardBeatChange() {
  const vi = virtualLineInfo.value!!;
  const newBeat = vi.standardBeat;
  // 修改虚拟产线
  await virtualLineEdit({
    id: vi.id,
    standardBeat: newBeat,
  });

  // 重置图表
  await reloadAnaly();
  message.success("标准节拍已更新");
}

/** 切换全屏 */
function toggleFullscreen() {
  appStore.setFullscreen(!appStore.fullscreen);

  nextTick(() => {
    resizeAllChart();
  });
}
async function toGetWorkshopList() {
  const records = await workshopListAll();
  console.log("recordsrecords", records, staffInfo?.id);
  workshopSelectList.value = isCjzr ? records.filter((item) => item.staffId === staffInfo?.id) : records;
}

/** 获取所选登记；未手动选择时优先加载当前进行中的登记 */
async function toGetSelectRegistrationInfo() {
  const rid = registrationId.value;
  const lid = lineId.value;

  let rInfo: RegistrationDetail | null = null;
  console.log("ridridridridrid", rid);
  // 如果存在登记id 则请求对应数据
  if (rid) {
    rInfo = await registrationDetail(rid);
  } else if (lid) {
    // 和历史/实时界面判断复用同一条当前登记，避免两个选取规则不一致。
    const currentId = currentRegistrationId.value;
    if (currentId) {
      rInfo = await registrationDetail(currentId);
    }
  }

  if (rInfo) {
    const { registrationStatus } = rInfo;

    // 同步id
    registrationId.value = rInfo.id;
    registrationInfo.value = rInfo;

    // 只有当前登记且正在生产时，才开启实时生产数量轮询。
    // 历史登记始终按静态历史数据展示。
    if (!isHistoryRegistration.value && registrationStatus === RegistrationStatus.IN_REGISTRATION) {
      toGetLatestBeatProductNumber();
    }
  }

  return rInfo;
}

/** 轮询获取实时节拍生产数量 */
async function toGetLatestBeatProductNumber() {
  clearLatestProductDataInterval();

  await getLatestBeatProductNumber();

  latestProductData.timer = setInterval(async () => {
    await getLatestBeatProductNumber();
  }, latestProductData.delay);
}

/** 获取实时节拍生产数量 */
async function getLatestBeatProductNumber() {
  const rid = registrationId.value!!;
  const number = await registrationLatestBeatProductNumber(rid);
  latestProductData.beatProductNumber = number;
}

/** 重新渲染全部数据 */
async function reRenderAllData() {
  // 清除生产数量轮询
  clearLatestProductDataInterval();

  const info = await toGetSelectRegistrationInfo();
  console.log("infoinfoinfoinfo", info);
  // 如果登记信息存在
  if (info) {
    await toGetVirtualLineInfo();
    // let stationList = JSON.parse(localStorage.getItem("stationList") || "[]");
    // let virtualStationInfoIds = info.staffSignList.map((i) => i.virtualStationInfo.id);
    // stationList = stationList.filter((i: number) => virtualStationInfoIds.includes(i));
    // if (stationList) {
    //   FiltrationValue.value = stationList;
    //   stationStore.setStationList(stationList);
    // }
  }

  await reRenderPanel();
}

/** 清除生产数量轮询 */
function clearLatestProductDataInterval() {
  latestProductData.beatProductNumber = 0;
  clearInterval(latestProductData.timer);
}

/** 重置看板尺寸 */
function resizeAllChart() {
  console.log("resizeAllChart");
  const { fullscreen, siderCollapsed } = appStore;

  // 容器宽度
  const innerWidth = window.innerWidth < 1380 ? 1380 : window.innerWidth;
  // 侧边栏宽度
  const siderWidth = fullscreen ? 0 : siderCollapsed ? 80 : 200;
  // 可使用区域 = 容器宽度 - 边距 - 侧边栏
  let w = innerWidth - siderWidth - 40 * 2;

  panelWholeWidth.value = w;
}

/** 暂停整体 */
async function pauseAnaly() {
  await pausePanel();
}

/** 重载整体*/
async function reloadAnaly() {
  // reload / 切产线都回到该产线当前登记，保持原来的实时模式。
  // 下拉框保持空白，不把“当前登记”回填到选择框。
  dataPolling.value = true;

  // 更新登记信息
  registrationSelectValue.value = undefined;
  registrationId.value = undefined;
  registrationInfo.value = undefined;
  selectVirtualStationId.value = undefined;
  clearLatestProductDataInterval();
  await toGetRegistrationList();
  await reRenderAllData();
}

/** 重渲染看板数据*/
async function reRenderPanel() {
  // 历史/当前登记切换时 SignalAnaly 会切换不同模板，
  // 先等 DOM 更新，避免 ECharts 在旧容器或 0 宽高容器上重绘。
  await nextTick();

  // 更新看板内数据
  const signalRef = signalAnalyRef.value;
  const statusRef = statusAnalyRef.value;

  if (signalRef) {
    await signalRef.reRenderAllChart();
  }

  if (statusRef) {
    await statusRef.reRenderAllChart();
  }
}

/** 暂停渲染看板数据 */
async function pausePanel() {
  // 更新看板内数据
  const signalRef = signalAnalyRef.value;
  const statusRef = statusAnalyRef.value;

  if (signalRef) {
    await signalRef.pausePanel();
  }

  if (statusRef) {
    await statusRef.pausePanel();
  }
}

/** 获取虚拟产线详情 */
async function toGetVirtualLineInfo() {
  const { virtualLineId } = registrationInfo.value!!;
  // 通过虚拟产线
  const vInfo = await virtualLineDetail(virtualLineId);
  vInfo.virtualStationList =
    vInfo.virtualStationList.sort((a, b) => a.virtualStationSort - b.virtualStationSort) || [];

  virtualLineInfo.value = vInfo;

  // 虚拟产线中获取虚拟工位列表
  const { virtualStationList: vl, targetLineBalance } = vInfo;
  if (targetLineBalance) {
    localStorage.setItem("targetLineBalance", targetLineBalance);
  }
  virtualStationList.value = vl;

  const firstAvailableStation = vl.find((item) => !item.isFilter);
  if (firstAvailableStation) {
    // 默认选中第一个未过滤工位
    selectVirtualStationId.value = firstAvailableStation.id;
  } else {
    selectVirtualStationId.value = undefined;
  }
}

/** 获取员工列表 */
async function toGetStaffList() {
  // 获取产线列表
  const sList = await staffListAll(StaffType.PUGONG);

  staffList.value = sList;
}

/** 获取车间列表 */
// async function toGetWorkshopList() {
//   workshopSelectList.value = await workshopListAll();
// }

/** 获取线体列表，并初始化顶部车间/产线 */
async function toGetLineList() {
  const lList = await lineListAll();
  lineList.value = lList;

  // 车间主任：只从自己负责的车间中初始化。
  // 不使用全量产线第一条或 URL lineId 反推车间，避免 value 有值但下拉 Option 中不存在，显示成数字 ID。
  if (isCjzr) {
    const firstWorkshop = workshopSelectList.value[0];
    workshopId.value = firstWorkshop?.id;

    if (!firstWorkshop) {
      lineId.value = undefined;
      return;
    }

    const firstLine = lList.find(
      (item: any) => String(getLineWorkshopId(item)) === String(firstWorkshop.id)
    );
    lineId.value = firstLine?.id;
    return;
  }

  let selectedLine: any;

  // 其他角色保持原来的逻辑：URL 有 lineId（线长为 manageLineId）优先，否则第一条。
  if (searchLineId) {
    selectedLine = lList.find((item: any) => String(item.id) === String(searchLineId));
  }

  if (!selectedLine) {
    selectedLine = lList[0];
  }

  lineId.value = selectedLine?.id;

  const selectedWorkshopId = getLineWorkshopId(selectedLine);
  workshopId.value =
    selectedWorkshopId ??
    workshopSelectList.value.find((item: any) =>
      lList.some((line: any) => String(getLineWorkshopId(line)) === String(item.id))
    )?.id;
}

/** 获取近30条登记，并补充当前进行中的登记（可能不在近30条中） */
async function toGetRegistrationList() {
  const lid = lineId.value;

  if (!lid) {
    registrationSelectList.value = [];
    return;
  }

  const [records, activeResult] = await Promise.all([
    registrationListAll({
      sort: "id desc",
      lineId: lid,
      pageSize: 30,
    }),
    registrationList({
      sort: "id desc",
      lineId: lid,
      registrationStatus: RegistrationStatus.IN_REGISTRATION,
      pageNum: 1,
      pageSize: 1,
    }),
  ]);

  const activeRegistration = activeResult.records?.find(
    (item: any) => String(item.registrationStatus) === String(RegistrationStatus.IN_REGISTRATION)
  );

  registrationSelectList.value = activeRegistration
    ? [activeRegistration, ...records.filter((item: any) => String(item.id) !== String(activeRegistration.id))]
    : records;
}
/** 确认过滤 */
async function handleOk() {
  isFiltration.value = false;
  stationStore.setStationList(FiltrationValue.value);
  const stationFilterList =
    virtualLineInfo.value?.virtualStationList?.map((item) => {
      return {
        id: item.id,
        isFilter: FiltrationValue.value.includes(item.id) ? 1 : 0,
      };
    }) || [];

  await updateIsFilter(stationFilterList);
  await toGetVirtualLineInfo();
  await reRenderPanel();
}
/** 获取必要信息 */
async function toGetNeedInfo() {
  await toGetStaffList();
  await toGetWorkshopList();
  await toGetLineList();
  await toGetRegistrationList();
  await reRenderAllData();
}

function handleModeChange() {
  if (isSignalMode.value) {
    mode.value = AnalyMode.Status;
  } else {
    mode.value = AnalyMode.Signal;
  }

  // 开启轮询
  dataPolling.value = true;

  replaceUrlQuery(
    {
      mode: mode.value,
    },
    false
  );

  nextTick(() => {
    reloadAnaly();
  });
}
</script>

<style lang="less" scoped>
@toolbar-height: 68px;
@toolbar-gap: 12px;
@toolbar-divider: #eef1f5;

.dpanel-box {
  margin-top: -8px;
  max-width: none;
}

/* ==================== 顶部工具栏 ==================== */
.dpanel-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  height: @toolbar-height;
  padding: 0 16px;
  gap: @toolbar-gap;
  background: linear-gradient(180deg, #fbfcfd 0%, #f5f7fa 100%);
  border-bottom: 1px solid #e8ecf1;
  box-sizing: border-box;
  overflow: hidden;
}

/* ---------- 左侧：选择器 ---------- */
.toolbar-selectors {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  height: 36px;
  padding-right: @toolbar-gap;
  border-right: 1px solid @toolbar-divider;
}

.dpanel-workshop-select {
  width: 132px;
}

.dpanel-line-select {
  width: 168px;
}

/* ---------- 中间：生产信息 ---------- */
.toolbar-info {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  height: 48px;
  gap: @toolbar-gap;
  overflow: hidden;
}

.dpanel-sec {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  flex-shrink: 0;
  padding-right: @toolbar-gap;
  border-right: 1px solid @toolbar-divider;

  &:last-child {
    border-right: none;
    padding-right: 0;
  }

  &-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 1.4;
    height: 24px;
    white-space: nowrap;
  }

  &-label {
    display: inline-block;
    color: #8b95a5;
    font-size: 12px;
    margin-right: 6px;
    flex-shrink: 0;
  }

  &-value {
    color: #2b3440;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    font-size: 16px;
  }

  &-empty {
    color: #c8ced6;
  }
}

/* ---------- 右侧：工具栏 ---------- */
.toolbar-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
  height: 36px;
}

.registration-select {
  width: 220px !important;
  margin-right: 2px;
}

.registration-option {
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  line-height: 1.4;
  height: 100%;

  &-date {
    color: #9aa3af;
    font-variant-numeric: tabular-nums;
    font-size: 11px;
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
}

.toolbar-tag {
  margin: 0 2px;
}

/* 工具栏统一图标按钮 */
.toolbar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 18px;
  color: @color-primary;
  cursor: pointer;
  transition: background-color .15s ease, color .15s ease;

  &:hover {
    background-color: rgba(24, 144, 255, 0.08);
  }
}

/* ---------- 模式切换 ---------- */
.mode-switch {
  margin-left: 6px;
  padding: 0 14px;
  height: 28px;
  min-width: 78px;
  border-radius: 14px;
  background-color: #cbd5e1;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  }

  &.signal {
    background-color: @color-primary;
  }

  &.status {
    background-color: @color-warn;
  }
}

/* ---------- 窄屏兜底 ---------- */
@media (max-width: 1440px) {
  .dpanel-workshop-select {
    width: 120px;
  }

  .dpanel-line-select {
    width: 150px;
  }

  .registration-select {
    width: 180px !important;
  }

  .toolbar-info {
    gap: 8px;
  }

  .dpanel-sec {
    padding-right: 8px;
  }
}
</style>
