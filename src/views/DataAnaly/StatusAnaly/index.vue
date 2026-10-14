<template>
  <Row :gutter="20" class="!flex-nowrap">
    <Col :style="{ minWidth: chartWidth + 'px' }">
      <!-- 产线实时状态 -->
      <SubTitle2 class="!h-36px">
        <div class="flex items-center">
          <Popover placement="top">
            <template #content>
              <p>
                实时同步产线下全部工位:
                <br />
                - <span class="text-warn-d font-bold">反馈工位上静电手环状态</span>
                <br />
                - <span class="text-warn-d font-bold">反馈工位上设备接地状态</span>
                <br />
                - <span class="text-warn-d font-bold">反馈工位上安灯事件状态</span>
              </p>
            </template>
            <div class="!-mt-12px !-mb-12px">
              <p class="flex items-center">
                <QuestionCircleOutlined class="!text-secondary pr-2px" />
                <span>产线实时状态</span>
              </p>
            </div>
          </Popover>

          <Tag :color="dataPolling ? 'blue' : ''" class="!ml-6px">{{ currentDate }}</Tag>
        </div>
      </SubTitle2>

      <div class="chart1 my-24px mb-12px ml-18px">
        <div>
          <p class="flex items-center justify-center !text-16px font-bold text-primary">产线实时状态看板</p>
          <StationStatusChart
            :virtualStationList="virtualStationList"
            :stationLatestSignalList="stationLatestSignalList"
            :registrationInfo="registrationInfo"
            :addonEventList="addonEventList"
          />
        </div>
      </div>

      <!-- 安灯事件播报 -->
      <SubTitle2 class="!my-16px" title="安灯事件播报" />
      <div class="ml-18px">
        <EventBroadcast :addonEventList="addonEventList" />
      </div>
    </Col>

    <Divider type="vertical" dashed class="!-mt-0px !h-85vh" style="border-color: #ccc" />

    <Col :style="{ minWidth: panelRightWidth + 'px' }">
      <!-- 安灯事件统计 -->
      <SubTitle2 class="!my-12px !mb-0px" title="安灯事件统计" />
      <div>
        <ChartBar
          :width="panelRightWidth"
          :height="chartHeight"
          title="安灯事件处理统计"
          xLabel="事件类型"
          yLabel="呼叫/处理"
          :loading="eventAnalyChartData.loading"
          :xData="eventAnalyChartData.xData"
          :xyData="eventAnalyChartData.xyData"
          :chartOptions="chart1Options"
        />
      </div>

      <!-- 安灯事件发生趋势 -->
      <SubTitle2 class="!my-12px !mb-0px" title="安灯发生趋势" />
      <div>
        <ChartBar
          :width="panelRightWidth"
          :height="chartHeight"
          title="安灯事件发生趋势"
          xLabel="时间"
          yLabel="事件数量"
          :loading="eventTrendChartData.loading"
          :xData="eventTrendChartData.xData"
          :xyData="eventTrendChartData.xyData"
          :chartOptions="chart2Options"
        />
      </div>
    </Col>
  </Row>
</template>

