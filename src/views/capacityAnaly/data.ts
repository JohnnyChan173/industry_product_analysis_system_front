import { computed, reactive } from "vue";

export interface MonthlyLineBalanceChartItem {
  virtualLineId: number;
  virtualLineName: string;
  lineId?: number;
  lineName?: string;
  monthAvgRate: number;
}

export interface MonthlyAchievementChartItem {
  virtualLineId: number;
  virtualLineName: string;
  lineId?: number;
  lineName?: string;
  totalActualOutput: number;
  totalPlanOutput: number;
  achievementRate: number;
}

export interface DailyLineBalancePoint {
  day: string;
  dateStr: string;
  dailyAvgRate: number;
  dailyHourlyMaxRate: number;
  dailyHourlyMinRate: number;
}

export interface DailyLineBalanceChartResult {
  virtualLineId: number;
  virtualLineName: string;
  monthlyAvgLineRate: number;
  dailyPointList: DailyLineBalancePoint[];
}

export interface DailyOutputPoint {
  day: string;
  dateStr: number | string;
  dailyOutput: number;
}

export interface DailyOutputChartResult {
  virtualLineId: number;
  virtualLineName: string;
  dailyList: DailyOutputPoint[];
}

interface MonthlyChartData<T> {
  loading: boolean;
  xData: string[];
  yData: number[];
  xyData: T[];
}

const monthlyLineBalanceChartData = reactive<MonthlyChartData<MonthlyLineBalanceChartItem>>({
  loading: false,
  xData: [],
  yData: [],
  xyData: [],
});

const monthlyAchievementChartData = reactive<MonthlyChartData<MonthlyAchievementChartItem>>({
  loading: false,
  xData: [],
  yData: [],
  xyData: [],
});

const dailyLineBalanceChartData = reactive({
  loading: false,
  xData: [] as string[],
  yData: [] as number[],
  maxYData: [] as number[],
  minYData: [] as number[],
  xyData: [] as DailyLineBalancePoint[],
  monthlyAvgLineRate: 0,
});

const dailyOutputChartData = reactive<MonthlyChartData<DailyOutputPoint>>({
  loading: false,
  xData: [],
  yData: [],
  xyData: [],
});

function smartWrap(text: string, maxCharsPerLine = 8) {
  let result = [];
  let currentLine = "";
  let charCount = 0;

  for (let char of text) {
    // 中文字符算2个宽度，英文算1个
    const charWidth = char.charCodeAt(0) > 255 ? 2 : 1;

    if (charCount + charWidth > maxCharsPerLine) {
      result.push(currentLine);
      currentLine = char;
      charCount = charWidth;
    } else {
      currentLine += char;
      charCount += charWidth;
    }
  }

  if (currentLine) result.push(currentLine);
  return result.join("\n");
}

function formatRate(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Number(number.toFixed(2));
}

function createRateAxisMax(value: { max: number }) {
  const maxValue = Math.max(100, Number(value.max || 0));
  return Math.ceil(maxValue / 10) * 10;
}

function createDataZoom(dataLength: number) {
  if (dataLength <= 8) return [];

  return [
    {
      type: "inside",
      xAxisIndex: 0,
    },
    {
      type: "slider",
      xAxisIndex: 0,
      bottom: 10,
      height: 18,
      start: 0,
      end: Math.max(30, Math.floor((8 / dataLength) * 100)),
    },
  ];
}

/** 日维度数据较多时，仅展示一段日期，避免三组柱子挤在一起。 */
function createDailyDataZoom(dataLength: number) {
  if (dataLength <= 12) return [];

  return [
    {
      type: "inside",
      xAxisIndex: 0,
      start: 0,
      end: Math.max(35, Math.floor((12 / dataLength) * 100)),
    },
    {
      type: "slider",
      xAxisIndex: 0,
      bottom: 10,
      height: 16,
      borderColor: "transparent",
      backgroundColor: "#f3f6fa",
      fillerColor: "rgba(79, 127, 240, 0.16)",
      handleStyle: {
        color: "#4f7ff0",
      },
      start: 0,
      end: Math.max(35, Math.floor((12 / dataLength) * 100)),
    },
  ];
}

