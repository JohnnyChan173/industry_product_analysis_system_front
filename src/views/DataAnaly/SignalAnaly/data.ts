import { computed, reactive } from "vue";
import { themeColor } from "/@/settings/var";
import { genLineBalanceHtml, genSignalChartDataHtml, genDifferenceChartDataHtml } from "../format";
import { useData } from "../useData";

const { registrationStaffSignList, lineInfo } = useData();

// 线体节拍数据
const lineBeatChartData = reactive({
  xData: [] as any[],
  yData: [] as any[],
  xyData: [] as any[],
  loading: false,
  timer: null as any,
  delay: 2000,
  markLineValue: 0,
  maxLabel: "",
  maxStationId: null as number | string | null,
});

// 工位节拍数据
const stationBeatChartData = reactive({
  xData: [] as any[],
  yData: [] as any[],
  xyData: [] as any[],
  loading: false,
  timer: null as any,
  markLineValue: 0,
  average: 0,
  standardBeat: 0,
  todayRecordsTotal: 0,
});
const stationBeatChartData2 = reactive({
  xData: [] as any[],
  yData: [] as any[],
  loading: false,
  timer: null as any,
});

const stationBeatChartData3 = reactive({
  xData: [] as any[],
  /** 自然小时内的实际产量 */
  yData: [] as any[],
  /** 每个小时段异常事件数量 */
  abnormalYData: [] as any[],
  xyData: [] as any[],
  loading: false,
  timer: null as any,
});

// 全部工位节拍排行数据
const allStationBeatChartData = reactive({
  xData: [] as any[],
  yData: [] as any[],
  xyData: [] as any[],
  loading: false,
  markLineValue: 0,
  highlightMaxBeat: true,
});

// 线平衡数据
const lineBalanceChartData = reactive({
  xData: [] as any[],
  yData: [] as any[],
  xyData: [] as any[],
  loading: false,
  markLineValue: 0,

  stationTotal: 0,
  lineAvgSum: 0,
  maxAverageBeat: 0,
});

const chart1Options: any = {
  animation: false,
  grid: {
    left: 40,
    right: 20,
    top: 40,
    bottom: 100, // ⭐ 给 dataZoom + xAxis 留空间
  },
  title: {
    top: 10,
    left: "center",
    textStyle: {
      color: themeColor.primary,
    },
  },
  xAxis: {
    axisLabel: {
      interval: 0,
      formatter(value: string, index: number) {
        const stationId = lineBeatChartData.xyData[index]?.virtualStationInfo?.id;
        if (
          stationId != null &&
          lineBeatChartData.maxStationId != null &&
          String(stationId) === String(lineBeatChartData.maxStationId)
        ) {
          return `{maxBeat|${value}}`;
        }
        return value;
      },
      rich: {
        maxBeat: {
          color: "#ff4d4f",
          fontWeight: "bold",
        },
      },
    },
  },
  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      // start: lineBalanceChartData.xData.length > 15 ? 60 : 0,
      // end: 100, // 初始展示40%
      // height: 20,
      // fillerColor: "rgba(17, 100, 210, 0.42)", // 滚动条颜色
      // borderColor: "rgba(17, 100, 210, 0.12)",
      // handleSize: 0, // 两边手柄尺寸
      // showDetail: true, // 拖拽时是否展示滚动条两侧的文字
      // top: "90%",

      zoomLock: false, // 是否只平移不缩放
      // moveOnMouseMove: true, //鼠标移动能触发数据窗口平移
      // zoomOnMouseWheel: true, //鼠标移动能触发数据窗口缩放
    },
  ],
  tooltip: {
    trigger: "axis",
    formatter(params: any) {
      // console.log(params);
      const records = lineBeatChartData.xyData;
      const { dataIndex } = params[0];
      const data = records[dataIndex];

      const { beatTime, virtualStationInfo } = data;
      const { stationInfo, virtualStationName } = virtualStationInfo;
      const { stationNo, stationName } = stationInfo;

      // 获取虚拟工位 员工信息
      const rsl = registrationStaffSignList.value;
      const staffSignInfo = rsl?.find((i) => i.virtualStationId === virtualStationInfo.id);
      const staffInfo = staffSignInfo?.staffInfo;

      // console.log(data);

      //  兼容空数据
      if (!beatTime) {
        return `
            </p>
              <span style="width: 120px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">工位信息: </span>
              <span style="color: #1890ff">${stationName}-${virtualStationName}</span>
            </p>
            </p>
              <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">员工信息: </span>
              <span style="color: #1890ff">${staffInfo?.staffName || ""}</span>
            </p>
            <p style="margin-left:6px;color: #c18020">(暂无信号)</p>`;
      } else {
        const html = genSignalChartDataHtml(data);
        return html;
      }
    },
  },
};