<script setup lang="ts">
  import { defineEmits, onUnmounted, computed, reactive, onMounted, ref, defineExpose } from "vue";
  import { Row, Col, Select, Popover, Tag, Divider, Button } from "ant-design-vue";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import DateGroup from "/@/components/Application/DateGroup.vue";
  import { QuestionCircleOutlined, ReloadOutlined } from "@ant-design/icons-vue";
  import { DateType, RegistrationStatus } from "/@/enums/model";
  import { useStationRankTable } from "./useTable";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { useAppStore, useDataStore } from "/@/store";
  import { themeColor } from "/@/settings/var";
  import { formatDateByDayjs } from "/@/utils/util";
  import StationStatusChart from "/@/views/components/StationStatusChart/index.vue";
  import EventBroadcast from "/@/views/components/EventBroadcast/index.vue";
  import { analyAddonEventList, analyEventList, useChartData } from "./data";
  import { panelWholeWidth, useData } from "../useData";
  import { StationLatestSignalData } from "/@/api/model/signal";
  import { signalStationListLatestSignal } from "/@/api/signal";
  import { AddonEventDetail } from "/@/api/model/addonEvent";
  import { addonEventListByRegistrationId } from "/@/api/addonEvent";

  defineExpose({
    reRenderAllChart,
    pausePanel,
  });

  const emits = defineEmits(["lineChartStationClick"]);

  const appStore = useAppStore();

  const chartWidth = computed(() => panelWholeWidth.value * 0.47);
  const chartHeight = 340;
  const panelRightWidth = computed(() => panelWholeWidth.value * 0.53);

  const currentDate = ref("");
  const addonEventList = ref<AddonEventDetail[]>([]);

  const { registrationId, registrationInfo, lineId, virtualStationList, dataPolling } = useData();
  const { eventTrendChartData, eventAnalyChartData, lineStatusChartData, chart1Options, chart2Options } =
    useChartData();

  const stationLatestSignalList = ref<StationLatestSignalData[]>([]);

  onMounted(async () => {});

  onUnmounted(() => {
    clearInterval(lineStatusChartData.timer);
  });

  /** 更新播报 */
  async function toUpdateBroadcast() {
    // 获取登记下事件列表
    const rid = registrationId.value;
    const records = await addonEventListByRegistrationId(rid!!);
    addonEventList.value = records;

    // 更新图表数据
    analyAddonEventList(records);
  }

  /** 获取产线状态 */
  async function toRenderLineStatusData() {
    // 更新当前时间
    const date = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
    currentDate.value = date;

    console.log(date);

    const lid = lineId.value!!;

    // 请求最新状态数据
    const records = await signalStationListLatestSignal(lid);
    const fRecords = records.filter((j) => j);
    stationLatestSignalList.value = fRecords;
  }

  /** 开启渲染定时器 */
  function toResetLineStatusData() {
    // 开启 产线状态定时器
    toUpdateBroadcast();
    toRenderLineStatusData();

    clearInterval(lineStatusChartData.timer);
    lineStatusChartData.timer = setInterval(async () => {
      toUpdateBroadcast();
      toRenderLineStatusData();
    }, lineStatusChartData.delay);
  }

  /** 暂停渲染 */
  async function pausePanel() {
    closeLineDataInterval();
  }

  /** 重新渲染全部图表 */
  async function reRenderAllChart() {
    const { close } = createLoading();

    const rid = registrationId.value;
    const rInfo = registrationInfo.value;

    if (rid) {
      // await toGetNeedInfo();
      await toResetLineStatusData();

      if (rInfo && rInfo.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
        // 开启轮询
        openLineDataInterval();
      } else {
        closeLineDataInterval();
      }
    } else {
      clearAllChart();
      // 关闭轮询
      closeLineDataInterval();
    }

    close();
  }

  /** 清除全部图表 */
  async function clearAllChart() {
    eventAnalyChartData.yData1 = [0, 0, 0, 0, 0];
    eventAnalyChartData.yData2 = [0, 0, 0, 0, 0];

    eventTrendChartData.xData = [];
    eventTrendChartData.xyData = [];

    addonEventList.value = [];

    virtualStationList.value = [];
    stationLatestSignalList.value = [];

    currentDate.value = "";
  }

  /** 打开实时数据轮询 */
  function openLineDataInterval() {
    toResetLineStatusData();
  }

  /** 关闭实时数据轮询 */
  function closeLineDataInterval() {
    // 清除定时器
    clearInterval(lineStatusChartData.timer);
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    // 更新播报
    await toUpdateBroadcast();
  }
</script>

<style lang="less" scoped>
  .chart1 {
    min-height: 320px;
    max-height: 60vh;
    // border-bottom: 1px dashed #ccc;
  }

  .average-danger {
    color: @color-danger;
    font-weight: bold;
    font-size: 16px;
  }

  :deep {
    .my-table .ant-table {
      height: 235px;
    }
  }
  .chart1 {
    overflow-y: auto;
  }
</style>
