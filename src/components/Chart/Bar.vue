<template>
  <div class="relative" v-loading:absolute="loading">
    <div
      ref="chartRef"
      :style="{
        width: finalWidth,
        height: finalHeight,
        marginLeft: '0px',
      }"
      class="echart-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import * as Echarts from "echarts";
  import { ref, watch, onMounted, onUnmounted, computed } from "vue";
  import { merge } from "lodash-es";

  /* ================= props ================= */

  interface Props {
    theme?: "light" | "walden";
    xData: any[];
    yData: any[];
    xLabel?: string;
    yLabel?: string;
    title?: string;
    loading?: boolean;
    itemStyleColor?: string;
    width?: number | string;
    height?: number | string;
    chartOptions?: any;
    chartClick?: any;
    emptyTitle?: string;
    fullscreen?: boolean;
    showTotal?: boolean;
    TotalIsYDataLength?: boolean;
    isVertical?: boolean;
    hasMax?: boolean;
    maxAverageBeat?: number;
    average?: number;
    maxLabel?: string;
    todayRecordsTotal?: number;
  }

  // eslint-disable-next-line no-undef
  const props = withDefaults(defineProps<Props>(), {
    theme: "light",
    xData: () => [],
    yData: () => [],
    width: 400,
    height: 300,
    itemStyleColor: "#4286ec",
    chartOptions: () => ({}),
    chartClick: undefined,
    emptyTitle: "暂无数据",
    fullscreen: false,
    maxAverageBeat: 0,
    average: 0,
    maxLabel: "",
    todayRecordsTotal: 0,
  });

  /* ================= ref ================= */

  const chartRef = ref<HTMLDivElement>();
  let myChart: Echarts.ECharts | null = null;

  /**
   * 图表刷新、resize 都放到下一帧执行。
   * 父组件同一轮逻辑里连续修改多个 props 时，只真正刷新一次 ECharts。
   */
  let updateFrame = 0;
  let resizeFrame = 0;

  /* ================= dataZoom 状态缓存 ================= */

  /**
   * 这里只作为 ECharts 内部状态缓存使用，不参与 Vue 模板渲染，
   * 没必要做成 ref/reactive，避免拖动 dataZoom 时反复触发 Vue 响应式系统。
   */
  const zoomState = {
    x: { start: 0, end: 100 },
    y: { start: 0, end: 100 },
  };

  /* ================= size ================= */

  const TOOLBAR_HEIGHT = 40;

  const finalWidth = computed(() => {
    if (props.fullscreen) return window.innerWidth + "px";
    return typeof props.width === "number" ? props.width + "px" : props.width;
  });

  const finalHeight = computed(() => {
    if (props.fullscreen) return window.innerHeight - TOOLBAR_HEIGHT + "px";
    return typeof props.height === "number" ? props.height + "px" : props.height;
  });

  /* ================= resize ================= */

  function resizeChart() {
    if (!myChart) return;

    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      // 不手动传 width/height，让 ECharts 直接读取当前容器尺寸。
      // 这样 width="100%" 等字符串尺寸也不会被 Number() 转成 NaN。
      myChart?.resize();
    });
  }

  /* ================= update schedule ================= */

  function scheduleChartUpdate() {
    if (updateFrame) {
      cancelAnimationFrame(updateFrame);
    }

    updateFrame = requestAnimationFrame(() => {
      updateFrame = 0;
      initChart();
    });
  }

  /* ================= event ================= */

  function handleDataZoom(params: any) {
    if (params.batch) {
      params.batch.forEach((dz: any) => {
        if (dz.xAxisIndex !== undefined) {
          zoomState.x.start = dz.start;
          zoomState.x.end = dz.end;
        }

        if (dz.yAxisIndex !== undefined) {
          zoomState.y.start = dz.start;
          zoomState.y.end = dz.end;
        }
      });
      return;
    }

    if (props.isVertical) {
      zoomState.y.start = params.start;
      zoomState.y.end = params.end;
    } else {
      zoomState.x.start = params.start;
      zoomState.x.end = params.end;
    }
  }

  /* ================= lifecycle ================= */

  onMounted(() => {
    if (!chartRef.value) return;

    myChart = Echarts.init(chartRef.value, props.theme);
    initChart();

    // 监听 dataZoom，缓存 start/end，刷新数据后保持用户当前缩放位置。
    myChart.on("dataZoom", handleDataZoom);

    if (props.chartClick) {
      myChart.on("click", props.chartClick);
    }

    window.addEventListener("resize", resizeChart);
  });

  onUnmounted(() => {
    if (updateFrame) {
      cancelAnimationFrame(updateFrame);
      updateFrame = 0;
    }

    if (resizeFrame) {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
    }

    if (myChart) {
      myChart.off("dataZoom", handleDataZoom);

      if (props.chartClick) {
        myChart.off("click", props.chartClick);
      }
    }

    window.removeEventListener("resize", resizeChart);

    myChart?.dispose();
    myChart = null;
  });

  /* ================= watch ================= */

  // 尺寸变化合并到下一帧 resize。
  watch(
    () => [props.width, props.height, props.fullscreen],
    resizeChart,
    { flush: "post" }
  );

  /**
   * 不使用 deep watch：
   * 父组件目前都是替换 xData/yData/chartOptions 引用，监听引用变化即可。
   * 避免 Vue 每次刷新都深度遍历大量图表数据和 option。
   *
   * 同时把会直接影响基础 option 的轻量 props 一并监听，
   * 避免只修改标题、累计次数、颜色等信息时图表不刷新。
   */
  watch(
    () => [
      props.xData,
      props.yData,
      props.chartOptions,
      props.xLabel,
      props.yLabel,
      props.title,
      props.itemStyleColor,
      props.emptyTitle,
      props.showTotal,
      props.TotalIsYDataLength,
      props.isVertical,
      props.hasMax,
      props.maxLabel,
      props.todayRecordsTotal,
    ],
    scheduleChartUpdate,
    { flush: "post" }
  );

  /* ================= chart ================= */

  /** 兼容普通数字和 { value: number } 形式的 ECharts 数据项。 */
  function getNumericValue(item: any): number {
    const value =
      item && typeof item === "object" && "value" in item
        ? item.value
        : item;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function initChart() {
    if (!myChart) return;

    // 直接复用父组件传入的数组，不再每次 setOption 前额外复制一份大数组。
    const xData = props.xData;
    const yData = props.yData;

    const hasValue = xData.length > 0 && yData.length > 0;
    const total = props.TotalIsYDataLength
      ? yData.length
      : yData.reduce((sum, item) => sum + getNumericValue(item), 0);
    const todayRecordsTotal = props.todayRecordsTotal || 0;

    const option: Echarts.EChartsOption = {
      title: hasValue
        ? props.showTotal
          ? [
              {
                text: `当天累计次数: ${todayRecordsTotal}       当前小时次数: ${total}  `,
                top: 50,
                left: "center",
                textStyle: {
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#333",
                },
              },
              {
                text: props.title,
                left: "center",
              },
            ]
          : {
              text: props.title,
              left: "center",
            }
        : {
            text: `${props.title ?? ""} ${props.emptyTitle}`,
            left: "center",
            top: "middle",
            textStyle: {
              fontSize: 16,
              fontWeight: "normal",
              color: "#aaa",
            },
          },
      grid: {
        left: "9%",
        right: "12%",
        bottom: "10%",
      },
      tooltip: hasValue ? { show: true } : undefined,

      // 带回 dataZoom 状态，刷新实时数据后保持当前缩放窗口。
      dataZoom: props.isVertical
        ? [
            {
              type: "inside",
              yAxisIndex: 0,
              orient: "vertical",
              start: zoomState.y.start,
              end: zoomState.y.end,
            },
          ]
        : [
            {
              type: "inside",
              xAxisIndex: 0,
              start: zoomState.x.start,
              end: zoomState.x.end,
            },
          ],

      xAxis: {
        type: "category",
        name: props.xLabel,
        data: xData,
        triggerEvent: true,
        axisLabel: {
          fontSize: 10,
          color: (value: string) => {
            const maxLabelPrefix = props.maxLabel?.split("-")[0];
            if (maxLabelPrefix && value.split("\n")[0] === maxLabelPrefix) {
              return "red";
            }
            return "#333";
          },
        },
      },
      yAxis: {
        type: "value",
        name: props.yLabel,
        minInterval: 1,
        min: 0,
        max: props.hasMax ? 100 : undefined,
        boundaryGap: ["0", "100%"],
      },
      animation: false,
      series: hasValue
        ? [
            {
              type: "bar",
              data: yData,
              barMaxWidth: 30,
              label: {
                show: true,
                position: "top",
              },
              itemStyle: {
                color: props.itemStyleColor,
              },
            },
          ]
        : [],
    };

    // 保持原有 chartOptions 覆盖基础配置的行为。
    const merged = merge(option, props.chartOptions);

    /**
     * 原来 setOption(merged, true) 等价于 notMerge: true，
     * 每次实时刷新都会把整张图当成新图重建。
     *
     * 现在允许 ECharts 做增量 diff，并延迟到空闲更新；
     * title/series/dataZoom 使用 replaceMerge，避免切换配置时残留旧组件。
     * 尤其是有数据时 title 为两项、无数据时 title 仅一项，必须整体替换，
     * 否则上一岗位的第二个标题会继续显示。
     */
    myChart.setOption(merged, {
      notMerge: false,
      lazyUpdate: true,
      replaceMerge: ["title", "series", "dataZoom"],
    });
  }
</script>

<style scoped>
  .echart-container {
    width: 100%;
    height: 100%;
  }
</style>