const chart2Options: any = computed(() => ({
  animation: false,
  grid: {
    left: 40,
    right: 80,
    top: 40,
    bottom: 100, // ⭐ 给 dataZoom + xAxis 留空间
  },
  yAxis: {
    max: function (value: any) {
      const maxValue = Number(value?.max || 0);
      const rawMax = maxValue + Math.max(30, maxValue * 0.28);

      if (rawMax <= 100) return Math.ceil(rawMax / 10) * 10;
      if (rawMax <= 500) return Math.ceil(rawMax / 50) * 50;
      return Math.ceil(rawMax / 100) * 100;
    },
  },
  title: {
    top: 10,
    left: "center",
  },
  series: [
    {
      type: "line",
    },
    {
      type: "line",
      markLine: {
        symbol: "none", // 不显示箭头
        data: [
          {
            name: "固定红线",
            yAxis: stationBeatChartData.average, // ⚡ 用 localStorage 的值
            lineStyle: {
              color: "red", // 红色
              type: "solid",
              width: 2,
            },
            label: {
              show: true,
              color: "red",
              formatter: `平均:${stationBeatChartData.average.toFixed(2)}`,
              position: "end",
            },
          },
          {
            name: "标准节拍",
            yAxis: stationBeatChartData.standardBeat, // ⚡ 用 localStorage 的值
            lineStyle: {
              color: "blue", // 绿色
              type: "solid",
              width: 2,
            },
            label: {
              show: true,
              color: "blue",
              formatter: `标准:${stationBeatChartData.standardBeat.toFixed(0)}`,
              position: "end",
            },
          },
        ],
      },
    },
  ],
  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      zoomLock: false,
    },
  ],
  tooltip: {
    trigger: "axis",
    formatter(params: any) {
      // console.log(params);
      const records = stationBeatChartData.xyData;
      const { dataIndex } = params[0];
      const data = records[dataIndex];

      const html = genSignalChartDataHtml(data);
      return html;
    },
  },
}));

// const productModelInfo = computed(() => productModelList.raw.find((i) => i.id === productModelId.value));

