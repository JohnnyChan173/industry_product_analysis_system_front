import { computed, reactive } from "vue";
import { numberToFixed } from "/@/utils/math";

// 线产能
const capacity = reactive({
  rawData: [] as any[],
  xData: [] as any[],
  yData: [] as any[],
});

// 线平衡
const lineBalance = reactive({
  rawData: [] as any[],
  xData: [] as any[],
  yData: [] as any[],
});

// 安灯
const addonEvents = reactive({
  rawData: [] as any[],
  xData: [] as any[],
  yData: [] as any[],
});

const chart1Options = computed(() => ({
  grid: {
    left: "10%",
    right: "10%",
    bottom: "10%",
    top: "10%",
  },
  xAxis: {
    nameLocation: "end",
    nameGap: -80,
    nameTextStyle: {
      verticalAlign: "bottom",
    },
    type: "value",
    axisLine: {
      show: true,
    },
    axisLabel: {
      formatter(value: any) {
        const v = Number(value) * 100;
        const ratio = numberToFixed(v, 0) + "%";
        return ratio;
      },
    },
  },
  // Y轴：横向柱状图，将xAxis的type设置为category
  yAxis: [
    {
      type: "category",
      data: capacity.yData,
    },
  ],
  series: [
    {
      type: "bar",
      data: capacity.xData,
      label: {
        show: true,
        position: "inside",
        fontSize: 13,
        formatter: (params: any) => {
          const { dataIndex } = params;
          const data = capacity.rawData[dataIndex];
          if (data) {
            const { registrationBeatProductNumberTotal, registrationPlanProductNumberTotal } = data;
            const text = `${registrationBeatProductNumberTotal} / ${registrationPlanProductNumberTotal}`;
            return text;
          }
        },
      },
      barMaxWidth: 30,
    },
  ],
  dataZoom: [
    {
      disabled: true,
    },
  ],
  tooltip: {
    valueFormatter: (value: number) => "产能系数-" + numberToFixed(value * 100, 0) + "%",
  },
}));

const chart2Options = computed(() => ({
  grid: {
    left: "10%",
    right: "10%",
    bottom: "12%",
    top: "20%",
  },
  xAxis: {
    data: lineBalance.xData,
    axisLabel: {
      formatter(value: any) {
        return value.slice(-5);
      },
    },
  },
  yAxis: [
    {
      type: "value",
      axisLine: {
        show: true,
      },
      axisTick: {
        show: true,
      },
      axisLabel: {
        formatter(value: any) {
          const v = Number(value) * 100;
          const ratio = numberToFixed(v, 0) + "%";
          return ratio;
        },
      },

      nameGap: 20,
      min: 0,
      max: 1,
      minInterval: 0.25,
      // data: lineBalance.yData,
    },
  ],
  legend: {
    show: true,
    orient: "horizontal",
    top: 30,
  },
  tooltip: {
    trigger: "axis",
    valueFormatter: (value: number) => {
      if (value) {
        return numberToFixed(value * 100, 0) + "%";
      } else {
        return "/";
      }
    },
  },
  series: lineBalance.rawData.map((i) => ({
    type: "line",
    name: i.lineName,
    data: i.formatBalanceRatios,
    label: { show: false },
  })),

  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      start: lineBalance.xData.length > 15 ? 60 : 0,
      end: 100, // 初始展示40%
      height: 3,
      fillerColor: "rgba(17, 100, 210, 0.42)", // 滚动条颜色
      borderColor: "rgba(17, 100, 210, 0.12)",
      handleSize: 0, // 两边手柄尺寸
      showDetail: true, // 拖拽时是否展示滚动条两侧的文字
      bottom: "5%",

      zoomLock: false, // 是否只平移不缩放
      // moveOnMouseMove: true, //鼠标移动能触发数据窗口平移
      // zoomOnMouseWheel: true, //鼠标移动能触发数据窗口缩放
    },
  ],
}));

const chart4Options = computed(() => ({
  grid: {
    left: "10%",
    right: "10%",
    bottom: "12%",
    top: "20%",
  },
  legend: {
    show: true,
    orient: "horizontal",
    top: 30,
  },
  xAxis: {
    type: "category",
    data: ["物料", "设备", "品质", "其他"],
  },
  yAxis: {
    type: "value",
  },
  tooltip: {
    trigger: "axis",
    valueFormatter: (value: number) => "发生 " + value + " 起",
  },
  series: addonEvents.rawData.map((i) => ({
    name: i.lineName,
    type: "bar",
    stack: "sum",
    barMaxWidth: 30,
    // itemStyle: {
    //   color: color[i],
    // },
    label: {
      show: true,
      position: "inside",
      formatter: function (p: any) {
        const { value } = p;
        return value ? value : "";
      },
    },
    data: i.happenCounts,
  })),
}));

export function useChartData() {
  return {
    capacity,
    lineBalance,
    addonEvents,

    chart1Options,
    chart2Options,
    chart4Options,
  };
}
