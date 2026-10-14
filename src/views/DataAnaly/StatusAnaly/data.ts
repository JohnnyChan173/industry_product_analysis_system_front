import { computed, reactive } from "vue";
import { themeColor } from "/@/settings/var";
import { AddonEventInfo } from "/@/api/model/addonEvent";
import { AddonEventStatus, AddonEventType } from "/@/enums/model";
import { formatDateByDayjs } from "/@/utils/util";

// 产线状态数据
const lineStatusChartData = reactive({
  xData: [] as any[],
  yData: [] as any[],
  xyData: [] as any[],
  loading: false,
  timer: null as any,
  delay: 2000,
  markLineValue: 0,
  markLineBaseValue: 0,
});

// 安灯事件统计
const eventAnalyChartData = reactive({
  xData: ["物料", "设备", "品质", "其他", "制程"],
  // yData1: [5, 8, 20, 5], // 调试用
  // yData2: [4, 6, 10, 5], // 调试用
  yData1: [0, 0, 0, 0, 0],
  yData2: [0, 0, 0, 0, 0],
  xyData: [1],
  loading: false,
});

// 安灯发生趋势
const eventTrendChartData = reactive({
  // xData: ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"],
  // yData: [
  //   [2, 0, 3, 0, 0, 1, 1, 2],
  //   [5, 0, 0, 0, 0, 0, 2, 1],
  //   [2, 0, 0, 0, 0, 0, 3, 2],
  //   [10, 2, 3, 0, 0, 0, 1, 3],
  // ] as Array<number[]>,

  xData: [] as string[],
  yData: [[], [], [], [], []] as Array<number[]>,

  xyData: [1],
  loading: false,
});

// 图表1配置
const chart1Options: any = computed(() => ({
  title: {
    textStyle: {
      color: themeColor.primary,
    },
  },
  legend: {
    top: 25,
    right: 10,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      fontSize: 14,
      padding: [3, 0, 0, 0],
    },
    data: ["呼叫", "处理"],
  },
  tooltip: { show: true, formatter: null },
  xAxis: {
    axisLabel: {
      interval: 0,
    },
  },
  yAxis: [
    {
      type: "value",
      minInterval: 1,
      max: function (value: any) {
        const { max } = value;
        return Math.max(max, 5);
      },
    },
  ],
  dataZoom: [
    {
      disabled: true,
    },
  ],
  series: [
    {
      name: "呼叫",
      type: "bar",
      data: eventAnalyChartData.yData1,
      barMaxWidth: 30,
      itemStyle: {
        color: "#5087EC",
      },
      label: {
        show: true,
        position: "top",
      },
    },
    {
      name: "处理",
      type: "bar",
      data: eventAnalyChartData.yData2,
      barMaxWidth: 30,
      itemStyle: {
        color: "#68BBC4",
      },
      label: {
        show: true,
        position: "top",
      },
    },
  ],
}));

const chart2Legend = ["物料", "设备", "品质", "其他", "制程"];

var color = ["#5087EC", "#68BBC4", "#58A55C", "#F2BD42", "#9A60B4"];

var chart2Options = computed(() => ({
  title: {
    textStyle: {
      color: themeColor.primary,
    },
  },
  legend: {
    top: 25,
    right: 10,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      fontSize: 14,
      padding: [3, 0, 0, 0],
    },
    data: chart2Legend,
  },
  tooltip: { show: true, formatter: null },
  dataZoom: [
    {
      type: "inside",
    },
    {
      type: "slider",
      realtime: true,
      start: eventTrendChartData.xData.length > 8 ? 60 : 0,
      end: 100, // 初始展示
      height: 6,
      fillerColor: "rgba(17, 100, 210, 0.42)", // 滚动条颜色
      borderColor: "rgba(17, 100, 210, 0.12)",
      handleSize: 0, // 两边手柄尺寸
      showDetail: true, // 拖拽时是否展示滚动条两侧的文字
      top: "90%",

      zoomLock: false, // 是否只平移不缩放
      // moveOnMouseMove: true, //鼠标移动能触发数据窗口平移
      // zoomOnMouseWheel: true, //鼠标移动能触发数据窗口缩放
    },
  ],
  xAxis: {
    type: "category",
    data: eventTrendChartData.xData,
  },
  yAxis: [
    {
      type: "value",
      minInterval: 1,
      max: function (value: any) {
        const { max } = value;
        return Math.max(max, 10);
      },
    },
  ],
  series: [
    ...chart2Legend.map((_, i) => ({
      name: chart2Legend[i],
      type: "bar",
      stack: "sum",
      barMaxWidth: 30,
      itemStyle: {
        color: color[i],
      },
      label: {
        show: true,
        formatter: function (p: any) {
          const { value } = p;
          return value ? value : "";
        },
      },
      data: eventTrendChartData.yData[i],
    })),
    // {
    //   name: "总数",
    //   type: "bar",
    //   stack: "sum",
    //   data: [0,0,0,0,0,0],
    //   label: {
    //     show: true,
    //     position: "top",
    //     formatter: function (p) { //这里处理展示的数据和
    //       console.log(p)
    //       // let sum = arr[p.dataIndex] + arr1[p.dataIndex];
    //       return 1;
    //     }
    //   },
    // },
  ],
}));