const chart3Options = computed(() => ({
  grid: {
    left: 60,
    right: 30,
    bottom: 100,
    top: "10%",
  },
  xAxis: {
    name: "",
    type: "category",
    data: allStationBeatChartData.xData,
    axisLine: {
      show: true,
    },
    axisLabel: {
      interval: 0,
      formatter(value: string, index: number) {
        const stationId = allStationBeatChartData.xyData[index]?.virtualStationInfo?.id;
        if (
          allStationBeatChartData.highlightMaxBeat &&
          stationId != null &&
          lineBeatChartData.maxStationId != null &&
          String(stationId) === String(lineBeatChartData.maxStationId)
        ) {
          return `{maxBeat|${value}}`;
        }
        return value;
      },
      rich: {
        maxBeat: {
          color: "#ff4d4f",
          fontWeight: "bold",
        },
      },
    },
  },
  title: {
    top: 0,
    left: "center",
  },
  // X轴展示岗位标签，Y轴展示节拍/产能数据
  yAxis: {
    name: "",
    type: "value",
  },
  series: [
    {
      type: "bar",
      data: allStationBeatChartData.yData,
      label: {
        show: true,
        position: "top",
      },
      barMaxWidth: 24,
    },
  ],
  dataZoom: [
    {
      type: "slider",
      xAxisIndex: 0,
      bottom: 20,
      height: 20,
      // start: 0,
      // end: 40,
    },
    {
      type: "inside",
      xAxisIndex: 0,
    },
  ],
  tooltip: {
    trigger: "axis",
    formatter: (params: any) => {
      const { dataIndex } = params[0];
      const data = allStationBeatChartData.xyData[dataIndex];
      if (!data) return "";

      const stationName = data.name || "";
      if (data.averageHourlyCapacity !== undefined) {
        const rows = [
          `岗位：${stationName}`,
          `平均标准小时产能：${data.averageHourlyCapacity} 件`,
          `当天实际产量：${data.actualCount} 件`,
          `参与平均小时数：${data.activeHourCount}`,
        ];

        return rows.join("<br/>");
      }

      return [
        `岗位：${stationName}`,
        `平均节拍：${data.average || 0} 秒`,
        `有效节拍数量：${data.count || 0}`,
      ].join("<br/>");
    },
  },
}));

const chart4Options = computed(() => {
  // 从 localStorage 获取阈值，如果没有则默认 50
  const targetValue = Number(localStorage.getItem("targetLineBalance") || 0);

  return {
    grid: {
      left: "80px",
      right: "12%",
      bottom: "20%",
      top: "10%",
    },
    title: {
      top: 10,
      left: "center",
    },
    yAxis: [
      {
        nameGap: 20,
        max: 100,
      },
    ],
    series: [
      {
        type: "line",
        markLine: {
          symbol: "none", // 不显示箭头
          data: [
            {
              name: "固定红线",
              yAxis: targetValue, // ⚡ 用 localStorage 的值
              lineStyle: {
                color: "red", // 红色
                type: "solid",
                width: 2,
              },
              label: {
                show: true,
                color: "red",
                formatter: ` ${targetValue}%`,
                position: "end",
              },
            },
          ],
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      formatter(params: any) {
        const records = lineBalanceChartData.xyData;
        const { dataIndex } = params[0];
        const data = records[dataIndex];
        const data2 = records[dataIndex + 1];

        const html = genLineBalanceHtml(data, data2);
        return html;
      },
    },
    dataZoom: [
      {
        type: "inside",
      },
      {
        type: "slider",
        realtime: true,
        zoomLock: false,
      },
    ],
  };
});

const chart5Options = computed(() => ({
  title: {
    top: 0,
    left: "center",
  },
  tooltip: {
    trigger: "axis",
    formatter: (params: any) => {
      const item = params[0];
      return `区间:${item.axisValue}秒<br/>数量: ${item.data}`;
    },
  },
  xAxis: {
    type: "category",
    // data: xAxisLabels,
    name: "区间",
    axisLabel: {
      interval: 0, // ⭐ 强制显示所有 label
      rotate: 0,
      hideOverlap: false, // ⭐ 不自动隐藏重叠
    },
  },
  yAxis: {
    type: "value",
    name: "数量",
    minInterval: 1,
  },
  grid: {
    left: "10%",
    right: "10%",
    bottom: "20%",
  },
  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      zoomLock: false,
    },
  ],
  series: [
    {
      type: "bar",
      // data: counts,
      barMaxWidth: 40,
      itemStyle: {
        color: themeColor.beat, // 你的颜色
      },
      label: {
        show: true,
        position: "top",
      },
    },
  ],
}));

