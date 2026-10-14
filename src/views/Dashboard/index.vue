<template>
  <div>
    <!-- 1、平台信息统计 -->
    <div style="width: 100%; display: flex">
      <div style="width: 100%">
        <div class="dpanel">
          <div class="dpanel-area">
            <p class="text-gray-400">1、平台信息统计</p>
          </div>

          <!-- 看板选项 -->
          <div class="dpanel-tools">
            <div>
              <Tag v-if="isDateToday" color="blue" class="!mr-6px">每{{ refreshMinute }}分钟刷新</Tag>
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
            <DatePicker
              class="!w-120px"
              :value="dayjs(startDate)"
              @change="handleDatePickerChange"
              :allowClear="false"
              placeholder="通过日期筛选"
            />
          </div>
        </div>

        <div class="mt-20px">
          <!-- 统计信息卡片 -->
          <Row :gutter="12" class="py-10px">
            <Col :span="8">
              <CardInfo :title="cardInfoLineOpen?.title" :list="cardInfoLineOpen?.list" />
            </Col>
            <Col :span="8">
              <CardInfo :title="cardInfoAddonResolve?.title" :list="cardInfoAddonResolve?.list" />
            </Col>
            <Col :span="8">
              <CardInfo :title="cardInfoRegStat?.title" :list="cardInfoRegStat?.list" />
            </Col>
          </Row>
          <!-- <Row :gutter="12" class="py-10px">
             <Col :span="6">
               <CardInfo :title="cardInfoMaterialBatchStock?.title" :list="cardInfoMaterialBatchStock?.list" />
             </Col>
             <Col :span="6">
               <CardInfo :title="cardInfoProductBatchStock?.title" :list="cardInfoProductBatchStock?.list" />
             </Col>
           </Row>
           <Row :gutter="12" class="py-10px">
             <Col :span="8">
               <CardInfo :title="cardInfoRegStat?.title" :list="cardInfoRegStat?.list" />
             </Col>
             <Col :span="8">
               <CardInfo :title="cardInfoMaterialBatchStat?.title" :list="cardInfoMaterialBatchStat?.list" />
             </Col>
             <Col :span="8">
               <CardInfo :title="cardInfoProductBatchStat?.title" :list="cardInfoProductBatchStat?.list" />
             </Col>
           </Row> -->
        </div>
      </div>
    </div>

    <!-- 2、车间信息统计 -->
    <div class="dpanel mt-20px">
      <div class="dpanel-area">
        <p class="text-gray-400">2、车间信息统计</p>
        <Select
          :style="{ width: '180px', marginLeft: '8px' }"
          v-model:value="workshopId"
          placeholder="选择车间"
          @change="handleWorkshopIdChange"
        >
          <Select.Option v-for="{ id, workshopName } in workshopList" :key="id" :value="id">
            {{ workshopName }}
          </Select.Option>
        </Select>
      </div>
    </div>
    <div class="mt-20px">
      <AnalyWorkshop
        v-if="workshopId !== undefined && staticsData"
        :workshopId="workshopId"
        :workshopInfo="workshopInfo"
        :startDate="startDate"
        :staticsData="staticsData"
      />
      <div v-else class="dashboard-placeholder">车间数据加载中...</div>
    </div>
    <!-- 3、异常事件统计 -->
    <div class="dpanel mt-30px">
      <div class="dpanel-area">
        <p class="text-gray-400">3、异常事件统计</p>
      </div>
    </div>
    <div class="mt-15px">
      <WarningCard />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
  import { replaceUrlQuery } from "/@/utils/router";
  import AnalyWorkshop from "/@/views/AnalyWorkshop/index.vue";
  import { formatDateByDayjs, parseSearch, isToday } from "/@/utils/util";
  import WarningCard from "/@/views/Dashboard/warningCard.vue";
  import { useAppStore } from "/@/store";
  import { WorkshopInfo } from "/@/api/model/workshop";
  import { Col, DatePicker, Row, Select, Tag } from "ant-design-vue";
  import { workshopListAll } from "/@/api/workshop";
  import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons-vue";
  import dayjs, { Dayjs } from "dayjs";
  import CardInfo from "./card-info.vue";
  import { CardInfoData } from "./type";
  import { numberToFixed } from "/@/utils/math";
  import { statisticsPlatformBasic, statisticsWorkshop } from "/@/api/statistics";
  import { StatisticsPlatformBasicData, StatisticsWorkshopData } from "/@/api/model/statistics";

  const searchWorkshopId = Number(parseSearch().workshopId) || undefined;
  const searchStartDate = parseSearch().startDate || formatDateByDayjs();
  const searchEndDate = parseSearch().endDate || formatDateByDayjs();

  const refreshMinute = 1;
  const workshopId = ref<number | undefined>(searchWorkshopId);
  const workshopList = ref<WorkshopInfo[]>([]);
  const workshopInfo = computed(() => workshopList.value.find((i) => i.id === workshopId.value));

  const startDate = ref(searchStartDate);
  const endDate = ref(searchEndDate);
  const isDateToday = computed(() => isToday(startDate.value));

  const staticsData = ref<StatisticsWorkshopData>();

  const appStore = useAppStore();

  const latestStaticsTimer = reactive({
    timer: null as any,
    delay: 60 * 1000 * refreshMinute,
  });

  const cardInfoList = ref<CardInfoData[]>([]);

  const cardInfoLineOpen = computed(() => cardInfoList.value.find((i) => i.key === "lineOpen"));
  const cardInfoAddonResolve = computed(() => cardInfoList.value.find((i) => i.key === "addonResolve"));
  const cardInfoMaterialBatchStock = computed(() => cardInfoList.value.find((i) => i.key === "materialBatchStock"));
  const cardInfoProductBatchStock = computed(() => cardInfoList.value.find((i) => i.key === "productBatchStock"));
  const cardInfoRegStat = computed(() => cardInfoList.value.find((i) => i.key === "regStat"));
  const cardInfoMaterialBatchStat = computed(() => cardInfoList.value.find((i) => i.key === "materialBatchStat"));
  const cardInfoProductBatchStat = computed(() => cardInfoList.value.find((i) => i.key === "productBatchStat"));

  onMounted(async () => {
    try {
      await toGetNeedInfo();
      // 只请求一次：toGetLatestStatisData 内部已经会调用 toGetStatisData。
      await toGetLatestStatisData();
    } catch (error) {
      // 页面初始化请求失败不能阻断路由页面本体挂载。
      console.error("[Dashboard] 页面初始化失败：", error);
    }
  });

  onUnmounted(() => {
    clearLatestStatisDataInterval();
  });

  /** 清除生产数量轮询 */
  function clearLatestStatisDataInterval() {
    clearInterval(latestStaticsTimer.timer);
  }

  /** 轮询获取最近看板数据 */
  async function toGetLatestStatisData() {
    const sd = startDate.value;

    // 这个路由不再调用全局 createLoading。
    // 原全局 Loading 内部 mounted 异常会直接打断当前路由切换。
    await toGetStatisData();

    // 非今日，不开启轮询
    if (!isToday(sd)) {
      clearLatestStatisDataInterval();
      return;
    }

    clearLatestStatisDataInterval();

    latestStaticsTimer.timer = setInterval(() => {
      void toGetStatisData().catch((error) => {
        console.error("[Dashboard] 刷新统计数据失败：", error);
      });
    }, latestStaticsTimer.delay);
  }

  /** 请求统计数据 */
  async function toGetStatisData() {
    const wid = workshopId.value;

    if (wid === undefined) {
      staticsData.value = undefined;
      return;
    }
    let sd = startDate.value;
    // let ed = endDate.value;

    // 结束时间和开始时间暂相同
    let ed = startDate.value;

    const startYmd = formatDateByDayjs(sd);
    const endYmd = formatDateByDayjs(ed);

    if (startYmd) {
      sd = startYmd + " 00:00:00";
    }

    if (endYmd) {
      ed = endYmd + " 23:59:59";
    }

    // 两个请求并行，并且真正等待完成。
    // 原来的 .then() 会让 async 函数提前结束，导致初始化时序失控。
    const [workshopData, platformBasicData] = await Promise.all([
      statisticsWorkshop({ workshopId: wid, startDate: sd, endDate: ed }),
      statisticsPlatformBasic({ startDate: sd, endDate: ed }),
    ]);

    staticsData.value = workshopData;
    cardInfoList.value = toParsePlatformBasicData(platformBasicData);
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
      workshopId.value = lList.length > 0 ? lList[0].id : undefined;
    }
  }

  /** 切换全屏 */
  function toggleFullscreen() {
    appStore.setFullscreen(!appStore.fullscreen);
  }

  /** 变化-车间id */
  async function handleWorkshopIdChange() {
    replaceUrlQuery(
      {
        workshopId: workshopId.value,
      },
      false
    );

    await toGetLatestStatisData();
  }

  /** 日期变化 */
  async function handleDatePickerChange(d: Dayjs | string) {
    const sd = formatDateByDayjs(d);

    startDate.value = sd;

    replaceUrlQuery(
      {
        startDate: sd,
      },
      false
    );

    await toGetLatestStatisData();
  }

  /** 解析平台基础数据 */
  function toParsePlatformBasicData(basicData: StatisticsPlatformBasicData) {
    // 加工数据
    const parseRules = [
      { key: "lineOpenRatio", text: "", resultCb: (res: number) => numberToFixed(res * 100) + "%" },
      { key: "addonResolveRatio", text: "", resultCb: (res: number) => numberToFixed(res * 100) + "%" },
      { key: "materialBatchStockRatio", text: "", resultCb: (res: number) => numberToFixed(res * 100) + "%" },
      { key: "productBatchStockRatio", text: "", resultCb: (res: number) => numberToFixed(res * 100) + "%" },
      { key: "regStatNew", text: "新增", resultCb: (res: number) => res, oneValue: true },
      { key: "regStatDoingRatio", text: "执行率", resultCb: (res: number) => numberToFixed(res * 100) + "%" },
      { key: "regStatDoneRatio", text: "完成率", resultCb: (res: number) => numberToFixed(res * 100) + "%" },
      { key: "materialBatchStatNew", text: "新增批", resultCb: (res: number) => res, oneValue: true },
      {
        key: "materialBatchStatQualifiedRatio",
        text: "合格率",
        resultCb: (res: number) => numberToFixed(res * 100) + "%",
      },
      {
        key: "materialBatchStatStockInRatio",
        text: "入库率",
        resultCb: (res: number) => numberToFixed(res * 100) + "%",
      },
      { key: "productBatchStatNew", text: "新增批", resultCb: (res: number) => res, oneValue: true },
      {
        key: "productBatchStatQualifiedRatio",
        text: "合格率",
        resultCb: (res: number) => numberToFixed(res * 100) + "%",
      },
      {
        key: "productBatchStatStockInRatio",
        text: "入库率",
        resultCb: (res: number) => numberToFixed(res * 100) + "%",
      },
    ];

    for (const [, value] of Object.entries(basicData)) {
      if (!Array.isArray(value)) {
        continue;
      }

      value.forEach((i) => {
        const findRule = parseRules.find((j) => j.key === i.key);
        if (findRule) {
          i.text = findRule.text;
          i.parseResult = findRule.resultCb(i.result);
          i.oneValue = findRule.oneValue;
        }
      });
    }
    console.log(basicData);

    const ciList: CardInfoData[] = [
      {
        key: "lineOpen",
        title: "产线开线率",
        list: basicData.lineOpen,
      },
      {
        key: "addonResolve",
        title: "安灯解决率",
        list: basicData.addonResolve,
      },
      {
        key: "materialBatchStock",
        title: "物料出入库比",
        list: basicData.materialBatchStock,
      },
      {
        key: "productBatchStock",
        title: "产品出入库比",
        list: basicData.productBatchStock,
      },
      {
        key: "regStat",
        title: "生产登记统计",
        list: basicData.regStat,
      },
      {
        key: "materialBatchStat",
        title: "物料批统计",
        list: basicData.materialBatchStat,
      },
      {
        key: "productBatchStat",
        title: "产品批统计",
        list: basicData.productBatchStat,
      },
    ];

    return ciList;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetWorkshopList();
  }
</script>

<style lang="less" scoped>
  @panel-height: 42px;
  .dpanel-box {
    margin-top: -8px;
    max-width: none;
  }

  .dashboard-placeholder {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    background: #fff;
  }

  .dpanel {
    position: relative;
    display: flex;
    align-items: center;
    height: @panel-height;
    padding-bottom: 6px;
    border-bottom: 1px dashed #ccc;
    &-area {
      display: flex;
      align-items: center;
    }
    &-tools {
      position: absolute;
      right: 0;
      bottom: 5px;
      .center();
    }
  }
</style>