const baseGrid = {
  left: 80,
  right: 20,
  top: 45,
  bottom: 85,
};

const baseXAxis = {
  type: "category" as const,
  axisTick: {
    alignWithLabel: true,
  },
  axisLabel: {
    interval: 0,
    width: 120,
    overflow: "truncate" as const,
    ellipsis: "...",
    formatter: (value: string) => smartWrap(value),
  },
};

const baseYAxis = {
  type: "value" as const,
  min: 0,
  max: createRateAxisMax,
  axisLabel: {
    formatter: (value: number) => `${value}%`,
  },
  splitLine: {
    lineStyle: {
      color: "#e8e8e8",
    },
  },
};

const baseBarSeries = {
  type: "bar" as const,
  barMaxWidth: 54,
  itemStyle: {
    color: "#4f86e8",
  },
  label: {
    show: true,
    position: "top" as const,
    color: "#4f86e8",
    formatter: ({ value }: { value: number }) => `${formatRate(value)}%`,
  },
};

const monthlyLineBalanceChartOptions = computed(() => ({
  grid: {
    ...baseGrid,
    bottom: monthlyLineBalanceChartData.xData.length > 8 ? 95 : baseGrid.bottom,
  },
  xAxis: {
    ...baseXAxis,
    data: monthlyLineBalanceChartData.xData,
  },
  yAxis: baseYAxis,
  dataZoom: createDataZoom(monthlyLineBalanceChartData.xData.length),
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter(params: any) {
      const param = Array.isArray(params) ? params[0] : params;
      const item = monthlyLineBalanceChartData.xyData[Number(param?.dataIndex ?? -1)];
      if (!item) return "";

      return [
        `虚拟产线：${item.virtualLineName || "/"}`,
        `所属产线：${item.lineName || "/"}`,
        `月均线平衡率：${formatRate(item.monthAvgRate)}%`,
      ].join("<br/>");
    },
  },
  series: [
    {
      ...baseBarSeries,
      name: "月均线平衡率",
      data: monthlyLineBalanceChartData.yData,
    },
  ],
}));

const monthlyAchievementChartOptions = computed(() => ({
  grid: {
    ...baseGrid,
    bottom: monthlyAchievementChartData.xData.length > 8 ? 95 : baseGrid.bottom,
  },
  xAxis: {
    ...baseXAxis,
    data: monthlyAchievementChartData.xData,
  },
  yAxis: baseYAxis,
  dataZoom: createDataZoom(monthlyAchievementChartData.xData.length),
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter(params: any) {
      const param = Array.isArray(params) ? params[0] : params;
      const item = monthlyAchievementChartData.xyData[Number(param?.dataIndex ?? -1)];
      if (!item) return "";

      return [
        `虚拟产线：${item.virtualLineName || "/"}`,
        `所属产线：${item.lineName || "/"}`,
        `实际产量：${Number(item.totalActualOutput || 0)}`,
        `计划产量：${Number(item.totalPlanOutput || 0)}`,
        `产能达成率：${formatRate(item.achievementRate)}%`,
      ].join("<br/>");
    },
  },
  series: [
    {
      ...baseBarSeries,
      name: "月度产能达成率",
      data: monthlyAchievementChartData.yData,
    },
  ],
}));