const chartHourOptions = computed(() => ({
  title: {
    top: 0,
    left: "center",
  },
  // legend: {
  //   top: 40,
  //   right: 20,
  //   // data: ["标准小时产能", "异常事件"],
  //   data: ["标准小时产能"],
  // },
  grid: {
    left: 55,
    right:80,
    top: 65,
    bottom: 100,
  },
  tooltip: {
    trigger: "axis",
    formatter: (params: any) => {
      const param = Array.isArray(params) ? params[0] : params;
      const dataIndex = Number(param?.dataIndex || 0);
      const data = stationBeatChartData3.xyData[dataIndex];

      if (!data) return "";

      const formatBeatTime = (value: number | null | undefined) =>
        value === null || value === undefined ? "--" : `${value} 秒`;

      const rows = [
        `时段：${data.label}`,
        `标准小时产能：${data.standardHourlyCapacity} 件/小时`,
        `实际产量：${data.actualCount} 件`,
        `最小用时：${formatBeatTime(data.minBeatTime)}`,
        `最大用时：${formatBeatTime(data.maxBeatTime)}`,
        `平均用时：${formatBeatTime(data.averageBeatTime)}`,
        // `<span style="color:#ff4d4f">异常事件：${data.abnormalCount || 0} 次</span>`,
        `统计时长：${data.coveredMinutes} 分钟`,
      ];

      return rows.join("<br/>");
    },
  },
  xAxis: {
    type: "category",
    name: "时段",
    axisLabel: {
      interval: 0,
      hideOverlap: false,
    },
  },
  yAxis: {
    type: "value",
    name: "标准小时产能(件)",
    minInterval: 1,
  },
  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      zoomLock: false,
    },
  ],
  series: [
    {
      name: "标准小时产能",
      type: "bar",
      barMaxWidth: 36,
      itemStyle: {
        color: themeColor.beat,
      },
      label: {
        show: true,
        position: "top",
      },
    },
    // {
    //   name: "异常事件",
    //   type: "bar",
    //   data: stationBeatChartData3.abnormalYData,
    //   barMaxWidth: 24,
    //   barMinHeight: 2,
    //   itemStyle: {
    //     color: "#ff4d4f",
    //   },
    //   label: {
    //     show: true,
    //     position: "top",
    //     color: "#ff4d4f",
    //     formatter: (params: any) => {
    //       const value = Number(params?.value || 0);
    //       return value > 0 ? String(value) : "";
    //     },
    //   },
    // },
  ],
}));

const chart6Options = computed(() => ({
  title: {
    top: 0,
    left: "center",
  },
  grid: {
    left: 40,
    right: 45,
    top: 40,
    bottom: 100, // ⭐ 给 dataZoom + xAxis 留空间
  },
  tooltip: {
    trigger: "axis",
    formatter(params: any) {
      const records = stationBeatChartData.xyData;
      const { dataIndex } = params[0];
      const data = records[dataIndex];
      console.log(data);
      return genDifferenceChartDataHtml(data);
    },
  },
  xAxis: {
    type: "category",
    name: "区间",
    axisLabel: {
      rotate: 0,
      hideOverlap: true, // ⭐ 不自动隐藏重叠
    },
  },
  yAxis: {
    type: "value",
    name: "数量",
    minInterval: 1,
  },
  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      zoomLock: false,
    },
  ],
  series: [
    {
      type: "bar",
      // data: counts,
      barMaxWidth: 40,
      itemStyle: {
        color: themeColor.beat, // 你的颜色
      },
      label: {
        show: true,
        position: "top",
      },
    },
    {
      type: "line",
      markLine: {
        symbol: "none", // 不显示箭头
        data: [
          {
            name: "标准工时",
            yAxis: 75, // ⚡ 用 localStorage 的值
            lineStyle: {
              color: "#727cff", // 红色
              type: "solid",
              width: 2,
            },
            label: {
              show: true,
              color: "#727cff",
              formatter: ` ${75}`,
              position: "end",
            },
          },
        ],
      },
    },
  ],
}));

export function useChartData() {
  return {
    lineBeatChartData,
    stationBeatChartData,
    allStationBeatChartData,
    lineBalanceChartData,
    stationBeatChartData2,
    stationBeatChartData3,
    chart1Options,
    chart2Options,
    chart3Options,
    chart4Options,
    chart5Options,
    chartHourOptions,
    chart6Options,
  };
}
