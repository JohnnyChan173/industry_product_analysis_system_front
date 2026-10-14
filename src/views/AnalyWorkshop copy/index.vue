<template>
  <div class="dpanel-box" :style="{ width: panelWholeWidth + 'px' }">
    <!-- 顶部选项栏 -->
    <div class="dpanel">
      <!-- 1.车间列表 -->
      <div class="dpanel-area">
        <Select
          :style="{ width: '240px' }"
          size="large"
          v-model:value="workshopId"
          placeholder="选择车间"
          @change="handleWorkshopIdChange"
        >
          <Select.Option v-for="{ id, workshopName } in workshopList" :key="id" :value="id">
            {{ workshopName }}
          </Select.Option>
        </Select>
      </div>

      <!-- 看板选项 -->
      <div class="dpanel-tools">
        <div>
          <Tag v-if="isSelectDateNow" color="blue" class="!mr-6px">实时刷新</Tag>
        </div>
        <div
          v-if="!appStore.fullscreen"
          class="!text-24px !text-primary mr-8px hover-opacity"
          @click="toggleFullscreen"
        >
          <FullscreenOutlined />
        </div>
        <div v-else class="!text-24px !text-primary mr-8px hover-opacity" @click="toggleFullscreen">
          <FullscreenExitOutlined />
        </div>
        <!-- 2.日期选择 -->
        <!-- <Radio.Group v-model:value="dateRange" button-style="solid" @change="handleDateRangeChange">
          <Radio.Button v-for="(value, key) in DateRangeEnums" :key="key" :value="value">{{ value }}</Radio.Button>
        </Radio.Group> -->
        <DatePicker
          class="!w-120px"
          v-model:value="selectDate"
          @change="handleDatePickerChange"
          placeholder="通过日期筛选"
        />
      </div>
    </div>

    <Analy></Analy>
  </div>
</template>

<script setup lang="ts">
  import { Radio, Select, DatePicker, Tag } from "ant-design-vue";
  import { nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
  import { WorkshopInfo } from "/@/api/model/workshop";
  import { workshopListAll } from "/@/api/workshop";
  import { formatDateByDayjs, parseSearch } from "/@/utils/util";
  import { replaceUrlQuery } from "/@/utils/router";
  import { useAppStore } from "/@/store";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons-vue";
  import { DateRangeEnums, panelWholeWidth, useData } from "./useData";
  import Analy from "./Analy/index.vue";
  import { statisticsWorkshop } from "/@/api/statistics";
  import dayjs, { Dayjs } from "dayjs";

  const searchDateRange = (parseSearch().dateRange || DateRangeEnums.DAY) as DateRangeEnums;
  const searchWorkshopId = Number(parseSearch().workshopId) || 0;

  const appStore = useAppStore();
  const { selectDate, isSelectDateNow, dateRange, workshopId, workshopList, staticsData, mockData, clearData } =
    useData();

  const latestStaticsData = reactive({
    timer: null as any,
    delay: 5000,
  });

  onMounted(async () => {
    dateRange.value = searchDateRange;

    const { close } = createLoading();
    resizeAllChart();
    await toGetNeedInfo();

    // 如果车间存在
    if (workshopId.value) {
      toGetLatestStatisData();
    }

    close();
  });

  onUnmounted(() => {
    clearData();
    clearLatestStatisDataInterval();
  });

  async function handleDatePickerChange(date: Dayjs | string, dateString: string) {
    if (date == null) {
      dateRange.value = DateRangeEnums.DAY;
    } else {
      dateRange.value = undefined;
    }

    const { close } = createLoading();

    await toGetLatestStatisData();

    // 如果非今日则清除定时器
    if (!isSelectDateNow.value) {
      clearLatestStatisDataInterval();
    }

    close();
  }

  /** 切换全屏 */
  function toggleFullscreen() {
    appStore.setFullscreen(!appStore.fullscreen);

    nextTick(() => {
      resizeAllChart();
    });
  }

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

  /** 变化-车间id */
  async function handleWorkshopIdChange() {
    replaceUrlQuery(
      {
        workshopId: workshopId.value,
      },
      false
    );

    nextTick(async () => {
      toGetLatestStatisData();
    });
  }

  /** 日期变化 */
  function handleDateRangeChange() {
    toGetLatestStatisData();
  }

  /** 车间列表 */
  async function toGetWorkshopList() {
    // 获取产线列表
    const lList = await workshopListAll();
    workshopList.value = lList;

    // 检测参数是否存在
    if (searchWorkshopId) {
      workshopId.value = searchWorkshopId;
    } else {
      // 默认选中车间就是第一条
      workshopId.value = lList.length > 0 ? lList[0].id : 0;
    }
  }

  /** 请求统计数据 */
  async function toGetStatisData() {
    const wid = workshopId.value;
    let startDate = "";
    let endDate = "";

    // 如果是今日
    // if (dateRange.value === DateRangeEnums.DAY) {
    //   startDate = formatDateByDayjs(Date.now(), "YYYY-MM-DD") + " 00:00:00";
    // } else if (dateRange.value === DateRangeEnums.WEEK) {
    //   // 结束时间-7天
    //   startDate = formatDateByDayjs(Date.now() - 7 * 24 * 60 * 60 * 1000, "YYYY-MM-DD") + " 00:00:00";
    // }

    const ymd = formatDateByDayjs(selectDate.value);

    if (isSelectDateNow.value) {
      startDate = ymd + " 00:00:00";
    } else {
      // 说明是某天
      startDate = ymd + " 00:00:00";
      endDate = ymd + " 23:59:59";
    }

    // 待接入接口
    const data = await statisticsWorkshop({ workshopId: wid, startDate, endDate });
    // const data = mockData;

    staticsData.value = data;
  }

  /** 清除生产数量轮询 */
  function clearLatestStatisDataInterval() {
    clearInterval(latestStaticsData.timer);
  }

  /** 轮询获取最近看板数据 */
  async function toGetLatestStatisData() {
    clearLatestStatisDataInterval();

    await toGetStatisData();

    latestStaticsData.timer = setInterval(async () => {
      await toGetStatisData();
    }, latestStaticsData.delay);
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetWorkshopList();
  }
</script>

<style lang="less" scoped>
  @panel-height: 56px;
  .dpanel-box {
    margin-top: -8px;
    max-width: none;
  }

  .dpanel {
    position: relative;
    display: flex;
    align-items: center;
    height: @panel-height;
    padding-bottom: 6px;
    border-bottom: 1px dashed #ccc;
    &-tools {
      position: absolute;
      right: 0;
      bottom: 5px;
      .center();
    }
  }
</style>