const dailyLineBalanceChartOptions = computed(() => ({
  grid: {
    left: 70,
    right: 36,
    top: 92,
    bottom: dailyLineBalanceChartData.xData.length > 12 ? 76 : 52,
    containLabel: true,
  },
  legend: {
    top: 38,
    icon: "roundRect",
    itemWidth: 14,
    itemHeight: 8,
    itemGap: 22,
    textStyle: {
      color: "#4e5969",
      fontSize: 12,
    },
    data: ["日均线平衡率", "小时最高线平衡率", "小时最低线平衡率"],
  },
  xAxis: {
    type: "category",
    boundaryGap: true,
    data: dailyLineBalanceChartData.xData,
    name: "日期",
    nameGap: 16,
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: "#cfd6e4",
      },
    },
    axisLabel: {
      interval: 0,
      color: "#657180",
      margin: 12,
    },
  },
  yAxis: {
    ...baseYAxis,
    name: "平衡率(%)",
    nameGap: 18,
    nameTextStyle: {
      color: "#657180",
      padding: [0, 0, 0, 4],
    },
    axisLabel: {
      color: "#657180",
      formatter: (value: number) => `${value}%`,
    },
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      lineStyle: {
        color: "#edf0f5",
        type: "dashed",
      },
    },
  },
  dataZoom: createDailyDataZoom(dailyLineBalanceChartData.xData.length),
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderColor: "#e5eaf2",
    borderWidth: 1,
    textStyle: {
      color: "#4e5969",
    },
    axisPointer: {
      type: "shadow",
      shadowStyle: {
        color: "rgba(79, 127, 240, 0.06)",
      },
    },
    formatter(params: any) {
      const param = Array.isArray(params) ? params[0] : params;
      const item = dailyLineBalanceChartData.xyData[Number(param?.dataIndex ?? -1)];
      if (!item) return "";

      return [
        `日期：${item.dateStr || item.day}`,
        `日均线平衡率：${formatRate(item.dailyAvgRate)}%`,
        `小时最高线平衡率：${formatRate(item.dailyHourlyMaxRate)}%`,
        `小时最低线平衡率：${formatRate(item.dailyHourlyMinRate)}%`,
        `月平均线：${formatRate(dailyLineBalanceChartData.monthlyAvgLineRate)}%`,
      ].join("<br/>");
    },
  },
  series: [
    {
      name: "日均线平衡率",
      type: "bar",
      barMaxWidth: 22,
      barGap: "18%",
      barCategoryGap: "46%",
      z: 3,
      data: dailyLineBalanceChartData.yData,
      itemStyle: {
        color: "#4f7ff0",
        borderRadius: [5, 5, 0, 0],
      },
      label: {
        show: true,
        position: "top",
        distance: 6,
        color: "#4f7ff0",
        fontSize: 10,
        fontWeight: 500,
        formatter: ({ value }: { value: number }) => (Number(value) > 0 ? `${formatRate(value)}%` : ""),
      },
      markLine: {
        symbol: "none",
        silent: true,
        lineStyle: {
          color: "#ff6b6b",
          type: "dashed",
          width: 1,
          opacity: 0.9,
        },
        label: {
          show: true,
          color: "#d94b4b",
          position: "insideEndTop",
          distance: 6,
          padding: [3, 6],
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          formatter: `月平均 ${formatRate(dailyLineBalanceChartData.monthlyAvgLineRate)}%`,
        },
        data:
          dailyLineBalanceChartData.monthlyAvgLineRate > 0
            ? [{ yAxis: dailyLineBalanceChartData.monthlyAvgLineRate }]
            : [],
      },
    },
    {
      name: "小时最高线平衡率",
      type: "bar",
      barMaxWidth: 18,
      z: 2,
      data: dailyLineBalanceChartData.maxYData,
      itemStyle: {
        color: "#f3a34a",
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
          distance: 6,
          position: "top",
          color: "#d98220",
          fontSize: 10,
          formatter: ({ value }: { value: number }) => (Number(value) > 0 ? `${formatRate(value)}%` : ""),
      },

    },
    {
      name: "小时最低线平衡率",
      type: "bar",
      barMaxWidth: 18,
      z: 2,
      data: dailyLineBalanceChartData.minYData,
      itemStyle: {
        color: "#5bb98c",
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        distance: 6,
        position: "top",
        color: "#389a69",
        fontSize: 10,
        formatter: ({ value }: { value: number }) => (Number(value) > 0 ? `${formatRate(value)}%` : ""),
      },
      // emphasis: {
      //   label: {

      //   },
      // },
    },
  ],
}));

