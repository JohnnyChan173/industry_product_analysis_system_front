<template>
  <Row :gutter="20" class="!flex-nowrap">
    <Col :style="{ width: chartWidth + 'px' }">
      <!-- 产量分析 -->
      <SubTitle2 class="!h-36px">
        <div class="flex items-center" style="align-items: center;">
          <Popover placement="top">
            <template #content>
              <div>
                - 实时分析当前线体下全部工位；<span class="text-warn-d font-bold"
                  >每隔{{ lineBeatChartData.delay / 1000 }}秒</span
                >刷新

                <p v-if="isPDXLine(lineInfo?.lineType)">
                  - 皮带线通过<span class="text-warn-d font-bold">【秤盘重量变化信号】</span>反向计算节拍
                </p>
                <p v-else>
                  - 工装板线通过<span class="text-warn-d font-bold"
                    >【{{ lineBeatBaseDouble }}秒内最近信号与上次信号 的时耗】</span
                  >即节拍；
                </p>
                -
                <span class="text-gray-400">
                  [节拍范围:{{ lineInfo?.beatMin }} ≤
                  <span class="text-primary font-bold">{{ virtualLineInfo?.standardBeat }} [标准]</span> ≤
                  {{ lineInfo?.beatMax }}]
                </span>
              </div>
            </template>
            <div >
              <p class="flex items-center" style="height: 24px;margin-bottom: 0;">
                <QuestionCircleOutlined class="!text-secondary pr-2px" />
                <span>产线实时节拍</span>
              </p>
            </div>
          </Popover>

          <Tag :color="dataPolling ? 'blue' : ''" class="!ml-6px">{{ currentDate }}</Tag>
        </div>
      </SubTitle2>
      <div class="chart1 my-24px" :class="{ 'is-fullscreen': isFullscreen }">
        <!-- 工具栏 -->
        <div class="chart-toolbar">
          <FullscreenOutlined v-if="!isFullscreen" @click="enterFullscreen" />
          <FullscreenExitOutlined v-else @click="exitFullscreen" />
          <!-- <button v-if="!isFullscreen" @click="enterFullscreen"> 全屏 </button> -->
          <!-- <button v-else @click="exitFullscreen"> 恢复 </button> -->
        </div>
        <ChartBar
          :fullscreen="isFullscreen"
          :width="chartWidth"
          :height="chartHeight"
          :title="_getData1Title()"
          xLabel="工位"
          yLabel="时间消耗(秒)"
          :xyData="lineBeatChartData.xyData"
          :xData="lineBeatChartData.xData"
          :yData="lineBeatChartData.yData"
          :loading="lineBeatChartData.loading"
          :chartOptions="chart1Options"
          :itemStyleColor="themeColor['primary-l']"
          :chartClick="handleLineChartClick"
          :markLineValue="lineBeatChartData.markLineValue"
          :maxLabel="lineBeatChartData.maxLabel"
        />
      </div>

      <!-- 工位节拍趋势 -->
      <SubTitle2 class="!my-16px" title="岗位节拍趋势" />
      <div class="my-24px chart-wrapper">
        <div class="chart-actions">
          <a-dropdown>
            <a-button size="small">切换图表 <DownOutlined /></a-button>
            <template #overlay>
              <a-menu :selectedKeys="[chartType]" @click="({ key }) => (chartType = key)">
                <a-menu-item key="normal">常规</a-menu-item>
                <a-menu-item key="5">5s</a-menu-item>
                <a-menu-item key="10">10s</a-menu-item>
                <a-menu-item key="15">15s</a-menu-item>
                <a-menu-item key="30">30s</a-menu-item>
                <a-menu-item key="hour">标准标准小时产能</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-popover placement="bottomRight">
            <template #content>
              <div class="flex items-center">
                <span>标准工时：</span> <span>{{ virtualLineInfo?.standardBeat }}秒</span>
              </div>
              <div class="flex items-center">
                <span>目前单次时间:</span>
                <span>{{ stationBeatChartData.yData[stationBeatChartData.yData.length - 1] }}秒</span>
              </div>
              <div class="flex items-center">
                <span>累计时间平均值：</span> <span>{{ stationBeatChartData.average }}秒</span>
              </div>
              <div class="flex items-center">
                <span>超出预设上限次数:</span>
                <span>{{
                  exceedAvgCount - selectVirtualStationInfo.exceedAvgBeatMax > 0
                    ? exceedAvgCount - selectVirtualStationInfo.exceedAvgBeatMax
                    : 0
                }}</span>
              </div>
              <div class="flex items-center">
                <span>超过标准上限次数:</span> <span>{{ selectVirtualStationInfo.exceedAvgBeatMax }}</span>
              </div>
            </template>
            <template #title>
              <span>实际节拍数据与标准工时的差异性</span>
            </template>
            <a-button size="small" style="margin-left: 12px"> 查看 </a-button>
          </a-popover>
        </div>

        <ChartBar
          v-if="chartType == 'normal'"
          :width="chartWidth"
          :height="chartHeight"
          :title="_getData2Title()"
          xLabel="信号时间"
          yLabel="时间消耗(秒)"
          :xyData="stationBeatChartData.xyData"
          :xData="stationBeatChartData.xData"
          :yData="stationBeatChartData.yData"
          :loading="stationBeatChartData.loading"
          :showTotal="stationBeatChartData.xData != null"
          :TotalIsYDataLength="true"
          :chartOptions="chart2Options"
          :itemStyleColor="themeColor.beat"
          :markLineValue="stationBeatChartData.markLineValue"
          :todayRecordsTotal="stationBeatChartData.todayRecordsTotal"
          :chartClick="handleStationChartClick"
        />
        <ChartBar
          v-else-if="chartType == 'hour'"
          :width="chartWidth"
          :height="chartHeight"
          :title="_getHourCapacityTitle()"
          xLabel="时段"
          yLabel="产能(件/小时)"
          :xData="stationBeatChartData3.xData"
          :yData="stationBeatChartData3.yData"
          :loading="stationBeatChartData3.loading"
          :chartOptions="chartHourOptions"
          :itemStyleColor="themeColor.beat"
        />
        <ChartBar
          v-else
          :width="chartWidth"
          :height="chartHeight"
          :title="_getData5Title()"
          xLabel="信号时间"
          yLabel="时间消耗(秒)"
          :showTotal="true"
          :xData="stationBeatChartData2.xData"
          :yData="stationBeatChartData2.yData"
          :loading="stationBeatChartData2.loading"
          :chartOptions="chart5Options"
          :itemStyleColor="themeColor.beat"
        />
      </div>
    </Col>

    <Divider type="vertical" dashed class="!-mt-0px !h-85vh" style="border-color: #ccc" />

    <Col :style="{ width: panelRightWidth + 'px' }">
      <SubTitle2 class="!my-12px !mb-0px" :title="isHourRank ? '当天平均标准标准小时产能排行' : '当天岗位节拍排行'" />
      <div class="chart1">
        <ChartBar
          :width="panelRightWidth"
          :height="450"
          :title="_getData3Title()"
          :xLabel="isHourRank ? '平均标准标准小时产能(件/小时)' : '平均节拍(秒)'"
          yLabel="岗位"
          :xyData="allStationBeatChartData.xyData"
          :xData="allStationBeatChartData.xData"
          :yData="allStationBeatChartData.yData"
          :loading="allStationBeatChartData.loading"
          :chartOptions="chart3Options"
          :isVertical="true"
          :itemStyleColor="themeColor.beat"
          :markLineValue="allStationBeatChartData.markLineValue"
        />
      </div>

      <!-- 线平衡 -->
      <SubTitle2 class="!my-0px">
        <Popover placement="top">
          <template #content>
            <div>
              <p>当日线体工位数：{{ lineBalanceChartData.stationTotal }}</p>
              <p>当日线体节拍总和：{{ lineBalanceChartData.lineAvgSum }}</p>
              <p>当日线体最大节拍：{{ lineBalanceChartData.maxAverageBeat }}</p>
              <p>
                当日线体线平衡率：
                <span class="text-primary">{{ lineBalanceChartData.markLineValue }}%</span>
              </p>
            </div>
          </template>
          <span>当日线平衡</span>
        </Popover>
      </SubTitle2>

      <div class="chart1">
        <ChartBar
          :width="panelRightWidth"
          :height="320"
          :title="_getData4Title()"
          xLabel="时间"
          :yLabel="`&nbsp;&nbsp;&nbsp;&nbsp;线平衡: ${lineBalanceChartData.markLineValue}%`"
          :xyData="lineBalanceChartData.xyData"
          :xData="lineBalanceChartData.xData"
          :yData="lineBalanceChartData.yData"
          :loading="lineBalanceChartData.loading"
          :maxAverageBeat="lineBalanceChartData.maxAverageBeat"
          :chartOptions="chart4Options"
          :itemStyleColor="themeColor.beat"
        />
      </div>
    </Col>
    <Modal
      v-model:visible="madalData.visible"
      title="岗位节拍视频"
      width="900px"
      :footer="null"
      :destroyOnClose="true"
      @afterClose="handleVideoModalClosed"
    >
      <videoView v-if="madalData.videoUrl" :videoUrl="madalData.videoUrl" />
    </Modal>
  </Row>
