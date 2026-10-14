<template>
  <div class="chart1">
    <ChartBar
      :width="480"
      :height="760"
      :title="_getData3Title()"
      xLabel="平均节拍"
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
    <div class="flex" style="justify-content: flex-end">
      <Button type="primary" @click="handleExport">导出</Button>
    </div>
  </div>
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
  } from "ant-design-vue";
  import { StationInfo } from "/@/api/model/station";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import DateGroup from "/@/components/Application/DateGroup.vue";
  import { IntervalHandle } from "/#/global";
  import * as XLSX from "xlsx";

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
  import {
    formatSignal2ChartData,
    formatSignalStations,
    formatSignalStationsRealTimeChartData,
    formatSignalAllStationRankData,
    formatBalanceListChartData,
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
  import {
    formatRegistrationEndDate,
    formatRegistrationStartDate,
    getVirtualStationText,
    isPDXLine,
  } from "/@/config/parse";

  const emits = defineEmits(["lineChartStationClick"]);
  const props = defineProps<{
    info: any;
  }>();
  defineExpose({
    reRenderAllChart,
    pausePanel,
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
  } = useData();

  const {
    lineBeatChartData,
    stationBeatChartData,
    stationBeatChartData2,
    allStationBeatChartData,
    lineBalanceChartData,
    chart3Options,
  } = useChartData();

  const searchParams = parseSearch();
  const appStore = useAppStore();

  const chartWidth = computed(() => panelWholeWidth.value * 0.65);
  const chartHeight = 340;
  const panelRightWidth = computed(() => panelWholeWidth.value * 0.35);
  // const stationBeatChartData2 = ref({});
  const isFullscreen = ref(false);
  const chartType = ref("normal");
  // 线体实时节拍数量
  const lineBeatCount = 3;

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

  // 线体排行表单
  const { dataSource: stationRankSource, columns: stationRankColumns } = useStationRankTable();

  // 全部工位顺序数据
  const allStationBeatRankRaw = ref<any[]>([]);

  // 最新全部工位信号数据
  const allStationSignalList = ref<SignalDataInfo[]>([]);

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

  /** 暂停渲染 */
  async function pausePanel() {
    closeLineDataInterval();
  }

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
      await toRenderLineBeatData();
      // if (rInfo && rInfo.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
      //   // 开启轮询
      //   openLineDataInterval();
      // } else {
      //   // 请求一次(渲染工位列表)
      //   renderRealTimeStationList();
      //   closeLineDataInterval();
      // }
    } else {
      // 关闭轮询
      closeLineDataInterval();
    }

    close();
  }
  function autoFitColumns(data: any[], headers: string[]) {
    if (!data.length) return [];
    const colWidths = headers.map((header) => header.length); // 初始化为表头长度
    data.forEach((row) => {
      headers.forEach((header, i) => {
        const cellValue = row[header] ? row[header].toString() : "";
        colWidths[i] = Math.max(colWidths[i], cellValue.length);
      });
    });
    return colWidths.map((width) => ({ wch: Math.min(width + 2, 50) })); // 加一点边距，并限制最大宽度
  }
  const handleExport = () => {
    console.log(regChartData, allStationBeatChartData);

    Modal.confirm({
      title: `确认导出工时采集数据？`,
      content: "会导出当前工时采集数据",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        // 导出数据
        // exportData();
        const stationNameMap = new Map<string, string>();

        allStationBeatChartData.xyData.forEach((item: any) => {
          const stationId = item?.virtualStationInfo?.stationId;
          const stationName = item?.virtualStationInfo?.virtualStationName;

          if (stationId !== null && stationId !== undefined) {
            stationNameMap.set(String(stationId), stationName || "");
          }
        });

        const data = regChartData.timestampList.map((v, index) => {
          const signal = regChartData.xData[index];
          const stationId = signal?.stationId;

          const stationName =
            stationId !== null && stationId !== undefined ? stationNameMap.get(String(stationId)) || "" : "";

          return {
            产线编号: lineInfo.value!!.lineNo,
            关联车间: lineInfo.value!!.workshopInfo.workshopNo,
            生产产线: lineInfo.value!!.lineName,
            线长: lineInfo.value!!.lineLeaderStaffInfo?.staffName || "/",
            工位名称: stationName,
            登记编号: registrationInfo.value!!.registrationNo,
            生产产品: registrationInfo.value!!.productInfo.productName,
            登记开始时间: formatDateByDayjs(props.info!!.startDate, "YYYY-MM-DD HH:mm:ss"),
            登记结束时间: props.info!!.endDate ? formatDateByDayjs(props.info!!.endDate, "YYYY-MM-DD HH:mm:ss") : "/",
            节拍开始时间: formatDateByDayjs(v, "YYYY-MM-DD HH:mm:ss"),
            节拍结束时间: formatDateByDayjs(v + regChartData.yData[index] * 1000, "YYYY-MM-DD HH:mm:ss"),
            节拍: regChartData.yData[index],
          };
        });
        const headers = [
          "产线编号",
          "关联车间",
          "生产产线",
          "线长",
          "工位名称",
          "登记编号",
          "生产产品",
          "登记开始时间",
          "登记结束时间",
          "节拍开始时间",
          "节拍结束时间",
          "节拍",
        ];
        const colWidths = autoFitColumns(data, headers);
        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet["!cols"] = colWidths;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "工时采集");
        XLSX.writeFile(
          workbook,
          `工时采集-${props.info!!.registrationNo}-${props.info!!.startDate}-${props.info!!.endDate}.xlsx`
        );
      },
    });
    // console.log(regChartData);
  };
  /** 清除全部图表 */
  async function clearAllChart() {
    stationBeatChartData.xyData = [];
    stationBeatChartData.xData = [];
    stationBeatChartData.yData = [];

    lineBeatChartData.xyData = [];
    lineBeatChartData.xData = [];
    lineBeatChartData.yData = [];

    allStationBeatChartData.xyData = [];
    allStationBeatChartData.xData = [];
    allStationBeatChartData.yData = [];

    lineBalanceChartData.xyData = [];
    lineBalanceChartData.xData = [];
    lineBalanceChartData.yData = [];

    currentDate.value = "";
  }

  /** 渲染全部图表 */
  async function renderAllChart() {
    // 渲染单工位数据【岗位节拍趋势】
    await toRenderStationBeatData();

    // 渲染全线体工位数据【岗位节拍排行】
    console.log("-------s2:" + Date.now());
    await toRenderAllStationBeatData();
    console.log("-------e2:" + Date.now());

    // 渲染线平衡数据【线平衡】
    console.log("-------s3:" + Date.now());
    await toRenderLineBalanceBeatData();
    console.log("-------e3:" + Date.now());
  }

  /** 岗位统计-是否是慢速岗位 */
  function isAverageDanger(index: number) {
    const { pageNo } = stationRankData;
    if (pageNo === 1 && index < 3) {
      return true;
    }
  }

  /** 线体节拍 x轴点击 */
  async function handleLineChartClick(params: any) {
    const { componentType, dataIndex } = params;

    if (componentType === "xAxis") {
      const info = lineBeatChartData.xyData[dataIndex];
      const {
        virtualStationInfo: { id },
      } = info;

      if (id) {
        selectVirtualStationId.value = id;
        await toRenderStationBeatData();
      }
    }
  }

  /** 打开实时数据轮询 */
  async function openLineDataInterval() {
    // 请求一次
    await toRenderLineBeatData();

    // 开始轮询
    clearInterval(lineBeatChartData.timer);
    lineBeatChartData.timer = setInterval(async () => {
      toRenderLineBeatData();
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

  /** 获取 图表2标题 */
  function _getData2Title() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    const sd = registrationStartDate.value;

    let stationText = "";

    if (vid && vInfo) {
      const {
        virtualStationName,
        stationInfo: { stationNo },
      } = vInfo;

      stationText = `${stationNo}-${virtualStationName}`;
    }

    return `【${stationText}】- ${sd} 节拍趋势`;
  }
  function _getData5Title() {
    const vid = selectVirtualStationId.value;
    const vInfo = selectVirtualStationInfo.value;
    const sd = registrationStartDate.value;

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

  /** 获取 图表3标题 */
  function _getData3Title() {
    const info = lineInfo.value;
    const sd = registrationStartDate.value;

    if (info) {
      return `【${info.lineName}】${formatDateByDayjs(props.info.startDate, "YYYY-MM-DD")}-岗位节拍排行`;
    } else {
      return "";
    }
  }

  /** 获取 图表4标题 */
  function _getData4Title() {
    const info = lineInfo.value;
    const sd = registrationStartDate.value;

    if (info) {
      return `【${info.lineName}】${sd}-线平衡`;
    } else {
      return "";
    }
  }
  const recordsData = ref<SignalDataInfo[]>([]);
  /** 渲染产线实时节拍 */
  async function toRenderLineBeatData() {
    const lid = lineId.value!!;
    const rInfo = registrationInfo.value!!;
    const isPDX = isPDXLine(lineInfo.value?.lineType);

    // 更新当前时间
    const date = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
    currentDate.value = date;

    // 开始时间不能小于登记时间
    const regStartDate = new Date(registrationInfo.value?.startDate!!);

    let records: SignalDataInfo[] = [];
    const recordStartDate = Math.max(regStartDate.getTime(), Date.now() - lineBeatBaseDouble.value * 1000);
    const startDate = formatDateByDayjs(recordStartDate, "YYYY-MM-DD HH:mm:ss");
    const endDate = formatRegistrationEndDate(rInfo);
    console.log(startDate, endDate);
    if (isPDX) {
      // 皮带线 按需取信号 二次尝试！！
      records = await signalSpecifyDateData({
        type: SubModuleType.SCALE,
        lineId: lid,
        startDate,
        endDate,
      });
      // recordsData.value = record;
      // ★ 加入重量信号转通用输入逻辑
      records = transformScale2General(startDate, endDate, records, false);
    } else {
      // 请求指定时间内的节拍数据
      records = await signalSpecifyDateData({
        type: SubModuleType.GENERAL_INPUT,
        lineId: lid,
        startDate,
        endDate,
        count: lineBeatCount,
      });
    }
    console.log(records);
    recordsData.value = records;
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
      // 合并信号量数据
      composeSignalList(records);

      await renderAllChart();
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

  /** 合并信号量数据 */
  function composeSignalList(records: SignalDataInfo[]) {
    const oldList = allStationSignalList.value.slice();

    // 数据去重
    const formatRecords = records.filter(
      (i) => !oldList.find((j) => j.timestamp === i.timestamp && j.stationId === i.stationId)
    );

    // 找最新找 stationId
    for (let i = 0; i < formatRecords.length; i++) {
      const signal = formatRecords[i];
      const sid = signal.stationId;
      // 找同工位最后一个数据
      const lastSignalIndex = oldList.findLastIndex((j) => j.stationId === sid);

      // 如果找到了
      if (lastSignalIndex > -1) {
        oldList.splice(lastSignalIndex + 1, 0, signal);
      } else {
        // 如果没找到直接插到最后
        oldList.push(signal);
      }
    }
    allStationSignalList.value = oldList;
  }

  /** 渲染工位节拍趋势 */
  async function toRenderStationBeatData() {
    const rInfo = registrationInfo.value!!;
    const lid = lineId.value!!;
    const sid = selectVirtualStationId.value!!;

    if (!sid) {
      stationBeatChartData.xyData = [];
      stationBeatChartData.xData = [];
      stationBeatChartData.yData = [];
      stationBeatChartData.average = 0;
      return;
    }

    // 获取当前虚拟工位详情
    const vsInfo = virtualStationList.value.find((i) => i.id === sid);
    const { stationId } = vsInfo!!;
    selectVirtualStationInfo.value = vsInfo;

    // 从全工位信号量 获取当前工位信号量
    const allSignalList = allStationSignalList.value;
    const records = allSignalList.filter((i) => {
      return i.stationId === stationId && Date.now() - i.timestamp < 60 * 60 * 1000;
    });
    const { xData, yData, xyData, markLineValue } = formatSignal2ChartData(records);
    if (chartType.value != "normal") {
      const max = parseInt(chartType.value);

      // 1️⃣ 生成 newXData（0~120 平均分）
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
      // 2️⃣ 初始化统计数组，长度 = 区间数 = newXData.length - 1
      const counts: number[] = Array(newXData.length).fill(0);
      console.log("newXDatanewXData", newXData);
      let errorList = 0;

      // 3️⃣ 遍历 yData
      for (const val of yData) {
        if (val > 120) {
          errorList += 1;
          continue;
        }

        for (let i = 0; i < newXData.length; i++) {
          let start = i === 0 ? 0 : newXData[i - 1];
          let end = newXData[i];

          // 最后一个区间闭合右端点
          if (i === newXData.length - 1) {
            if (val >= start && val <= end) {
              counts[i] += 1;

              break;
            }
          } else {
            if (val >= start && val < end) {
              counts[i] += 1;
              break;
            }
          }
        }
      }
      // console.log("errorListerrorListerrorListerrorList", counts);
      // console.log("区间分布统计：", counts);
      stationBeatChartData2.xData = [...newXData, "大于120"];
      stationBeatChartData2.yData = [...counts, errorList];
    }
    stationBeatChartData.xyData = xyData;
    stationBeatChartData.xData = xData;
    stationBeatChartData.yData = yData;
    stationBeatChartData.average = yData.reduce((a, b) => a + b, 0) / yData.length;
    console.log(stationBeatChartData.average);
    stationBeatChartData.markLineValue = markLineValue;
  }
  const regChartData = reactive({
    xData: [] as string[],
    yData: [] as number[],
    timestampList: [] as number[],
  });
  /** 获取全工位信号数据 */
  /** 获取全工位信号数据（修复跨工位问题） */
  /** 获取全工位信号数据（修复跨工位问题，并按时序排序） */
  async function toGetAllStationSignal() {
    const rInfo = registrationInfo.value!!;
    const isPDX = isPDXLine(lineInfo.value?.lineType);

    const { lineId } = rInfo;
    const startDate = formatDateByDayjs(props.info.startDate, "YYYY-MM-DD HH:mm:ss");
    const endDate = formatDateByDayjs(props.info.endDate, "YYYY-MM-DD HH:mm:ss");
    console.log(props.info, "===============");

    let records: SignalDataInfo[] = [];

    // 请求指定时间内的数据（按日期）
    if (isPDX) {
      records = await signalSpecifyDateData({
        type: SubModuleType.SCALE,
        lineId,
        startDate,
        endDate,
      });
      // ★ 加入重量信号转通用输入逻辑
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
    console.log(records);

    const { beatMax, beatMin } = lineInfo.value!!;

    // 1. 按工位分组
    const stationGroups = new Map<number, SignalDataInfo[]>();
    for (const signal of records) {
      const sid = signal.stationId;
      if (!stationGroups.has(sid)) {
        stationGroups.set(sid, []);
      }
      stationGroups.get(sid)!.push(signal);
    }

    // 2. 每个工位内排序并计算节拍（暂时存入临时数组）
    const tempList: { beatTime: number; timestamp: number; signal: SignalDataInfo }[] = [];

    for (const [stationId, signals] of stationGroups.entries()) {
      // 按时间升序
      signals.sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 0; i < signals.length - 1; i++) {
        const first = signals[i];
        const second = signals[i + 1];
        let beatTime: number = Math.floor((second.timestamp - first.timestamp) / 1000);

        // 可选：应用工位自定义公式（如果需要，取消注释）
        // const vsInfo = virtualStationList.value.find(vs => vs.stationId === stationId);
        // if (vsInfo?.beatFormat) {
        //   beatTime = numberToFixed(eval(`const x = ${beatTime}; ${vsInfo.beatFormat}`));
        // }

        // 治理数据：无效节拍 或 超出线体上下限
        if (!beatTime || beatTime > beatMax || beatTime < beatMin) {
          continue;
        }

        tempList.push({
          beatTime,
          timestamp: first.timestamp,
          signal: first,
        });
      }
    }

    // 3. 按起始时间戳升序排序
    tempList.sort((a, b) => a.timestamp - b.timestamp);

    // 4. 赋值给 regChartData
    regChartData.yData = tempList.map((item) => item.beatTime);
    regChartData.timestampList = tempList.map((item) => item.timestamp);
    regChartData.xData = tempList.map((item) => item.signal);
  }

  /** 渲染全工位节拍趋势 & 线平衡 */
  async function toRenderAllStationBeatData() {
    const records = allStationSignalList.value;
    const data = formatSignalAllStationRankData(records);

    const { xyData, markLineValue } = data;

    allStationBeatRankRaw.value = xyData;
    // console.log(xyData);
    const l = xyData.slice();

    // 升序
    l.sort((a, b) => b.average - a.average);

    // 重新生成xData,yData
    const xData = l.map((i) => i.average);
    const yData = l.map((i) => getVirtualStationText(i.virtualStationInfo));

    const maxX = Math.max(...xData);
    const maxLabel = getVirtualStationText(l.find((i) => i.average === maxX)?.virtualStationInfo);
    lineBeatChartData.maxLabel = maxLabel;
    const tipXData = xData.slice(0, 3);

    for (let i = 0; i < tipXData.length; i++) {
      const xDataRela = xData as any;
      xDataRela[i] = {
        value: xDataRela[i],
        itemStyle: {
          color: "#ff5f5f",
        },
      };
    }

    allStationBeatChartData.xyData = xyData;
    allStationBeatChartData.xData = yData;
    allStationBeatChartData.yData = xData;
    allStationBeatChartData.markLineValue = markLineValue;
  }

  /** 渲染线体线平衡趋势 */
  async function toRenderLineBalanceBeatData() {
    const records = allStationSignalList.value;

    // 1、岗位统计 - 数据分析
    const data = formatSignalAllStationRankData(records);

    const { xyData, markLineValue } = data;

    allStationBeatRaw.value = xyData;

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
      console.log({ lineBalanceChartData, allStationData, lineAvgSum, maxAverageBeat, stationTotal });

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