const dailyOutputChartOptions = computed(() => ({
  grid: {
    left: 80,
    right: 80,
    top: 45,
    bottom: 55,
  },
  xAxis: {
    type: "category",
    data: dailyOutputChartData.xData,
    name: "日期",
    axisTick: {
      alignWithLabel: true,
    },
    axisLabel: {
      interval: 0,
    },
  },
  yAxis: {
    type: "value",
    min: 0,
    name: "日产量(台)",
    minInterval: 1,
    splitLine: {
      lineStyle: {
        color: "#e8e8e8",
      },
    },
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter(params: any) {
      const param = Array.isArray(params) ? params[0] : params;
      const item = dailyOutputChartData.xyData[Number(param?.dataIndex ?? -1)];
      if (!item) return "";

      return [`日期：${item.dateStr || item.day}`, `日产量：${Number(item.dailyOutput || 0)} 台`].join("<br/>");
    },
  },
  series: [
    {
      ...baseBarSeries,
      name: "日产量",
      barMaxWidth: 28,
      data: dailyOutputChartData.yData,
      label: {
        ...baseBarSeries.label,
        formatter: ({ value }: { value: number }) => Number(value || 0),
      },
    },
  ],
}));

export function setMonthlyLineBalanceChartData(list: MonthlyLineBalanceChartItem[]) {
  monthlyLineBalanceChartData.xyData = list;
  monthlyLineBalanceChartData.xData = list.map((item) => item.virtualLineName || "未命名产线");
  monthlyLineBalanceChartData.yData = list.map((item) => formatRate(item.monthAvgRate));
}

export function setMonthlyAchievementChartData(list: MonthlyAchievementChartItem[]) {
  monthlyAchievementChartData.xyData = list;
  monthlyAchievementChartData.xData = list.map((item) => item.virtualLineName || "未命名产线");
  monthlyAchievementChartData.yData = list.map((item) => formatRate(item.achievementRate));
}

function sortDailyList<T extends { day?: string; dateStr?: number | string }>(list: T[]) {
  return [...list].sort((a, b) => {
    const aValue = Number(a.day || a.dateStr || 0);
    const bValue = Number(b.day || b.dateStr || 0);
    return aValue - bValue;
  });
}

export function setDailyLineBalanceChartData(result?: DailyLineBalanceChartResult | null) {
  const list = sortDailyList(result?.dailyPointList || []);
  dailyLineBalanceChartData.monthlyAvgLineRate = formatRate(result?.monthlyAvgLineRate || 0);
  dailyLineBalanceChartData.xyData = list;
  dailyLineBalanceChartData.xData = list.map((item) => String(item.day || item.dateStr || ""));
  dailyLineBalanceChartData.yData = list.map((item) => formatRate(item.dailyAvgRate));
  dailyLineBalanceChartData.maxYData = list.map((item) => formatRate(item.dailyHourlyMaxRate));
  dailyLineBalanceChartData.minYData = list.map((item) => formatRate(item.dailyHourlyMinRate));
}

export function setDailyOutputChartData(result?: DailyOutputChartResult | null) {
  const list = sortDailyList(result?.dailyList || []);
  dailyOutputChartData.xyData = list;
  dailyOutputChartData.xData = list.map((item) => String(item.day || item.dateStr || ""));
  dailyOutputChartData.yData = list.map((item) => Number(item.dailyOutput || 0));
}

export function clearMonthlyChartData() {
  setMonthlyLineBalanceChartData([]);
  setMonthlyAchievementChartData([]);
}

export function clearDailyChartData() {
  setDailyLineBalanceChartData();
  setDailyOutputChartData();
}

export function useMonthlyCapacityChartData() {
  return {
    monthlyLineBalanceChartData,
    monthlyAchievementChartData,
    monthlyLineBalanceChartOptions,
    monthlyAchievementChartOptions,
    dailyLineBalanceChartData,
    dailyOutputChartData,
    dailyLineBalanceChartOptions,
    dailyOutputChartOptions,
  };
}