</template>

<script setup lang="ts">
  import {
    withDefaults,
    defineProps,
    defineEmits,
    defineExpose,
    unref,
    onUnmounted,
    computed,
    watch,
    reactive,
    onMounted,
    onBeforeUnmount,
    ref,
  } from "vue";
  import {
    Row,
    Col,
    Select,
    Popover,
    Tag,
    InputNumber,
    RangePicker,
    Divider,
    Table,
    Button,
    Modal,
    message,
  } from "ant-design-vue";
  import { StationInfo } from "/@/api/model/station";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import DateGroup from "/@/components/Application/DateGroup.vue";
  import { IntervalHandle } from "/#/global";
  import {
    QuestionCircleOutlined,
    ReloadOutlined,
    SettingOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
  } from "@ant-design/icons-vue";
  import { signalSpecifyDateData } from "/@/api/signal";
  import { debounce, formatDateByDayjs, parseSearch } from "/@/utils/util";
  import { EChartsOption } from "echarts";
  import { themeColor } from "/@/settings/var";
  import { numberToFixed } from "/@/utils/math";
  import { addOutOfAverage, beatExceptionAdd, getOutOfAverage } from "/@/api/beatException";
  import type { BeatExceptionInfo } from "/@/api/model/beatException";
  import videoView from "/@/components/video/index.vue";
  import {
    formatSignal2ChartData,
    formatHourlyCapacityChartData,
    formatSignalStations,
    formatSignalStationsRealTimeChartData,
    formatSignalAllStationRankData,
    formatSignalAllStationHourlyCapacityRankData,
    formatBalanceListChartData,
    filterValidBeatRecords,
    genLineBalanceHtml,
    transformScale2General,
  } from "../format";
  import dayjs, { Dayjs } from "dayjs";
  import { DateType, RegistrationStatus, SubModuleType } from "/@/enums/model";
  import { DEFAULT_BEAT_BASE, defaultPageSize, REGISTRATION_NO_END_DATE_OFFSET } from "/@/config";
  import { useStationRankTable } from "./useTable";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { useAppStore, useDataStore } from "/@/store";
  import { maxPageSize } from "/@/config";
  import { SignalDataInfo } from "/@/api/model/signal";
  import { replaceUrlQuery } from "/@/utils/router";
  import { panelWholeWidth, useData } from "../useData";
  import { useChartData } from "./data";
  import { virtualStationDetail } from "/@/api/virtualStation";
  import { formatRegistrationEndDate, getVirtualStationText, isPDXLine } from "/@/config/parse";
  import { useStationStore } from "/@/store";
  import { getVideoStorageAddress } from "/@/api/gateway";

  const stationStore = useStationStore();
  const WEBDAV_VIDEO_BASE_URL = "https://183.249.77.50:5006/video";
  const madalData = ref({
    visible: false,
    videoUrl: "",
  });

  function buildWebDavVideoUrl(videoStorageAddress: string) {
    const address = String(videoStorageAddress || "").trim();
    if (!address) return "";

    if (/^https?:\/\//i.test(address)) {
      return address;
    }

    const baseUrl = new URL(`${WEBDAV_VIDEO_BASE_URL.replace(/\/+$/, "")}/`);
    const basePath = baseUrl.pathname.replace(/^\/+|\/+$/g, "");
    let normalizedPath = address.replace(/\\/g, "/").replace(/^\/+/, "");

    // 兼容接口返回值本身已带 /video 前缀，避免最终地址出现 /video/video/。
    if (normalizedPath === basePath) {
      normalizedPath = "";
    } else if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
      normalizedPath = normalizedPath.slice(basePath.length + 1);
    }

    return new URL(normalizedPath, baseUrl).toString();
  }

  function handleVideoModalClosed() {
    madalData.value.videoUrl = "";
  }
  const emits = defineEmits(["lineChartStationClick"]);
  const setIsFirst = (val: boolean) => {
    isFisrt.value = val;
  };

  async function pausePanel() {
    closeLineDataInterval();
  }
  const setFiltration = (val: boolean) => {
    isFiltration.value = val;
  };
  defineExpose({
    reRenderAllChart,
    pausePanel,
    setIsFirst,
    setFiltration,
  });

  const {
    lineId,
    lineInfo,
    lineList,
    staffList,
    registrationId,
    registrationInfo,
    registrationStartDate,
    virtualStationList,
    virtualLineInfo,
    selectVirtualStationId,
    selectVirtualStationInfo,

    dataPolling,
  } = useData();

  const {
    lineBeatChartData,
    stationBeatChartData,
    stationBeatChartData2,
    stationBeatChartData3,
    allStationBeatChartData,
    lineBalanceChartData,

    chart1Options,
    chart2Options,
    chart3Options,
    chart4Options,
    chart5Options,
    chartHourOptions,
  } = useChartData();

  const searchParams = parseSearch();
  const appStore = useAppStore();
  const chartWidth = computed(() => panelWholeWidth.value * 0.65);
  const chartHeight = 340;
  const panelRightWidth = computed(() => panelWholeWidth.value * 0.35);
  // const stationBeatChartData2 = ref({});
  const isFullscreen = ref(false);
  const chartType = ref("normal");
  const isHourRank = computed(() => chartType.value === "hour");
  // 线体实时节拍数量
  const lineBeatCount = 3;
  // 防止接口响应慢于轮询间隔时出现并发堆积。
  let lineBeatRequesting = false;

  const lineBeatBaseValue = computed(() => {
    if (virtualLineInfo.value) {
      return virtualLineInfo.value.standardBeat || DEFAULT_BEAT_BASE;
    } else {
      return DEFAULT_BEAT_BASE;
    }
  });

  const lineBeatBaseDouble = computed(() => lineBeatBaseValue.value * 3);

  const currentDate = ref("");

  const stationRankData = reactive({
    loading: false,
    pageNo: 1,
    pageSize: defaultPageSize / 2,
    total: 0,
  });
  const isFisrt = ref(true);
  // 线体排行表单
  const { dataSource: stationRankSource, columns: stationRankColumns } = useStationRankTable();

  // 全部工位节拍排行原始数据
  const allStationBeatRankRaw = ref<any[]>([]);
  // 全部工位平均标准标准小时产能排行原始数据
  const allStationHourlyCapacityRankRaw = ref<any[]>([]);

  watch(chartType, () => {
    applyStationRankChartData();
  });

  // 当天 00:00:00 至当前时间的全部工位信号；初始化一次，后续只合并实时增量。
  const allStationSignalList = ref<SignalDataInfo[]>([]);
  // 与 allStationSignalList 同口径，保留独立引用用于当天统计。
  const todayAllStationSignalList = ref<SignalDataInfo[]>([]);

  const allStationBeatRaw = ref<any[]>([]);

  onMounted(async () => {
    document.addEventListener("keydown", handleEsc);
  });
  const aboveAverage = computed(
    () => stationBeatChartData.xyData.filter((v) => v.beatTime > stationBeatChartData.average).length
  );
  onUnmounted(() => {
    clearInterval(lineBeatChartData.timer);
  });

  const isFiltration = ref(false);
  /** 暂停渲染 */

  /** 重新渲染全部图表 */
  async function reRenderAllChart() {
    const { close } = createLoading();
    chartType.value = "normal";
    // 先清空全部数据
    clearAllChart();

    const rid = registrationId.value;
    const rInfo = registrationInfo.value;

    if (rid) {
      // 先获取全工位信号数据（图表必须数据）
      await toGetAllStationSignal();
      await renderAllChart();

      if (rInfo && rInfo.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
        // 开启轮询
        openLineDataInterval();
      } else {
        // 请求一次(渲染工位列表)
        renderRealTimeStationList();
        closeLineDataInterval();
      }
    } else {
      // 关闭轮询
      closeLineDataInterval();
    }

    close();
  }

  /** 清除全部图表 */
  async function clearAllChart() {
    stationBeatChartData.xyData = [];
    stationBeatChartData.xData = [];
    stationBeatChartData.yData = [];
    stationBeatChartData.todayRecordsTotal = 0;
    stationBeatChartData2.xData = [];
    stationBeatChartData2.yData = [];
    stationBeatChartData3.xData = [];
    stationBeatChartData3.yData = [];
    stationBeatChartData3.xyData = [];
    lineBeatChartData.xyData = [];
    lineBeatChartData.xData = [];
    lineBeatChartData.yData = [];

    allStationBeatChartData.xyData = [];
    allStationBeatChartData.xData = [];
    allStationBeatChartData.yData = [];
    allStationBeatRankRaw.value = [];
    allStationHourlyCapacityRankRaw.value = [];
    allStationSignalList.value = [];
    todayAllStationSignalList.value = [];
    lastExceptionQueryKey.value = "";

    lineBalanceChartData.xyData = [];
    lineBalanceChartData.xData = [];
    lineBalanceChartData.yData = [];

    currentDate.value = "";
  }

  /** 渲染全部图表 */
  async function renderAllChart() {
    // 先生成全工位排行，单工位趋势可以直接复用平均值结果，避免再算一次全量排行。
    await toRenderAllStationBeatData();

    // 渲染单工位数据【岗位节拍趋势 / 标准标准小时产能】
    await toRenderStationBeatData();

    // 渲染线平衡数据【线平衡】
    await toRenderLineBalanceBeatData();
  }

  /** 岗位统计-是否是慢速岗位 */
  function isAverageDanger(index: number) {
    const { pageNo } = stationRankData;
    if (pageNo === 1 && index < 3) {
      return true;
    }
  }
  // const lastName = ref();
  /** 线体节拍 x轴点击 */
  async function handleLineChartClick(params: any) {
    lastData = 0;
    isFisrt.value = true;

    const { componentType, dataIndex } = params;

    if (componentType === "xAxis") {
      const info = lineBeatChartData.xyData[dataIndex];
      const {
        virtualStationInfo: { id },
      } = info;
      console.log(info);
      if (id) {
        selectVirtualStationId.value = id;

        // 当前岗位的趋势和异常累计都由 toRenderStationBeatData 统一刷新，避免重复请求。
        await toRenderStationBeatData();
      }
    }
  }

  async function handleStationChartClick(params: any) {
    const { componentType, dataIndex } = params;

    if (componentType === "series") {
      const info = stationBeatChartData.xyData[dataIndex];
      const messageId = info?.second?.messageId;

      if (!messageId) {
        message.warning("当前节拍没有关联 messageId");
        return;
      }

      try {
        const endDate = registrationInfo.value?.endDate
          ? registrationInfo.value.endDate
          : dayjs().format("YYYY-MM-DD HH:mm:ss");
        const res = await getVideoStorageAddress({
          messageId,
          startDate: registrationInfo.value?.startDate as string,
          endDate,
        });
        const videoStorageAddress = res?.videoStorageAddress;
        const videoUrl = buildWebDavVideoUrl(videoStorageAddress);

        if (!videoUrl) {
          message.warning("当前节拍没有关联视频");
          return;
        }
        window.open(videoUrl, "_blank");
        // 使用独立弹窗播放，避免跳出当前分析页面。
        // madalData.value.videoUrl = videoUrl;
        // madalData.value.visible = true;
      } catch (error) {
        console.error("获取岗位节拍视频失败:", error);
        message.error("获取岗位节拍视频失败");
      }
    }
  }

  async function runLineBeatPollingOnce() {
    if (lineBeatRequesting) return;

    lineBeatRequesting = true;
    try {
      await toRenderLineBeatData();
    } finally {
      lineBeatRequesting = false;
    }
  }

  /** 打开实时数据轮询 */
  async function openLineDataInterval() {
    // 请求一次
    await runLineBeatPollingOnce();

    // 开始轮询；上一轮未结束时直接跳过，避免慢请求叠加。
    clearInterval(lineBeatChartData.timer);
    lineBeatChartData.timer = setInterval(() => {
      void runLineBeatPollingOnce();
    }, lineBeatChartData.delay);
  }

  /** 关闭实时数据轮询 */
  function closeLineDataInterval() {
    // 清除定时器
    clearInterval(lineBeatChartData.timer);
  }

  /** 获取 图表1标题 */
  function _getData1Title() {
    const info = lineInfo.value;

    if (info) {
      return `【${info.lineName}】- 实时节拍`;
    } else {
      return "";
    }
  }
  const today = dayjs().format("YYYY-MM-DD");
  /** 获取 图表2标题 */
  function _getData2Title() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    const sd = today;
    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    } else {
      stationText = "";
    }
    return `【${stationText}】- ${sd} 节拍趋势`;
  }
  function _getData5Title() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    const sd = today;

    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    }

    return `【${stationText}】- ${sd} 统计图`;
  }

  /** 获取标准标准小时产能图标题 */
  function _getHourCapacityTitle() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    }

    return `【${stationText}】- ${today} 标准标准小时产能`;
  }

  /** 获取右侧岗位排行标题 */
  function _getData3Title() {
    const info = lineInfo.value;
    const sd = today;

    if (!info) return "";

    const rankTitle = isHourRank.value ? "平均标准标准小时产能排行" : "岗位节拍排行";
    return `【${info.lineName}】${sd}-${rankTitle}`;
  }

  /** 获取 图表4标题 */
  function _getData4Title() {
    const info = lineInfo.value;
    const sd = today;

    if (info) {
      return `【${info.lineName}】${sd}-线平衡`;
    } else {
      return "";
    }
  }

  /** 渲染产线实时节拍 */
  async function toRenderLineBeatData() {
    const lid = lineId.value!!;
    const rInfo = registrationInfo.value!!;
    const isPDX = isPDXLine(lineInfo.value?.lineType);
    const date = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
    currentDate.value = date;

    // 开始时间不能小于登记时间
    const regStartDate = new Date(registrationInfo.value?.startDate!!);

    let records: SignalDataInfo[] = [];
    const recordStartDate = Math.max(regStartDate.getTime(), Date.now() - lineBeatBaseDouble.value * 1000);
    // 实时轮询只拉最近几个节拍范围，不能每次从当天 00:00:00 开始请求。
    const startDate = formatDateByDayjs(recordStartDate, "YYYY-MM-DD HH:mm:ss");
    const endDate = formatRegistrationEndDate(rInfo);

    if (isPDX) {
      // 皮带线 按需取信号 二次尝试！！
      records = await signalSpecifyDateData({
        type: SubModuleType.SCALE,
        lineId: lid,
        startDate,
        endDate,
      });

      // ★ 加入重量信号转通用输入逻辑
      records = transformScale2General(startDate, endDate, records, false);
    } else {
      // console.log(selectVirtualStationInfo.value?.stationId);

      // 请求指定时间内的节拍数据
      records = await signalSpecifyDateData({
        type: SubModuleType.GENERAL_INPUT,
        lineId: lid,
        startDate,
        endDate,
        count: lineBeatCount,
      });
    }

    // 调试用
    // const records = [
    //   {
    //     "timestamp": 1709792195071,
    //     "lineId": 8,
    //     "stationId": 17,
    //     "staffId": 12,
    //     "addon": null,
    //     "approachWristband": null,
    //     "deviceGround": null,
    //     "generalInput": "1",
    //   },
    //   {
    //     "timestamp": 1709792201614,
    //     "lineId": 8,
    //     "stationId": 17,
    //     "staffId": 12,
    //     "addon": null,
    //     "approachWristband": null,
    //     "deviceGround": null,
    //     "generalInput": "1",
    //   },
    // ] as any[];

    // 渲染实时节拍图表
    // console.log("recordsrecords", records);
    const { xyData, xData, yData, markLineValue } = formatSignalStationsRealTimeChartData(records);

    lineBeatChartData.xyData = xyData;
    lineBeatChartData.xData = xData;
    lineBeatChartData.yData = yData;
    lineBeatChartData.markLineValue = markLineValue;

    // 2024年3月7日 追加逻辑，数据拼接重绘 其他3图表
    if (records.length > 0) {
      // 只有真正出现新信号时才重算全天图表；重复轮询数据不触发重绘。
      const hasNewSignal = composeSignalList(records);
      if (hasNewSignal) {
        await renderAllChart();
      }
    }
  }

  /** 渲染实时节拍工位列表 */
  function renderRealTimeStationList() {
    // 渲染实时节拍图表
    const { xyData, xData, yData, markLineValue } = formatSignalStationsRealTimeChartData([]);

    lineBeatChartData.xyData = xyData;
    lineBeatChartData.xData = xData;
    lineBeatChartData.yData = yData;
  }

  /** 合并实时增量信号到当天缓存 */
  function composeSignalList(records: SignalDataInfo[]) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

    const oldList = todayAllStationSignalList.value;
    const signalKeySet = new Set(oldList.map((item) => `${item.stationId}:${item.timestamp}`));
    const appendedRecords: SignalDataInfo[] = [];

    for (const signal of records) {
      if (signal.timestamp < todayStart || signal.timestamp >= tomorrowStart) continue;

      const key = `${signal.stationId}:${signal.timestamp}`;
      if (signalKeySet.has(key)) continue;

      signalKeySet.add(key);
      appendedRecords.push(signal);
    }

    if (!appendedRecords.length) return false;

    // 两类图表共用同一份“当天 + 实时增量”数据，历史点只增不减。
    const mergedList = [...oldList, ...appendedRecords];
    todayAllStationSignalList.value = mergedList;
    allStationSignalList.value = mergedList.slice();
    return true;
  }

  /** 渲染工位节拍趋势
   *
   * 当天信号只在初始化时请求一次，后续实时轮询只往本地列表追加增量。
   * 岗位趋势、分布图、标准标准小时产能都直接从当天本地数据计算，不再为当前岗位额外发请求。
   */
  async function toRenderStationBeatData() {
    // 当前岗位被过滤或尚未选择时，默认选择第一个未过滤岗位。
    const availableVirtualStations = virtualStationList.value.filter(
      (item) => !item.isFilter && !stationStore.stationList.includes(item.id)
    );
    let vsInfo = availableVirtualStations.find((item) => item.id === selectVirtualStationId.value);
    if (!vsInfo) {
      vsInfo = availableVirtualStations[0];
    }

    if (!vsInfo) {
      stationBeatChartData.xyData = [];
      stationBeatChartData.xData = [];
      stationBeatChartData.yData = [];
      stationBeatChartData.average = 0;
      stationBeatChartData.todayRecordsTotal = 0;
      stationBeatChartData2.xData = [];
      stationBeatChartData2.yData = [];
      stationBeatChartData3.xData = [];
      stationBeatChartData3.yData = [];
      stationBeatChartData3.xyData = [];
      return;
    }

    const { id: virtualStationId, stationId } = vsInfo;
    selectVirtualStationId.value = virtualStationId;
    selectVirtualStationInfo.value = vsInfo;

    // 直接使用当天缓存。历史信号只增不减，不再根据实时请求窗口覆盖本地数据。
    const stationSignalList = todayAllStationSignalList.value.filter((item) => item.stationId === stationId);
    const validStationSignalList = filterValidBeatRecords(stationSignalList);

    // 岗位节拍趋势只显示最近 1 小时。
    // 多保留截止点之前最后一条信号，用于正确计算刚进入 1 小时时间窗的第一个节拍；
    // 最终再按 second.timestamp 过滤，确保图上真正展示的节拍都落在最近 1 小时内。
    // const startTime = Date.now();
    // console.log(registrationInfo.value.startDate);
    // c
    const startDate = new Date(registrationInfo.value.startDate);
    console.log(startDate);
    const nowTimestamp = Date.now();
    const oneHourAgo = nowTimestamp - 60 * 60 * 1000;
    const sortedStationSignalList = [...stationSignalList].sort((a, b) => a.timestamp - b.timestamp);
    const firstRecentIndex = sortedStationSignalList.findIndex((item) => item.timestamp >= oneHourAgo);
    const trendSourceList =
      firstRecentIndex > 0
        ? sortedStationSignalList.slice(firstRecentIndex - 1)
        : firstRecentIndex === 0
        ? sortedStationSignalList
        : [];
    const trendChartData = formatSignal2ChartData(trendSourceList);
    const recentBeatData = trendChartData.xyData.filter((item: any) => item?.second?.timestamp >= oneHourAgo);
    const xData = recentBeatData.map((item: any) => `${item.secondDate.slice(-8)}`);
    const yData = recentBeatData.map((item: any) => item.beatTime);
    const xyData = recentBeatData;
    const markLineValue = yData.length
      ? (yData.reduce((total: number, value: number) => total + value, 0) / yData.length) | 0
      : 0;

    // 标准标准小时产能仍然按当天缓存分自然小时统计，不受“趋势只显示最近 1 小时”的限制。
    const hourlyCapacityData = formatHourlyCapacityChartData(stationSignalList, {
      nowTimestamp,
      registrationStartTimestamp: startDate.getTime(),
    });



    stationBeatChartData3.xData = hourlyCapacityData.xData;
    stationBeatChartData3.yData = hourlyCapacityData.yData;
    stationBeatChartData3.xyData = hourlyCapacityData.xyData;

    if (chartType.value != "normal" && chartType.value != "hour") {
      const max = parseInt(chartType.value);

      function generateArray(max: number, total = 120) {
        const result: number[] = [];
        let start = max;

        while (start <= total) {
          result.push(start);
          start += max;
        }

        return result;
      }

      const newXData = generateArray(max);
      const counts: number[] = Array(newXData.length).fill(0);
      let errorList = 0;

      for (const val of yData) {
        if (val > 120) {
          errorList += 1;
          continue;
        }

        for (let i = 0; i < newXData.length; i++) {
          const start = i === 0 ? 0 : newXData[i - 1];
          const end = newXData[i];

          if (i === newXData.length - 1) {
            if (val >= start && val <= end) {
              counts[i] += 1;
              break;
            }
          } else if (val >= start && val < end) {
            counts[i] += 1;
            break;
          }
        }
      }

      stationBeatChartData2.xData = [...newXData, "大于120"];
      stationBeatChartData2.yData = [...counts, errorList];
    }

    stationBeatChartData.xyData = xyData;
    stationBeatChartData.xData = xData;
    stationBeatChartData.yData = yData;
    stationBeatChartData.standardBeat = lineBeatBaseValue.value || 0;
    stationBeatChartData.markLineValue = markLineValue;
    stationBeatChartData.todayRecordsTotal = validStationSignalList.length;

    // 平均节拍始终从节拍排行原始数据读取，不能依赖右侧当前显示模式。
    let value = allStationBeatRankRaw.value.find(
      (item) => item.virtualStationInfo?.id === selectVirtualStationInfo.value?.id
    );
    if (!value) {
      value = formatSignalAllStationRankData(todayAllStationSignalList.value).xyData.find(
        (item) => item.virtualStationInfo?.id === selectVirtualStationInfo.value?.id
      );
    }
    stationBeatChartData.average = value?.average || 0;

    if (lastData == 0) {
      lastData = yData[yData.length - 1];
    }

    // 异常次数接口只在首次渲染/切换岗位时读取；实时刷新不再重复拉同一份数据。
    const exceptionKey = `${registrationInfo.value?.id || 0}:${selectVirtualStationInfo.value?.id || 0}`;
    if (lastExceptionQueryKey.value !== exceptionKey) {
      let data2 = await getOutOfAverage({
        registrationId: (registrationInfo.value?.id as number) || 0,
        virtualStationId: (selectVirtualStationInfo.value?.id as number) || 0,
      });
      if (!data2) data2 = "0_0";
      const [, count] = data2.split("_");
      exceedAvgCount.value = Number(count) || 0;
      lastExceptionQueryKey.value = exceptionKey;
    }

    const lastX = xData[xData.length - 1];
    const timestamp = lastX ? new Date(`${dayjs().format("YYYY-MM-DD")} ${lastX}`).getTime() : Date.now();

    if (isFisrt.value) {
      isFisrt.value = false;
      return;
    }

    setTimeout(async () => {
      const latestBeat = yData[yData.length - 1];
      if (latestBeat > stationBeatChartData.average && lastData !== latestBeat && lastData !== 0) {
        if (!lastData) return;

        exceedAvgCount.value += 1;
        const maxLimit = Number(virtualLineInfo?.value?.standardBeat) || 0;
        const currentCount = Number(exceedAvgCount.value) || 0;
        if (!maxLimit) return;

        lastData = latestBeat;
        const registrationdata = {
          virtualStationId: selectVirtualStationInfo.value?.id as number,
          registrationId: registrationInfo.value?.id as number,
          timestamp,
        };
        await addOutOfAverage(registrationdata);

        if (currentCount > maxLimit) {
          const addData = {
            registrationId: registrationInfo.value?.id as number,
            virtualStationId: selectVirtualStationInfo.value?.id as number,
            standardBeat: virtualLineInfo?.value?.standardBeat,
            singleConSum: lastData,
            sumAvg: stationBeatChartData.average,
            exDesc: `【${registrationInfo.value?.lineInfo.lineName}-${selectVirtualStationInfo.value?.virtualStationName}】单次作业时间超出平均值预设上限`,
            timestamp,
          };
          await beatExceptionAdd(addData);
        }
      }
    }, 100);
  }

  /** 获取当天全工位信号数据 */
  async function toGetAllStationSignal() {
    const rInfo = registrationInfo.value!!;
    const isPDX = isPDXLine(lineInfo.value?.lineType);
    const { lineId } = rInfo;

    // 当前页面所有“当天”图表共用这一份数据，只初始化请求一次。
    const now = new Date();
    const startDate = formatDateByDayjs(now, "YYYY-MM-DD 00:00:00");
    const endDate = formatDateByDayjs(now, "YYYY-MM-DD HH:mm:ss");

    let records: SignalDataInfo[];
    if (isPDX) {
      records = await signalSpecifyDateData({
        type: SubModuleType.SCALE,
        lineId,
        startDate,
        endDate,
      });
      records = transformScale2General(startDate, endDate, records, true);
    } else {
      records = await signalSpecifyDateData({
        type: SubModuleType.GENERAL_INPUT,
        lineId,
        startDate,
        endDate,
      });
    }

    allStationSignalList.value = records;
    todayAllStationSignalList.value = records.slice();
  }

  let lastData = 0;
  const exceedAvgCount = ref<number>(0);
  // 避免实时刷新时重复请求同一岗位的异常累计数据。
  const lastExceptionQueryKey = ref("");
  /** 将节拍排行或平均标准标准小时产能排行写入右侧图表 */
  function applyStationRankChartData() {
    const hourMode = isHourRank.value;
    const valueKey = hourMode ? "averageHourlyCapacity" : "average";
    const source = hourMode ? allStationHourlyCapacityRankRaw.value : allStationBeatRankRaw.value;

    const sortedList = source
      .slice()
      .filter((item) => Number.isFinite(Number(item[valueKey])))
      .sort((a, b) => Number(a[valueKey]) - Number(b[valueKey]));

    const values = sortedList.map((item) => Number(item[valueKey]) || 0);
    const labels = sortedList.map((item) => getVirtualStationText(item.virtualStationInfo));

    // 节拍越低越好；标准标准小时产能越高越好。分别标记前三名。
    const highlightedIndexes = new Set<number>();
    if (hourMode) {
      const startIndex = Math.max(0, values.length - 3);
      for (let i = startIndex; i < values.length; i++) highlightedIndexes.add(i);
    } else {
      for (let i = 0; i < Math.min(3, values.length); i++) highlightedIndexes.add(i);
    }

    const seriesData = values.map((value, index) =>
      highlightedIndexes.has(index)
        ? {
            value,
            itemStyle: {
              color: "#ff5f5f",
            },
          }
        : value
    );

    allStationBeatChartData.xyData = sortedList;
    allStationBeatChartData.xData = labels;
    allStationBeatChartData.yData = hourMode ? seriesData : values;
    allStationBeatChartData.markLineValue = values.length
      ? numberToFixed(values.reduce((total, value) => total + value, 0) / values.length)
      : 0;
  }

  /** 渲染全工位节拍排行及平均标准标准小时产能排行 */
  async function toRenderAllStationBeatData() {
    const records = allStationSignalList.value;

    // 原岗位节拍排行仍保留，供普通模式和线平衡计算使用。
    const beatRankData = formatSignalAllStationRankData(records);
    allStationBeatRankRaw.value = beatRankData.xyData;

    const validBeatList = beatRankData.xyData.filter((item) => Number.isFinite(Number(item.average)));
    if (validBeatList.length) {
      const maxBeatItem = validBeatList.reduce((maxItem, item) =>
        Number(item.average) > Number(maxItem.average) ? item : maxItem
      );
      lineBeatChartData.maxLabel = getVirtualStationText(maxBeatItem.virtualStationInfo);
    } else {
      lineBeatChartData.maxLabel = "";
    }

    // 标准标准小时产能使用当天完整数据，不受生产登记开始时间限制。
    const nowTimestamp = Date.now();
    const hourlyRankData = formatSignalAllStationHourlyCapacityRankData(todayAllStationSignalList.value, {
      nowTimestamp,
    });
    allStationHourlyCapacityRankRaw.value = hourlyRankData.xyData;

    applyStationRankChartData();
  }
  /** 渲染线体线平衡趋势 */
  async function toRenderLineBalanceBeatData() {
    const records = allStationSignalList.value;

    // 岗位排行已在 renderAllChart 前一步计算完成，线平衡直接复用，避免再次格式化全天信号。
    allStationBeatRaw.value = allStationBeatRankRaw.value;

    // console.log(xyData);

    // 2、线平衡 - 数据分析 新开一个作用域
    {
      const data2 = formatBalanceListChartData(records);
      // console.log(data2);
      const { xData, yData, xyData, markLineValue } = data2;
      lineBalanceChartData.xyData = xyData;
      lineBalanceChartData.xData = xData;
      lineBalanceChartData.yData = yData;

      // 线平衡原计算公式 间隔时间和/总数
      // lineBalanceChartData.markLineValue = markLineValue || 0;

      // 线平衡新计算公式 岗位节拍排行去算/总数
      const wholeAllStationData = allStationBeatRaw.value;

      // 剔除无效工位
      const allStationData = wholeAllStationData.filter((i) => i.average);

      const lineAvgSum = allStationData.reduce((total, prev) => total + prev.average, 0);
      const maxAverageBeat = Math.max(...allStationData.map((i) => i.average));
      const stationTotal = allStationData.length;

      let lineBalance = (lineAvgSum / (maxAverageBeat * stationTotal)) * 100;
      lineBalance = numberToFixed(lineBalance || 0);
      // console.log({ lineBalanceChartData, allStationData, lineAvgSum, maxAverageBeat, stationTotal });

      lineBalanceChartData.stationTotal = stationTotal;
      lineBalanceChartData.lineAvgSum = lineAvgSum;
      lineBalanceChartData.maxAverageBeat = maxAverageBeat;
      lineBalanceChartData.markLineValue = lineBalance;
    }

    // 3、同步线体排行表单,按平均节拍 降序
    updateStationRankSource("average", "descend");

    close();
  }

  /** 工位排行页码回调 */
  function onStationRankChange(pageNo: number) {
    stationRankData.pageNo = pageNo;
  }

  /** 工位排行表单变化 */
  // function handleRankTableChange(pagination: any, filters: any, sorter: any) {
  //   const { field, order } = sorter;
  //   updateStationRankSource(field, order);
  // }

  /** 基于字段和排序重排排名数据 */
  function updateStationRankSource(field?: string, order?: string) {
    // 浅拷贝
    let l = allStationBeatRaw.value.slice();

    // 剔除节拍为0的条目
    l = l.filter((i) => i.average !== 0);

    if (!order) {
      stationRankSource.value = l;
      return;
    }

    if (order === "ascend") {
      // 升序
      l.sort((a, b) => a[field!!] - b[field!!]);
    } else {
      // 降序
      l.sort((a, b) => b[field!!] - a[field!!]);
    }

    stationRankSource.value = l;
  }
  /** 进入全屏 */
  const enterFullscreen = () => {
    isFullscreen.value = true;
  };

  /** 退出全屏 */
  const exitFullscreen = () => {
    isFullscreen.value = false;
  };

  /** ESC 退出 */
  const handleEsc = (e) => {
    if (e.key === "Escape" && isFullscreen.value) {
      exitFullscreen();
    }
  };

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleEsc);
  });

  /** 宽高自适应 */
  const realChartWidth = computed(() => {
    return isFullscreen.value ? window.innerWidth : chartWidth;
  });

  const realChartHeight = computed(() => {
    return isFullscreen.value ? window.innerHeight - 56 : chartHeight;
  });
</script>

<style lang="less" scoped>
  .chart1 {
    border-bottom: 1px dashed #ccc;
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
    position: relative;
  }

  /* 工具栏 */
  .chart-toolbar {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 10;
  }

  .chart-toolbar button {
    padding: 4px 10px;
    cursor: pointer;
  }

  /* 全屏状态 */
  .chart1.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #fff;
    padding-top: 40px;
  }
  .chart-wrapper {
    position: relative;
  }

  .chart-actions {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 10;
  }
</style>
