<template>
  <div class="relative" v-loading:absolute="loading">
    <div
      :style="{
        // marginTop: '12px',
        marginLeft: '0px',
        width: `${width}px`,
        height: `${height}px`,
      }"
      id="echart"
      ref="chartRef"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import * as Echarts from "echarts";
  import { watch, onMounted, ref, withDefaults, defineProps, onUnmounted } from "vue";
  import { merge } from "lodash-es";
  import { themeColor } from "/@/settings/var";

  interface Props {
    xData: any[];
    yData: any[];
    xyData: any[];
    xLabel?: string;
    yLabel?: string;
    title?: string;
    loading?: boolean;
    markLineValue?: number;
    markLineBaseValue?: number;
    itemStyleColor?: string;
    width?: number;
    height?: number;
    chartOptions: any;
    chartClick: any;
    emptyTitle?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    xData: () => [],
    yData: () => [],
    width: 400,
    height: 300,
    markLineValue: 0,
    markLineBaseValue: 0,
    itemStyleColor: "#4286ec",
    chartOptions: () => ({}),
    chartClick: undefined,
    emptyTitle: "暂无数据",
  });

  const chartRef = ref();

  let myChart: Echarts.ECharts;

  onMounted(async () => {
    // 初始化图表
    const chartDom = chartRef.value;
    console.log(chartDom);
    myChart = Echarts.init(chartDom);
    initChart();

    if (props.chartClick) {
      // 开设点击事件
      myChart.on("click", props.chartClick);
    }
  });

  onUnmounted(() => {
    if (props.chartClick) {
      // 关闭点击事件
      myChart.off("click", props.chartClick);
    }
  });

  watch(
    () => props,
    () => {
      initChart();
    },
    { deep: true }
  );

  /** 初始化图表 */
  function initChart() {
    const { xData, yData, xyData, title, xLabel, yLabel } = props;

    console.log({ xData, yData, xyData, title, xLabel, yLabel });

    const option: Echarts.EChartsOption = {
      title: {
        text: title,
        left: "center",
      },
      grid: {
        left: "7%",
        right: "7%",
      },
      dataZoom: [
        {
          type: "inside",
        },
      ],
      xAxis: {
        triggerEvent: true,
        type: "category",
        name: xLabel,
        data: xData,
      },
      yAxis: [
        {
          type: "value",
          name: yLabel,
          minInterval: 1,
          // max: 140,
        },
      ],
      animation: false,
      series: [
        {
          type: "bar",
          // sampling: "lttb",
          // symbolSize: 4,
          data: yData,
          label: {
            show: true,
            position: "top",
          },
          barMaxWidth: 30,
          markLine:
            props.markLineValue && props.markLineBaseValue
              ? {
                  symbol: "none",
                  label: {
                    formatter(e) {
                      const { value, name } = e;
                      if (name === "中心限") {
                        return `中心限: ${value}`;
                      } else if (name === "平均值") {
                        return `平均值: ${value}`;
                      } else {
                        return `${value}`;
                      }
                    },
                    color: themeColor["primary-d"],
                  },
                  data: [
                    {
                      name: "中心限",
                      lineStyle: {
                        type: "dashed",
                        color: "#096dd9",
                      },
                      label: {
                        color: "#096dd9",
                      },
                      yAxis: props.markLineBaseValue,
                    },
                    {
                      name: "平均值",
                      lineStyle: {
                        type: "dashed",
                        color: "#60b060",
                      },
                      label: {
                        color: "#60b060",
                      },
                      yAxis: props.markLineValue,
                    },
                  ],
                }
              : undefined,
          itemStyle: {
            color: props.itemStyleColor,
          },
        },
      ],
    };

    // 检测是否有数据
    const hasValue = xyData.length;

    // 如果数据不存在
    if (!hasValue) {
      option.title = {
        text: `${props.title} ${props.emptyTitle}`,
        x: "center",
        y: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "normal",
          color: "#aaa",
        },
      };
      option.tooltip = undefined;
    }

    // 存在外部配置项则合并
    const mergeOptions = merge(option, props.chartOptions);
    console.log(props.chartOptions);

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(mergeOptions, true);
  }
</script>

<style></style>
