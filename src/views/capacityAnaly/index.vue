<template>
  <div class="dpanel-box" :style="{ width: panelWholeWidth + 'px' }">
    <div class="dpanel-toolbar">
      <div class="detail-toolbar__title">
        <span class="detail-toolbar__bar"></span>
        <span>【月度】产能分析看板</span>
      </div>

      <div class="toolbar-selectors">
        <span class="toolbar-label">数据周期：</span>
        <Select
          v-model:value="dataCycle"
          class="dpanel-cycle-select"
          size="middle"
          placeholder="选择数据周期"
          :options="cycleOptions"
          @change="handleCycleChange"
        />

        <!-- <span class="toolbar-label toolbar-label--range">物理产线：</span>
        <Select
          v-model:value="physicalLineId"
          class="dpanel-line-select"
          size="middle"
          placeholder="请选择物理产线"
          :options="physicalLineOptions"
          show-search
          optionFilterProp="label"
          allowClear
          @change="handlePhysicalLineChange"
        /> -->

        <span class="toolbar-label toolbar-label--range">对比范围：</span>
        <Select
          v-model:value="compareVirtualLineIds"
          class="dpanel-compare-select"
          size="middle"
          mode="multiple"
          placeholder="请选择虚拟产线"
          :options="virtualLineOptions"
          :loading="virtualLineLoading"
          :disabled="virtualLineLoading || virtualLineOptions.length === 0"
          :maxTagCount="'responsive'"
          show-search
          optionFilterProp="label"
          allowClear
          @change="handleVirtualRangeChange"
        />
      </div>
    </div>

    <div class="dpanel-content">
      <section class="chart-panel">
        <ChartBar
          :width="chartWidth"
          :height="chartHeight"
          title="产线月均线平衡率"
          yLabel="百分比"
          :xyData="monthlyLineBalanceChartData.xyData"
          :xData="monthlyLineBalanceChartData.xData"
          :yData="monthlyLineBalanceChartData.yData"
          :loading="monthlyLineBalanceChartData.loading"
          :chartOptions="monthlyLineBalanceChartOptions"
          :chartClick="handleLineBalanceBarClick"
        />
      </section>

      <section class="chart-panel">
        <ChartBar
          :width="chartWidth"
          :height="chartHeight"
          title="产线月度产能达成率"
          yLabel="百分比"
          :xyData="monthlyAchievementChartData.xyData"
          :xData="monthlyAchievementChartData.xData"
          :yData="monthlyAchievementChartData.yData"
          :loading="monthlyAchievementChartData.loading"
          :chartOptions="monthlyAchievementChartOptions"
          :chartClick="handleAchievementBarClick"
        />
      </section>

      <section class="chart-panel">
        <ChartBar
          :width="chartWidth"
          :height="chartHeight"
          :title="dailyLineBalanceTitle"
          yLabel="平衡率(%)"
          :xyData="dailyLineBalanceChartData.xyData"
          :xData="dailyLineBalanceChartData.xData"
          :yData="dailyLineBalanceChartData.yData"
          :loading="dailyLineBalanceChartData.loading"
          :chartOptions="dailyLineBalanceChartOptions"
        />
      </section>

      <section class="chart-panel">
        <ChartBar
          :width="chartWidth"
          :height="chartHeight"
          :title="dailyOutputTitle"
          yLabel="日产量(台)"
          :xyData="dailyOutputChartData.xyData"
          :xData="dailyOutputChartData.xData"
          :yData="dailyOutputChartData.yData"
          :loading="dailyOutputChartData.loading"
          :chartOptions="dailyOutputChartOptions"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from "vue";
  import { useAppStore } from "/@/store";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { Select } from "ant-design-vue";
  import ChartBar from "/@/components/Chart/Bar.vue";
  import { lineListAll } from "/@/api/line";
  import { virtualLineList } from "/@/api/virtualLine";
  import { maxPageSize } from "/@/config";
  import dayjs from "dayjs";
  import { dailyLineBalance, dailyOutPut, monthlyLineBalance, monthlyAchievement } from "/@/api/statistics";
  import {
    clearDailyChartData,
    clearMonthlyChartData,
    setDailyLineBalanceChartData,
    setDailyOutputChartData,
    setMonthlyAchievementChartData,
    setMonthlyLineBalanceChartData,
    useMonthlyCapacityChartData,
  } from "./data";
  import type {
    DailyLineBalanceChartResult,
    DailyOutputChartResult,
    MonthlyAchievementChartItem,
    MonthlyLineBalanceChartItem,
  } from "./data";

  interface CycleOption {
    label: string;
    value: string;
  }

  const appStore = useAppStore();
  const panelWholeWidth = ref(0);
  const physicalLineId = ref<number>();
  const lineList = ref<any[]>([]);
  const virtualLineData = ref<any[]>([]);
  const compareVirtualLineIds = ref<number[]>([]);
  const virtualLineLoading = ref(false);
  const dataCycle = ref(dayjs().format("YYYY-MM"));
  const rawMonthlyLineBalanceList = ref<MonthlyLineBalanceChartItem[]>([]);
  const rawMonthlyAchievementList = ref<MonthlyAchievementChartItem[]>([]);
  const selectedVirtualLineId = ref<number>();
  const selectedVirtualLineName = ref("");
  const chartHeight = "38.5vh";
  let monthlyRequestSequence = 0;
  let dailyRequestSequence = 0;

  const {
    monthlyLineBalanceChartData,
    monthlyAchievementChartData,
    monthlyLineBalanceChartOptions,
    monthlyAchievementChartOptions,
    dailyLineBalanceChartData,
    dailyOutputChartData,
    dailyLineBalanceChartOptions,
    dailyOutputChartOptions,
  } = useMonthlyCapacityChartData();

  const chartWidth = computed(() => Math.max(560, Math.floor((panelWholeWidth.value - 56) / 2)));
  const dailyLineBalanceTitle = computed(() =>
    selectedVirtualLineName.value
      ? `【${selectedVirtualLineName.value}】- 产线日均线平衡率`
      : "产线日均线平衡率"
  );
  const dailyOutputTitle = computed(() =>
    selectedVirtualLineName.value
      ? `【${selectedVirtualLineName.value}】- 每日产量`
      : "每日产量"
  );

  /** 物理产线筛选项。 */
  const physicalLineOptions = computed(() =>
    lineList.value.map((item) => ({
      label: item.lineName,
      value: item.id,
    }))
  );

  /** 对比范围展示当前物理产线下的虚拟产线。 */
  const virtualLineOptions = computed(() =>
    virtualLineData.value.map((item) => ({
      label: item.virtualLineName,
      value: Number(item.id),
    }))
  );

  /**
   * 最近 12 个自然月，包含当前月。
   * 下拉框显示“2026年8月”，实际值保持为“2026-08”。
   */
  const cycleOptions = computed<CycleOption[]>(() => {
    const currentMonth = dayjs().startOf("month");

    return Array.from({ length: 12 }, (_, index) => {
      const month = currentMonth.subtract(index, "month");

      return {
        label: month.format("YYYY年M月"),
        value: month.format("YYYY-MM"),
      };
    });
  });

  /** 同时兼容请求封装直接返回数组和返回 { data: [] } 两种形式。 */
  function unwrapList<T>(result: T[] | { data?: T[] } | undefined | null): T[] {
    if (Array.isArray(result)) return result;
    const wrappedResult = result as { data?: T[] } | undefined | null;
    if (Array.isArray(wrappedResult?.data)) return wrappedResult.data;
    return [];
  }

  /** 兼容分页接口返回 { records }、{ data: { records } } 或数组。 */
  function unwrapRecords<T>(result: any): T[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.records)) return result.records;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.records)) return result.data.records;
    return [];
  }

  /** 兼容详情接口直接返回对象和返回 { data: {} } 两种形式。 */
  function unwrapDetail<T>(result: T | { data?: T } | undefined | null): T | undefined {
    if (!result) return undefined;
    const wrappedResult = result as { data?: T };
    if (typeof result === "object" && wrappedResult.data !== undefined) {
      return wrappedResult.data;
    }
    return result as T;
  }

  /** 物理产线只联动虚拟产线选项，图表仅按“对比范围”过滤。 */
  function renderChartData() {
    const virtualLineIdSet = new Set(compareVirtualLineIds.value.map((id) => String(id)));

    const balanceList = rawMonthlyLineBalanceList.value.filter((item) => {
      if (virtualLineIdSet.size && !virtualLineIdSet.has(String(item.virtualLineId))) return false;
      return true;
    });
    const achievementList = rawMonthlyAchievementList.value.filter((item) => {
      if (virtualLineIdSet.size && !virtualLineIdSet.has(String(item.virtualLineId))) return false;
      return true;
    });

    setMonthlyLineBalanceChartData(balanceList);
    setMonthlyAchievementChartData(achievementList);
  }

  function getVisibleVirtualLineList() {
    const map = new Map<number, { virtualLineId: number; virtualLineName: string }>();

    for (const item of monthlyLineBalanceChartData.xyData) {
      map.set(Number(item.virtualLineId), {
        virtualLineId: Number(item.virtualLineId),
        virtualLineName: item.virtualLineName,
      });
    }

    for (const item of monthlyAchievementChartData.xyData) {
      if (!map.has(Number(item.virtualLineId))) {
        map.set(Number(item.virtualLineId), {
          virtualLineId: Number(item.virtualLineId),
          virtualLineName: item.virtualLineName,
        });
      }
    }

    return Array.from(map.values());
  }

  async function loadDailyChartData(virtualLineId?: number) {
    const month = dataCycle.value;
    if (!month || !virtualLineId) {
      clearDailyChartData();
      return;
    }

    const requestSequence = ++dailyRequestSequence;
    dailyLineBalanceChartData.loading = true;
    dailyOutputChartData.loading = true;

    try {
      const [lineBalanceResult, outputResult] = await Promise.all([
        dailyLineBalance({ month, virtualLineId }),
        dailyOutPut({ month, virtualLineId }),
      ]);

      if (requestSequence !== dailyRequestSequence) return;

      setDailyLineBalanceChartData(
        unwrapDetail<DailyLineBalanceChartResult>(lineBalanceResult as any)
      );
      setDailyOutputChartData(unwrapDetail<DailyOutputChartResult>(outputResult as any));
    } catch (error) {
      if (requestSequence !== dailyRequestSequence) return;
      clearDailyChartData();
      console.error("产线日数据加载失败", error);
    } finally {
      if (requestSequence === dailyRequestSequence) {
        dailyLineBalanceChartData.loading = false;
        dailyOutputChartData.loading = false;
      }
    }
  }

  /** 保留当前仍可见的虚拟产线；否则自动选择筛选结果的第一条。 */
  async function syncSelectedVirtualLine() {
    const visibleList = getVisibleVirtualLineList();
    const currentItem = visibleList.find(
      (item) => String(item.virtualLineId) === String(selectedVirtualLineId.value)
    );
    const selectedItem = currentItem || visibleList[0];

    if (!selectedItem) {
      selectedVirtualLineId.value = undefined;
      selectedVirtualLineName.value = "";
      dailyRequestSequence += 1;
      clearDailyChartData();
      dailyLineBalanceChartData.loading = false;
      dailyOutputChartData.loading = false;
      return;
    }

    selectedVirtualLineId.value = selectedItem.virtualLineId;
    selectedVirtualLineName.value = selectedItem.virtualLineName;
    await loadDailyChartData(selectedItem.virtualLineId);
  }

  async function selectVirtualLineByChart(params: any, list: Array<{ virtualLineId: number; virtualLineName: string }>) {
    const componentType = params?.componentType;
    if (componentType !== "series" && componentType !== "xAxis") return;

    let dataIndex = Number(params?.dataIndex);
    if (componentType === "xAxis" && params?.value != null) {
      dataIndex = list.findIndex((item) => String(item.virtualLineName) === String(params.value));
    }

    const item = list[dataIndex];
    if (!item?.virtualLineId) return;

    selectedVirtualLineId.value = Number(item.virtualLineId);
    selectedVirtualLineName.value = item.virtualLineName || "";
    await loadDailyChartData(selectedVirtualLineId.value);
  }

  function handleLineBalanceBarClick(params: any) {
    return selectVirtualLineByChart(params, monthlyLineBalanceChartData.xyData);
  }

  function handleAchievementBarClick(params: any) {
    return selectVirtualLineByChart(params, monthlyAchievementChartData.xyData);
  }

  /** 月份变化时重新加载月均线平衡率和月度产能达成率。 */
  async function handleCycleChange(value?: string) {
    if (!value) {
      monthlyRequestSequence += 1;
      rawMonthlyLineBalanceList.value = [];
      rawMonthlyAchievementList.value = [];
      clearMonthlyChartData();
      selectedVirtualLineId.value = undefined;
      selectedVirtualLineName.value = "";
      dailyRequestSequence += 1;
      clearDailyChartData();
      dailyLineBalanceChartData.loading = false;
      dailyOutputChartData.loading = false;
      return;
    }

    monthlyLineBalanceChartData.loading = true;
    monthlyAchievementChartData.loading = true;
    const requestSequence = ++monthlyRequestSequence;

    try {
      const [achievementResult, lineBalanceResult] = await Promise.all([
        monthlyAchievement({ month: value }),
        monthlyLineBalance({ month: value }),
      ]);

      if (requestSequence !== monthlyRequestSequence) return;

      rawMonthlyLineBalanceList.value = unwrapList<MonthlyLineBalanceChartItem>(lineBalanceResult as any);

      const virtualLineMap = new Map(
        rawMonthlyLineBalanceList.value.map((item) => [
          String(item.virtualLineId),
          { lineId: item.lineId, lineName: item.lineName },
        ])
      );
      rawMonthlyAchievementList.value = unwrapList<MonthlyAchievementChartItem>(achievementResult as any).map(
        (item) => ({
          ...item,
          ...virtualLineMap.get(String(item.virtualLineId)),
        })
      );
      renderChartData();
      await syncSelectedVirtualLine();
    } catch (error) {
      if (requestSequence !== monthlyRequestSequence) return;
      rawMonthlyLineBalanceList.value = [];
      rawMonthlyAchievementList.value = [];
      clearMonthlyChartData();
      dailyRequestSequence += 1;
      clearDailyChartData();
      dailyLineBalanceChartData.loading = false;
      dailyOutputChartData.loading = false;
      console.error("月度产能图表数据加载失败", error);
    } finally {
      if (requestSequence === monthlyRequestSequence) {
        monthlyLineBalanceChartData.loading = false;
        monthlyAchievementChartData.loading = false;
      }
    }
  }

  async function handlePhysicalLineChange() {
    compareVirtualLineIds.value = [];
    await toGetVirtualLineList();
    // renderChartData();
    // await syncSelectedVirtualLine();
  }

  async function handleVirtualRangeChange() {
    renderChartData();
    await syncSelectedVirtualLine();
  }

  async function toGetLineList() {
    lineList.value = await lineListAll();
  }

  /** 根据物理产线加载可用于对比的虚拟产线。 */
  async function toGetVirtualLineList() {
    virtualLineLoading.value = true;
    try {
      const result = await virtualLineList({
        pageNum: 1,
        pageSize: maxPageSize,
        sort: "id asc",
        lineId: physicalLineId.value,
      });
      virtualLineData.value = unwrapRecords<any>(result);

      const availableIdSet = new Set(virtualLineData.value.map((item) => String(item.id)));
      compareVirtualLineIds.value = compareVirtualLineIds.value.filter((id) =>
        availableIdSet.has(String(id))
      );
    } catch (error) {
      virtualLineData.value = [];
      compareVirtualLineIds.value = [];
      console.error("虚拟产线列表加载失败", error);
    } finally {
      virtualLineLoading.value = false;
    }
  }

  function resizeAllChart() {
    const { fullscreen, siderCollapsed } = appStore;

    // 容器宽度
    const innerWidth = window.innerWidth < 1380 ? 1380 : window.innerWidth;
    // 侧边栏宽度
    const siderWidth = fullscreen ? 0 : siderCollapsed ? 80 : 200;
    // 可使用区域 = 容器宽度 - 边距 - 侧边栏
    const w = innerWidth - siderWidth - 40 * 2;

    panelWholeWidth.value = w;
  }

  onMounted(async () => {
    const { close } = createLoading();
    try {
      resizeAllChart();
      window.addEventListener("resize", resizeAllChart);
      await Promise.all([toGetLineList(), toGetVirtualLineList()]);
      await handleCycleChange(dataCycle.value);
    } finally {
      close();
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", resizeAllChart);
  });
</script>

<style lang="less" scoped>
  @toolbar-height: 60px;
  @toolbar-gap: 12px;
  @toolbar-divider: #eef1f5;

  .dpanel-box {
    margin-top: -8px;
    max-width: none;
    // min-height: calc(100vh - 92px);
    background: #f5f7fa;
  }

  /* ==================== 顶部工具栏 ==================== */
  .dpanel-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    height: @toolbar-height;
    padding: 0 16px;
    gap: @toolbar-gap;
    background: linear-gradient(180deg, #fbfcfd 0%, #f5f7fa 100%);
    border-bottom: 1px solid #e8ecf1;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;

    .detail-toolbar__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1f2329;
      line-height: 1;
      white-space: nowrap;
      .detail-toolbar__bar {
        width: 3px;
        height: 18px;
        border-radius: 2px;
        background: @color-primary;
      }
    }
  }

  /* 顶部筛选区样式沿用参考页面，标题与筛选项之间增加分隔线。 */
  .toolbar-selectors {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    height: 36px;
    margin-left: 4px;
    padding-left: @toolbar-gap;
    border-left: 1px solid @toolbar-divider;
  }

  .toolbar-label {
    color: #1f2329;
    font-weight: 500;
    white-space: nowrap;
  }

  .toolbar-label--range {
    margin-left: 20px;
  }

  .dpanel-line-select {
    width: 168px;
  }

  .dpanel-compare-select {
    width: 480px;
  }

  .dpanel-cycle-select {
    width: 150px;
  }

  .dpanel-content {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 16px;
    box-sizing: border-box;
  }

  .chart-panel {
    min-width: 0;
    padding: 16px 0px 0;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(31, 35, 41, 0.04);
  }

  @media (max-width: 1440px) {
    .dpanel-line-select {
      width: 150px;
    }

    .dpanel-compare-select {
      width: 480px;
    }

    .dpanel-cycle-select {
      width: 138px;
    }
  }
</style>
