<template>
  <div ref="rootRef" class="detail-data-analy">
    <SignalAnaly
      v-if="chartReady"
      ref="signalAnalyRef"
      :info="info"
      :detailView="true"
    />
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, ref, watch, withDefaults, defineProps } from "vue";
  import SignalAnaly from "./SignalAnaly/index.vue";
  import { staffListAll } from "/@/api/staff";
  import { StaffType } from "/@/enums/model";
  import { virtualLineDetail } from "/@/api/virtualLine";
  import { AnalyMode, panelWholeWidth, useData } from "./useData";

  interface Props {
    mode?: AnalyMode;
    lineInfo: any;
    info: any;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: AnalyMode.Status,
    lineInfo: () => ({}),
    info: () => ({}),
  });

  const {
    lineList,
    staffList,
    lineId,
    registrationId,
    registrationInfo,
    virtualLineInfo,
    virtualStationList,
    selectVirtualStationId,
    clearData,
  } = useData();

  const rootRef = ref<HTMLElement | null>(null);
  const signalAnalyRef = ref<any>();
  const chartReady = ref(false);
  let rootResizeObserver: ResizeObserver | null = null;
  let mounted = false;
  let initializing = false;

  function nextFrame() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  function resizeAllChart() {
    const root = rootRef.value;
    const width = root?.clientWidth || window.innerWidth - 80;

    if (width <= 0) return;
    panelWholeWidth.value = Math.max(600, width);
  }

  async function initDetailAnaly() {
    if (initializing) return;

    const rInfo = props.info;
    const lInfo = props.lineInfo;
    if (!rInfo?.id || !lInfo?.id) return;

    initializing = true;
    try {
      // 先准备 DataAnaly 共享状态，此时暂不挂载 ECharts。
      lineId.value = lInfo.id;
      lineList.value = [lInfo];
      registrationId.value = rInfo.id;
      registrationInfo.value = rInfo;

      staffList.value = await staffListAll(StaffType.PUGONG);

      const vInfo = await virtualLineDetail(rInfo.virtualLineId);
      virtualLineInfo.value = vInfo;
      virtualStationList.value = vInfo.virtualStationList || [];

      if (vInfo.targetLineBalance) {
        localStorage.setItem("targetLineBalance", String(vInfo.targetLineBalance));
      }

      const firstVisibleStation = virtualStationList.value.find((item: any) => !item.isFilter);
      selectVirtualStationId.value = firstVisibleStation?.id;

      // 等详情页 DOM 完成一次布局后再确定图表宽度。
      await nextTick();
      await nextFrame();
      resizeAllChart();

      // 首次初始化到这里才挂载 SignalAnaly，避免 ECharts 在 0×0 DOM 上 init。
      if (!chartReady.value) {
        chartReady.value = true;
        await nextTick();
        await nextFrame();
      }

      resizeAllChart();
      await signalAnalyRef.value?.reRenderAllChart?.();
    } finally {
      initializing = false;
    }
  }

  onMounted(async () => {
    mounted = true;

    // 父详情页先完成首帧布局，再初始化图表。
    await nextTick();
    await nextFrame();
    resizeAllChart();

    if (typeof ResizeObserver !== "undefined") {
      rootResizeObserver = new ResizeObserver(() => {
        if (!mounted || !chartReady.value) return;
        resizeAllChart();
      });
      if (rootRef.value) rootResizeObserver.observe(rootRef.value);
    } else {
      window.addEventListener("resize", resizeAllChart);
    }

    await initDetailAnaly();
  });

  watch(
    () => [props.info?.id, props.lineInfo?.id],
    async ([newRegistrationId, newLineId], [oldRegistrationId, oldLineId]) => {
      if (!mounted) return;
      if (newRegistrationId === oldRegistrationId && newLineId === oldLineId) return;
      await initDetailAnaly();
    }
  );

  onUnmounted(() => {
    mounted = false;
    rootResizeObserver?.disconnect();
    rootResizeObserver = null;
    window.removeEventListener("resize", resizeAllChart);
    signalAnalyRef.value?.pausePanel?.();
    clearData();
  });
</script>

<style lang="less" scoped>
  .detail-data-analy {
    width: 100%;
    min-width: 0;
  }
</style>
