<template>
  <div class="dpanel-box" :style="{ width: panelWholeWidth + 'px' }">
    <!-- 上层看板 -->
    <Row :gutter="20">
      <!-- 线产能情况 -->
      <Col :style="{ width: chartPanelWidth + 'px' }">
        <SubTitle2 class="!my-12px !mb-0px">
          <div class="flex items-center">
            <p>线产能情况</p>
          </div>
        </SubTitle2>
        <div class="chart1">
          <ChartBar
            :width="chartPanelWidth"
            :height="chartPanelHeight"
            :title="_getData1Title()"
            xLabel="实际生产/计划生产"
            yLabel=""
            :xData="capacity.xData"
            :yData="capacity.yData"
            :chartOptions="chart1Options"
          />
        </div>
      </Col>

      <Col :style="{ width: chartPanelWidth + 'px' }">
        <!-- 线平衡 -->
        <SubTitle2 class="!my-12px !mb-0px" title="线平衡排行" />
        <div class="chart1">
          <ChartBar
            :width="chartPanelWidth"
            :height="chartPanelHeight"
            :title="_getData2Title()"
            xLabel="时间"
            yLabel="线平衡"
            :xData="lineBalance.xData"
            :yData="lineBalance.yData"
            :chartOptions="chart2Options"
          />
        </div>
      </Col>

      <Col :style="{ width: chartPanelWidth + 'px' }">
        <!-- 安灯事件统计 -->
        <SubTitle2 class="!my-12px !mb-0px" title="安灯事件统计" />
        <div>
          <ChartBar
            :width="chartPanelWidth"
            :height="chartPanelHeight"
            :title="_getData4Title()"
            xLabel="事件类型"
            yLabel="累计发生"
            :chartOptions="chart4Options"
          />
        </div>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps, computed, onMounted, watch, reactive, ref, onUnmounted } from "vue";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import { useChartData } from "./data";
  import { themeColor } from "/@/settings/var";
  import { Col, Divider, Row, Tag } from "ant-design-vue";
  import { WorkshopInfo } from "/@/api/model/workshop";
  import { useAppStore } from "/@/store";
  import { StatisticsWorkshopData } from "/@/api/model/statistics";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { formatDateByDayjs, isToday } from "/@/utils/util";
  import { statisticsWorkshop } from "/@/api/statistics";
  import { useResize } from "/@/hooks/web/useResize";

  interface Props {
    workshopId?: number;
    workshopInfo?: WorkshopInfo;
    startDate: string;
    endDate: string;
    staticsData?: StatisticsWorkshopData;
  }
  const props = withDefaults(defineProps<Props>(), {
    workshopId: 0,
    workshopInfo: undefined,
    startDate: formatDateByDayjs(),
    endDate: formatDateByDayjs(),
  });

  const appStore = useAppStore();

  const panelWholeWidth = ref(0);
  const { capacity, chart1Options, lineBalance, chart2Options, addonEvents, chart4Options } = useChartData();

  const chartWidth = computed(() => panelWholeWidth.value * 0.5);
  const chartPanelWidth = computed(() => panelWholeWidth.value * 0.33);
  const chartPanelHeight = computed(() => 320);

  resizeAllChart();

  useResize(resizeAllChart);

  watch(
    () => props.staticsData,
    (v) => {
      if (v) {
        toUpdateChart();
      }
    },
    {
      immediate: true,
    }
  );

  onMounted(async () => {
    await toGetNeedInfo();
  });

  onUnmounted(() => {});

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

  /** 获取 图表1标题 */
  function _getData1Title() {
    const { workshopInfo, startDate } = props;

    if (workshopInfo) {
      return `【${workshopInfo.workshopName}】${startDate}-线产能情况`;
    } else {
      return "";
    }
  }

  /** 获取 图表2标题 */
  function _getData2Title() {
    const { workshopInfo, startDate } = props;
    if (workshopInfo) {
      return `【${workshopInfo.workshopName}】${startDate}-线平衡排行`;
    } else {
      return "";
    }
  }

  /** 获取 图表4标题 */
  function _getData4Title() {
    const { workshopInfo, startDate } = props;

    if (workshopInfo) {
      return `【${workshopInfo.workshopName}】${startDate}-安灯事件统计`;
    } else {
      return "";
    }
  }

  async function toUpdateChart() {
    const sData = props.staticsData!!;
    // 待动态获取数据
    // 图表1作用域
    {
      const rawData = sData.capacity;

      rawData.reverse();

      const xData = rawData.map((i) => i.registrationBeatProductNumberTotal / i.registrationPlanProductNumberTotal);
      const yData = rawData.map((i) => i.lineName);

      capacity.rawData = rawData;
      capacity.xData = xData;
      capacity.yData = yData;
    }

    // 图表2作用域
    {
      const rawData = sData.lineBalance;

      // 时间扁平化，并按顺序
      const timeFlat = ([] as string[]).concat(...rawData.map((i) => i.dates));
      const timeFlatSet = Array.from(new Set(timeFlat));
      // 升序化
      timeFlatSet.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      console.log(timeFlatSet);

      for (let i = 0; i < rawData.length; i++) {
        const data = rawData[i] as any;
        const { dates, balanceRatios } = data;
        const formatBalanceRatios = [];

        for (let j = 0; j < timeFlatSet.length; j++) {
          const time = timeFlatSet[j];
          // 检索对应的key的值 有没有
          const findTimeIndex = dates.findIndex((d: string) => d === time);
          let value = "";
          if (findTimeIndex > -1) {
            value = balanceRatios[findTimeIndex];
          }
          formatBalanceRatios.push(value);
        }

        // 注入对象
        data.formatBalanceRatios = formatBalanceRatios;
      }
      // 按时间顺序 检索对上的 就塞入Map value 里

      lineBalance.rawData = rawData;
      lineBalance.xData = timeFlatSet;
      lineBalance.yData = [0, 0.25, 0.5, 0.75, 1];
      console.log(lineBalance);
    }

    // 图表4作用域
    {
      const rawData = sData.addonEvents;
      // 根据产线顺序生产二维日堆叠图 series 即可
      // const formatSeries = rawData.map((i) => i.happenCounts);
      addonEvents.rawData = rawData;
    }
  }

  async function toGetNeedInfo() {}
</script>

<style></style>
