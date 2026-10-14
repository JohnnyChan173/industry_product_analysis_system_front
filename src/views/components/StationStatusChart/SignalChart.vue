<template>
  <!-- 常规信号查看 -->
  <!-- <SubTitle2 class="!my-0px"> 常规信号查看</SubTitle2> -->

  <div class="chart1">
    <ChartBar
      width="100%"
      :height="420"
      :title="lineBalanceChartData.title"
      xLabel="时间"
      yLabel="信号量"
      :xyData="lineBalanceChartData.xyData"
      :xData="lineBalanceChartData.xData"
      :yData="lineBalanceChartData.yData"
      :loading="lineBalanceChartData.loading"
      :chartOptions="chart4Options"
      :itemStyleColor="themeColor.primary"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, withDefaults, defineProps } from "vue";
  import { themeColor } from "/@/settings/var";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import { SubModuleType } from "/@/enums/model";
  import { signalSpecifyDateData } from "/@/api/signal";
  import { formatDateByDayjs } from "/@/utils/util";
  import { VirtualStationDetail } from "/@/api/model/virtualStation";
  import { formatRegistrationEndDate, formatRegistrationStartDate, getVirtualStationText } from "/@/config/parse";
  import { RegistrationDetail } from "/@/api/model/registration";
  import { message } from "ant-design-vue";

  interface Props {
    type: SubModuleType;
    virtualStationInfo: VirtualStationDetail;
    registationInfo: RegistrationDetail;
  }

  const props = withDefaults(defineProps<Props>(), {
    type: undefined,
    virtualStationInfo: undefined,
    registationInfo: undefined,
  });

  const chart4Options = computed(() => ({
    xAxis: {
      type: "category",
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        type: "line",
        step: "middle",
        markLine: undefined,
        label: {
          show: false,
        },
        symbol: "none",
      },
    ],
    dataZoom: [
      {
        type: "inside",
      },
    ],
  }));

  // 线平衡数据
  const lineBalanceChartData = reactive({
    title: "",
    xData: [] as any[],
    yData: [] as any[],
    xyData: [] as any[],
    loading: false,
    markLineValue: 0,
    markLineBaseValue: 0,

    stationTotal: 0,
    lineAvgSum: 0,
    maxAverageBeat: 0,
  });

  onMounted(async () => {
    await toGetNeedInfo();
  });

  async function toGetNeedInfo() {
    // 获取信号量数据
    const { type, virtualStationInfo, registationInfo: rInfo } = props;

    if (!virtualStationInfo) {
      message.warn("未知虚拟工位");
      return;
    } else if (!rInfo) {
      message.warn("未知生产登记");
      return;
    }

    const { stationId } = virtualStationInfo;
    // 校准时间
    const startDate = formatRegistrationStartDate(rInfo);
    const endDate = formatRegistrationEndDate(rInfo);

    // 请求指定时间内的 类型 数据
    const records = await signalSpecifyDateData({
      type,
      stationId,
      startDate,
      endDate,
    });

    // 文案同步
    const date = formatDateByDayjs(endDate);
    const vsName = getVirtualStationText(virtualStationInfo);
    let typeName = "";
    if (type === SubModuleType.WRISTBAND) {
      typeName = "静电手环";
    } else if (type === SubModuleType.DEVICE_GROUND) {
      typeName = "设备接地";
    }
    // 根据类型读取数据
    const list = records.map((i) => ({
      date: formatDateByDayjs(i.timestamp, "YYYY-MM-DD HH:mm:ss"),
      value: i[type],
    }));
    console.log(list);

    const xData = list.map((i) => i.date.split(" ")[1]);
    const yData = list.map((i) => i.value);

    lineBalanceChartData.title = ` ${vsName} [${date}] ${typeName}信号量趋势`;
    lineBalanceChartData.xData = xData;
    lineBalanceChartData.yData = yData;
    lineBalanceChartData.xyData = list;
  }
</script>

<style></style>