/** 分析安灯事件列表 */
export function analyAddonEventList(list: AddonEventInfo[]) {
  // 过滤空数据
  if (list.length === 0) {
    return;
  }

  // 获取各事件类型列表
  const yData1MaterialList = list.filter((i) => i.eventType === AddonEventType.MATERIAL);
  const yData1DeviceList = list.filter((i) => i.eventType === AddonEventType.DEVICE);
  const yData1QualityList = list.filter((i) => i.eventType === AddonEventType.QUALITY);
  const yData1OtherList = list.filter((i) => i.eventType === AddonEventType.OTHER);
  const yData1MultipleList = list.filter((i) => i.eventType === AddonEventType.MULTIPLE);
  // 输出图表1：yData1
  const yData1 = [
    yData1MaterialList.length,
    yData1DeviceList.length,
    yData1QualityList.length,
    yData1OtherList.length,
    yData1MultipleList.length,
  ];

  // 输出图表1：yData2
  const yData2 = [
    yData1MaterialList.filter(
      (i) => i.eventStatus === AddonEventStatus.PROCESSED || i.eventStatus === AddonEventStatus.INVALID
    ).length,
    yData1DeviceList.filter(
      (i) => i.eventStatus === AddonEventStatus.PROCESSED || i.eventStatus === AddonEventStatus.INVALID
    ).length,
    yData1QualityList.filter(
      (i) => i.eventStatus === AddonEventStatus.PROCESSED || i.eventStatus === AddonEventStatus.INVALID
    ).length,
    yData1OtherList.filter(
      (i) => i.eventStatus === AddonEventStatus.PROCESSED || i.eventStatus === AddonEventStatus.INVALID
    ).length,
    yData1MultipleList.filter(
      (i) => i.eventStatus === AddonEventStatus.PROCESSED || i.eventStatus === AddonEventStatus.INVALID
    ).length,
  ];

  // 驱动数据
  eventAnalyChartData.yData1 = yData1;
  eventAnalyChartData.yData2 = yData2;

  // 输出图表2：
  // 先获取最小和最大时间段 取头尾数据
  const sItem = list[0];
  const eItem = list[list.length - 1];
  // 解析时间戳
  const st = new Date(sItem.happenDate).getTime();
  const et = new Date(eItem.happenDate).getTime();

  // 定义图表数据结构
  const dataList = [];

  // 同天，则取区间即可
  // 输出 sDate~eDate

  let tt = st;
  // 从起始时间戳开始按小时累加
  while (tt <= et) {
    const date = formatDateByDayjs(tt, "YYYY-MM-DD HH:00");
    const data = {
      date,
      materialList: list.filter(
        (i) => formatDateByDayjs(i.happenDate, "YYYY-MM-DD HH:00") === date && i.eventType === AddonEventType.MATERIAL
      ),
      deviceList: list.filter(
        (i) => formatDateByDayjs(i.happenDate, "YYYY-MM-DD HH:00") === date && i.eventType === AddonEventType.DEVICE
      ),
      qualityList: list.filter(
        (i) => formatDateByDayjs(i.happenDate, "YYYY-MM-DD HH:00") === date && i.eventType === AddonEventType.QUALITY
      ),
      otherList: list.filter(
        (i) => formatDateByDayjs(i.happenDate, "YYYY-MM-DD HH:00") === date && i.eventType === AddonEventType.OTHER
      ),
      multipleList: list.filter(
        (i) =>
          formatDateByDayjs(i.happenDate, "YYYY-MM-DD HH:00") === date && i.eventType === AddonEventType.MULTIPLE
      ),
    };
    dataList.push(data);

    // 累加1小时
    tt += 60 * 60 * 1000;
  }

  // 重新展开一个作用域
  {
    // 驱动图表数据
    const xData = dataList.map((i) => i.date.split(" ")[1]);

    const yData1: number[] = [];
    const yData2: number[] = [];
    const yData3: number[] = [];
    const yData4: number[] = [];
    const yData5: number[] = [];
    // 数据处理
    for (let i = 0; i < dataList.length; i++) {
      yData1.push(dataList[i].materialList.length);
      yData2.push(dataList[i].deviceList.length);
      yData3.push(dataList[i].qualityList.length);
      yData4.push(dataList[i].otherList.length);
      yData5.push(dataList[i].multipleList.length);
    }

    eventTrendChartData.xData = xData;
    eventTrendChartData.yData = [yData1, yData2, yData3, yData4, yData5];
    // console.log(xData, eventTrendChartData);
  }
}

export function useChartData() {
  return { eventTrendChartData, eventAnalyChartData, lineStatusChartData, chart1Options, chart2Options };
}
