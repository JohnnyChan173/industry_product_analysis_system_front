<template>
  <div class="dpanel-box" :style="{ width: panelWholeWidth + 'px' }">
    <!-- 顶部选项栏 -->
    <div class="dpanel">
      <!-- 1. 查询条件：先选车间，再选产线 -->
      <div class="dpanel-area dpanel-selectors">
        <Select
          v-model:value="workshopId"
          class="dpanel-workshop-select"
          size="large"
          placeholder="选择车间"
          :disabled="isXz"
          @change="handleWorkshopIdChange"
        >
          <Select.Option v-for="item in workshopSelectList" :key="item.id" :value="item.id">
            {{ item.workshopName }}
          </Select.Option>
        </Select>

        <Select
          v-model:value="lineId"
          class="dpanel-line-select"
          size="large"
          placeholder="选择产线"
          :disabled="isXz || !workshopId"
          @change="handleLineIdChange"
        >
          <Select.Option v-for="item in filteredLineList" :key="item.id" :value="item.id">
            {{ item.lineName }}
          </Select.Option>
        </Select>
      </div>
      <!-- 2.生产信息 -->
      <div class="dpanel-area">
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <div class="mr-6px">生产产品:</div>
            <Tag v-if="registrationInfo" color="blue" size="small">
              <ProductRelate
                class="text-primary"
                :mode="CommonComponentMode.DETAIL"
                :productId="registrationInfo.productId"
                :productAttrValueIdsList="registrationInfo.productAttrValueIdsList"
              />
            </Tag>
            <span v-else>/</span>
          </div>
          <div class="dpanel-sec-item">
            <div class="mr-6px">生产状态:</div>
            <TagRegistrationStatus v-if="registrationInfo" :value="registrationInfo.registrationStatus" size="small" />
            <span v-else>/</span>
          </div>
        </section>
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <div class="mr-6px">开始时间:</div>
            <div class="text-gray-400">{{ registrationInfo?.startDate?.slice(0, -3) || "/" }}</div>
          </div>
          <div class="dpanel-sec-item">
            <div class="mr-6px">结束时间:</div>
            <div class="text-gray-400">{{ registrationInfo?.endDate?.slice(0, -3) || "/" }}</div>
          </div>
        </section>
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <div class="mr-6px">生产进度:</div>
            <div class="text-20px text-primary" v-if="registrationInfo">
              <span v-if="latestProductData.beatProductNumber">{{ latestProductData.beatProductNumber }}</span>
              <span v-else>
                {{ registrationInfo.beatProductNumber || 0 }}
              </span>
              <span> / {{ registrationInfo.planProductNumber }}</span>
            </div>
          </div>
          <div class="dpanel-sec-item">
            <div class="mr-6px">实际生产:</div>
            <div v-if="registrationInfo">
              <div
                v-if="registrationInfo.registrationStatus === RegistrationStatus.END_REGISTRATION"
                class="text-20px text-primary"
              >
                {{ registrationInfo.actualProductNumber }}
              </div>
              <div v-else class="text-gray-400">(待登记结束)</div>
            </div>
            <span v-else>/</span>
          </div>
        </section>
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <div class="mr-6px">员工人数:</div>
            <div class="text-gray-400">{{ registrationInfo?.staffSignList?.length || "/" }}</div>
          </div>
          <div class="dpanel-sec-item">
            <div class="mr-6px">工序数量:</div>
            <div class="text-gray-400">{{ virtualLineInfo?.virtualStationList?.length || "/" }}</div>
          </div>
        </section>

        <!-- 安灯播报迷你版 -->
        <div class="dpanel-addon" v-if="isStatusMode && lineId">
          <AddonBoard :hidden="true" :lineId="lineId" />
        </div>

        <!-- 看板选项 -->
        <div class="dpanel-tools">
          <!-- 生产登记：复用 DataAnaly 原有选择方式，直接选择当前产线任意登记 -->
          <Select
            v-model:value="registrationId"
            class="registration-select"
            placeholder="选择生产登记"
            :disabled="!lineId || registrationSelectList.length === 0"
            @change="handleRegistrationIdChange"
          >
            <Select.Option
              v-for="{
                id,
                startDate,
                productId,
                productAttrValueIdsList,
              } in registrationSelectList"
              :key="id"
              :value="id"
            >
              <div class="flex items-center">
                <span class="mr-4px text-gray-400">[{{ formatDateByDayjs(startDate) }}]</span>
                <ProductRelate
                  class="text-primary"
                  :mode="CommonComponentMode.DETAIL"
                  :productId="productId"
                  :productAttrValueIdsList="productAttrValueIdsList"
                />
              </div>
            </Select.Option>
          </Select>

          <p class="hover-underline text-16px mr-5px">
            <span class="text-success" @click="setFiltration(true)"> 过滤 </span>
          </p>
          <p v-if="!isHistoryRegistration" class="hover-underline text-16px mr-5px">
            <span v-if="dataPolling" class="text-warn" @click="closePolling"> 暂停 </span>
            <span v-else class="text-primary" @click="openPolling">恢复</span>
          </p>
          <Tag v-else color="orange" class="mr-8px">历史登记</Tag>

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

          <Popover placement="bottom" trigger="click">
            <template #content>
              <Form class="detail w-320px" :labelCol="{ style: { width: '70px' } }">
<Form.Item label="标准节拍" v-if="virtualLineInfo">
                  <InputNumber
                    v-model:value="virtualLineInfo.standardBeat"
                    :min="10"
                    placeholder="虚拟产线标准节拍"
                    @change="debounceToStandardBeatChange"
                  />
                </Form.Item>
                <Form.Item v-if="lineId && registrationId">
                  <div class="flex items-center">
                    <Button type="primary" class="warn" @click="handleResetRegistration">重置登记</Button>
                  </div>
                </Form.Item>
              </Form>
            </template>
            <div class="!text-24px !text-primary mr-8px hover-opacity">
              <SettingOutlined />
            </div>
          </Popover>

          <div class="!text-24px hover-opacity" @click="reloadAnaly">
            <ReloadOutlined />
          </div>
          <div
            v-if="!isHistoryRegistration"
            class="affix ml-14px"
            :class="getModeTextClass"
            @click="handleModeChange"
          >
            {{ modeText }}
          </div>
        </div>
      </div>
    </div>

    <TestDebugger />
    <!--
      最新登记：保持原来的实时分析面板不变。
      历史登记：切换为生产登记详情同款面板
      （岗位登记总产能 + 岗位标准标准小时产能 + 当日线平衡）。
    -->
    <SignalAnaly
      v-if="isSignalMode || isHistoryRegistration"
      ref="signalAnalyRef"
      :detailView="isHistoryRegistration"
      :info="isHistoryRegistration ? registrationInfo : undefined"
    />

    <!-- 历史登记不显示状态分析，只显示登记详情分析面板 -->
    <StatusAnaly v-if="isStatusMode && !isHistoryRegistration" ref="statusAnalyRef"></StatusAnaly>

    <Modal v-model:visible="isFiltration" title="过滤设置" width="640px" @ok="handleOk">
      <div class="flex items-center justify-center">
        <h3 class="text-18px font-bold text-primary w-106px"> 过滤工位: </h3>
        <a-select
          v-model:value="FiltrationValue"
          mode="multiple"
          style="width: 100%"
          placeholder="请选择过滤工位"
          :options="
            virtualLineInfo!!.virtualStationList.map((i) => ({
              value: i.id,
              label: i.stationInfo.stationNo + '-' + i.virtualStationName,
            }))
          "
          :allowClear="true"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
  import { Button, Form, InputNumber, message, Modal, Popover, Select, Tag } from "ant-design-vue";
  import { FullscreenExitOutlined, FullscreenOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons-vue";
  import SignalAnaly from "./SignalAnaly/index.vue";
  import StatusAnaly from "./StatusAnaly/index.vue";
  import TestDebugger from "./TestDebugger.vue";

  import { withDefaults, defineProps, computed, onMounted, ref, watch, nextTick, onUnmounted, reactive } from "vue";
  import { lineListAll } from "/@/api/line";
  import { workshopListAll } from "/@/api/workshop";
  import { replaceUrlQuery } from "/@/utils/router";
  import { debounce, formatDateByDayjs, parseSearch } from "/@/utils/util";
  import { staffListAll } from "/@/api/staff";
  import { RegistrationStatus, StaffType } from "/@/enums/model";
  import { AnalyMode, panelWholeWidth, useData } from "./useData";
  import {
    registrationAdd,
    registrationDel,
    registrationDetail,
    registrationDetailGetByLatest,
    registrationEdit,
    registrationLatestBeatProductNumber,
    registrationList,
    registrationListAll,
    registrationStaffSign,
    registrationStart,
  } from "/@/api/registration";
  import TagRegistrationStatus from "/@/views/baseComponents/TagRegistrationStatus.vue";
  import TagProduct from "/@/views/baseComponents/TagProduct.vue";
  import { virtualLineDetail, virtualLineEdit } from "/@/api/virtualLine";
  import { useAppStore, useUserInfoStore } from "/@/store";
  import { RegistrationDetail } from "/@/api/model/registration";
  import { createLoading } from "/@/components/Loading/createLoading";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { defaultPageSize } from "/@/config";
  import AddonBoard from "/@/views/AddonBoard/index.vue";
  import { useStationStore } from "/@/store";
  import { updateIsFilter } from "/@/api/virtualStation.js";

  const stationStore = useStationStore();

  interface Props {
    mode: AnalyMode;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: AnalyMode.Status,
  });

  const {
    lineList,
    staffList,
    lineId,
    registrationId,
    registrationInfo,
    registrationSelectList,
    virtualLineInfo,
    virtualStationList,
    selectVirtualStationId,
    dataPolling,
    clearData,
  } = useData();

  const appStore = useAppStore();
  const { isXz, manageLineId } = useUserInfoStore();

  /** 顶部选择：车间 -> 产线 -> 生产登记 */
  const workshopId = ref<number | undefined>();
  const workshopSelectList = ref<any[]>([]);

  function getLineWorkshopId(item: any) {
    return item?.workshopId ?? item?.workshopInfo?.id;
  }

  const filteredLineList = computed(() => {
    const wid = workshopId.value;
    if (!wid) return [];

    return lineList.value.filter((item: any) => String(getLineWorkshopId(item)) === String(wid));
  });

  /**
   * registrationSelectList 按 id desc 获取，
   * 第一条就是当前产线的最新登记。
   */
  const latestRegistrationId = computed(() => registrationSelectList.value?.[0]?.id);

  /** 当前是否正在查看历史登记 */
  const isHistoryRegistration = computed(() => {
    const currentId = registrationId.value;
    const latestId = latestRegistrationId.value;

    if (!currentId || !latestId) return false;
    return String(currentId) !== String(latestId);
  });

  const searchMode = Number(parseSearch().mode) || props.mode;
  const searchLineId = isXz ? manageLineId : Number(parseSearch().lineId) || "";

  const mode = ref(searchMode);
  const isSignalMode = computed(() => mode.value === AnalyMode.Signal);
  const isStatusMode = computed(() => mode.value === AnalyMode.Status);
  const modeText = computed(() => (isSignalMode.value ? "节拍分析" : "状态分析"));
  const getModeTextClass = computed(() => (isSignalMode.value ? "signal" : "status"));

  const signalAnalyRef = ref();
  const statusAnalyRef = ref();
  const latestProductData = reactive({
    timer: null as any,
    delay: 5000,
    beatProductNumber: 0,
  });

  const debounceToStandardBeatChange = debounce(onStandardBeatChange, 500);

  onMounted(async () => {
    const { close } = createLoading();
    resizeAllChart();
    await toGetNeedInfo();
    close();
  });

  onUnmounted(() => {
    clearData();
    clearLatestProductDataInterval();
  });

  /** 重置登记 */
  async function handleResetRegistration() {
    const lid = lineId.value!!;
    const rid = registrationId.value!!;
    // 必须是当前产线 最新的登记 且为进行中 才可以重置
    const checkRInfo = await registrationDetailGetByLatest(lid);
    if (checkRInfo.id !== rid) {
      message.warn("当前登记非产线最新登记，无法重置");
      return;
    }

    if (checkRInfo.registrationStatus === RegistrationStatus.END_REGISTRATION) {
      message.warn("当前登记已结束，无法重置");
      return;
    }

    Modal.confirm({
      title: `确认重置当前生产登记: ${checkRInfo.registrationNo}`,
      content: "目前仅会重置“开始时间”，主要用于皮带线调试",
      okText: "重置开始时间",
      cancelText: "取消",
      async onOk() {
        const { id, lineId, productId, productAttrValueIdsList } = checkRInfo;

        await registrationEdit({
          id,
          startDate: formatDateByDayjs(Date.now() - 1000, "YYYY-MM-DD HH:mm:ss"),
          lineId,
          productId,
          productAttrValueIdsList,
        });

        await reloadAnaly();
      },
      onCancel() {},
    });
  }

  /** 关闭轮询 */
  function closePolling() {
    dataPolling.value = false;
    pauseAnaly();
  }

  /** 开启轮询 */
  function openPolling() {
    dataPolling.value = true;
    reloadAnaly();
  }

  /** 变化-车间：产线自动切换到该车间第一条，随后加载该产线最新登记 */
  async function handleWorkshopIdChange() {
    const firstLine = filteredLineList.value[0];
    lineId.value = firstLine?.id;

    if (!lineId.value) {
      registrationId.value = undefined;
      registrationInfo.value = undefined;
      registrationSelectList.value = [];
      virtualLineInfo.value = undefined;
      virtualStationList.value = [];
      selectVirtualStationId.value = undefined;
      clearLatestProductDataInterval();
      await reRenderPanel();
      return;
    }

    await handleLineIdChange();
  }

  /** 变化-线体id：默认仍加载该产线最新登记 */
  async function handleLineIdChange() {
    replaceUrlQuery(
      {
        lineId: lineId.value,
      },
      false
    );

    await reloadAnaly();
    signalAnalyRef.value?.setIsFirst?.(true);
  }

  /**
   * 变化-登记信息
   * 最新登记：保持原来的分析方式；
   * 历史登记：下面切换为生产登记详情分析面板，并关闭实时轮询。
   */
  async function handleRegistrationIdChange() {
    clearLatestProductDataInterval();

    if (isHistoryRegistration.value) {
      dataPolling.value = false;
      await pausePanel();
    } else {
      // 回到最新登记时恢复页面原来的默认实时行为。
      dataPolling.value = true;
    }

    // 等 detailView 模板分支完成切换后再重新渲染 ECharts。
    await nextTick();
    await reRenderAllData();
  }

  /** 过滤 */
  const isFiltration = ref(false);
  /** 设置过滤 */
  function setFiltration(val: boolean) {
    if (val) {
      FiltrationValue.value = virtualStationList.value.filter((i) => i.isFilter).map((i) => i.id);
      // stationStore.setStationList(FiltrationValue.value);
    }
    // 过滤
    isFiltration.value = val;
  }
  const FiltrationValue = ref<number[]>([]);
  async function onStandardBeatChange() {
    const vi = virtualLineInfo.value!!;
    const newBeat = vi.standardBeat;
    // 修改虚拟产线
    await virtualLineEdit({
      id: vi.id,
      standardBeat: newBeat,
    });

    // 重置图表
    await reloadAnaly();
    message.success("标准节拍已更新");
  }

  /** 切换全屏 */
  function toggleFullscreen() {
    appStore.setFullscreen(!appStore.fullscreen);

    nextTick(() => {
      resizeAllChart();
    });
  }

  /** 获取产线最新登记表 */
  async function toGetSelectRegistrationInfo() {
    const rid = registrationId.value;
    const lid = lineId.value;

    let rInfo: RegistrationDetail | null = null;
    console.log("ridridridridrid", rid);
    // 如果存在登记id 则请求对应数据
    if (rid) {
      rInfo = await registrationDetail(rid);
    } else if (lid) {
      const list = await registrationList({
        lineId: lid,
        pageNum: 1,
        taskStatus: 1,
        sort: "id desc",
        pageSize: 5,
      });

      const latest = list.records?.[0];
      if (latest?.id) {
        rInfo = await registrationDetail(latest.id);
      }
    }

    if (rInfo) {
      const { registrationStatus } = rInfo;

      // 同步id
      registrationId.value = rInfo.id;
      registrationInfo.value = rInfo;

      // 只有最新登记且正在生产时，才开启实时生产数量轮询。
      // 历史登记始终按静态历史数据展示。
      if (
        !isHistoryRegistration.value &&
        registrationStatus === RegistrationStatus.IN_REGISTRATION
      ) {
        toGetLatestBeatProductNumber();
      }
    }

    return rInfo;
  }

  /** 轮询获取实时节拍生产数量 */
  async function toGetLatestBeatProductNumber() {
    clearLatestProductDataInterval();

    await getLatestBeatProductNumber();

    latestProductData.timer = setInterval(async () => {
      await getLatestBeatProductNumber();
    }, latestProductData.delay);
  }

  /** 获取实时节拍生产数量 */
  async function getLatestBeatProductNumber() {
    const rid = registrationId.value!!;
    const number = await registrationLatestBeatProductNumber(rid);
    latestProductData.beatProductNumber = number;
  }

  /** 重新渲染全部数据 */
  async function reRenderAllData() {
    // 清除生产数量轮询
    clearLatestProductDataInterval();

    const info = await toGetSelectRegistrationInfo();
    console.log("infoinfoinfoinfo", info);
    // 如果登记信息存在
    if (info) {
      await toGetVirtualLineInfo();
      // let stationList = JSON.parse(localStorage.getItem("stationList") || "[]");
      // let virtualStationInfoIds = info.staffSignList.map((i) => i.virtualStationInfo.id);
      // stationList = stationList.filter((i: number) => virtualStationInfoIds.includes(i));
      // if (stationList) {
      //   FiltrationValue.value = stationList;
      //   stationStore.setStationList(stationList);
      // }
    }

    await reRenderPanel();
  }

  /** 清除生产数量轮询 */
  function clearLatestProductDataInterval() {
    latestProductData.beatProductNumber = 0;
    clearInterval(latestProductData.timer);
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

  /** 暂停整体 */
  async function pauseAnaly() {
    await pausePanel();
  }

  /** 重载整体*/
  async function reloadAnaly() {
    // reload / 切产线都回到该产线最新登记，保持原来的实时模式。
    dataPolling.value = true;

    // 更新登记信息
    registrationId.value = undefined;
    registrationInfo.value = undefined;
    selectVirtualStationId.value = undefined;
    clearLatestProductDataInterval();
    await toGetRegistrationList();
    await reRenderAllData();
  }

  /** 重渲染看板数据*/
  async function reRenderPanel() {
    // 历史/最新登记切换时 SignalAnaly 会切换不同模板，
    // 先等 DOM 更新，避免 ECharts 在旧容器或 0 宽高容器上重绘。
    await nextTick();

    // 更新看板内数据
    const signalRef = signalAnalyRef.value;
    const statusRef = statusAnalyRef.value;

    if (signalRef) {
      await signalRef.reRenderAllChart();
    }

    if (statusRef) {
      await statusRef.reRenderAllChart();
    }
  }

  /** 暂停渲染看板数据 */
  async function pausePanel() {
    // 更新看板内数据
    const signalRef = signalAnalyRef.value;
    const statusRef = statusAnalyRef.value;

    if (signalRef) {
      await signalRef.pausePanel();
    }

    if (statusRef) {
      await statusRef.pausePanel();
    }
  }

  /** 获取虚拟产线详情 */
  async function toGetVirtualLineInfo() {
    const { virtualLineId } = registrationInfo.value!!;
    // 通过虚拟产线
    const vInfo = await virtualLineDetail(virtualLineId);
    vInfo.virtualStationList =
      vInfo.virtualStationList.sort((a, b) => a.virtualStationSort - b.virtualStationSort) || [];

    virtualLineInfo.value = vInfo;

    // 虚拟产线中获取虚拟工位列表
    const { virtualStationList: vl, targetLineBalance } = vInfo;
    if (targetLineBalance) {
      localStorage.setItem("targetLineBalance", targetLineBalance);
    }
    virtualStationList.value = vl;

    const firstAvailableStation = vl.find((item) => !item.isFilter);
    if (firstAvailableStation) {
      // 默认选中第一个未过滤工位
      selectVirtualStationId.value = firstAvailableStation.id;
    } else {
      selectVirtualStationId.value = undefined;
    }
  }

  /** 获取员工列表 */
  async function toGetStaffList() {
    // 获取产线列表
    const sList = await staffListAll(StaffType.PUGONG);

    staffList.value = sList;
  }

  /** 获取车间列表 */
  async function toGetWorkshopList() {
    workshopSelectList.value = await workshopListAll();
  }

  /** 获取线体列表，并保持原来的默认选线逻辑 */
  async function toGetLineList() {
    const lList = await lineListAll();
    lineList.value = lList;

    let selectedLine: any;

    // 原逻辑保持不变：URL 有 lineId（或受限账号 manageLineId）优先，否则第一条。
    if (searchLineId) {
      selectedLine = lList.find((item: any) => String(item.id) === String(searchLineId));
    }

    if (!selectedLine) {
      selectedLine = lList[0];
    }

    lineId.value = selectedLine?.id;

    // 新增：根据默认产线反推车间，所以首次进入仍无需用户手动选择。
    const selectedWorkshopId = getLineWorkshopId(selectedLine);
    workshopId.value =
      selectedWorkshopId ??
      workshopSelectList.value.find((item: any) =>
        lList.some((line: any) => String(getLineWorkshopId(line)) === String(item.id))
      )?.id;
  }

  /** 获取当前产线登记列表（近30条） */
  async function toGetRegistrationList() {
    const lid = lineId.value;

    if (!lid) {
      registrationSelectList.value = [];
      return;
    }

    const records = await registrationListAll({
      sort: "id desc",
      lineId: lid,
      pageSize: 30,
    });

    registrationSelectList.value = records;
  }
  /** 确认过滤 */
  async function handleOk() {
    isFiltration.value = false;
    stationStore.setStationList(FiltrationValue.value);
    const stationFilterList =
      virtualLineInfo.value?.virtualStationList?.map((item) => {
        return {
          id: item.id,
          isFilter: FiltrationValue.value.includes(item.id) ? 1 : 0,
        };
      }) || [];

    await updateIsFilter(stationFilterList);
    await toGetVirtualLineInfo();
    await reRenderPanel();
  }
  /** 获取必要信息 */
  async function toGetNeedInfo() {
    await toGetStaffList();
    await toGetWorkshopList();
    await toGetLineList();
    await toGetRegistrationList();
    await reRenderAllData();
  }

  function handleModeChange() {
    if (isSignalMode.value) {
      mode.value = AnalyMode.Status;
    } else {
      mode.value = AnalyMode.Signal;
    }

    // 开启轮询
    dataPolling.value = true;

    replaceUrlQuery(
      {
        mode: mode.value,
      },
      false
    );

    nextTick(() => {
      reloadAnaly();
    });
  }
</script>

<style lang="less" scoped>
  @panel-height: 80px;
  .dpanel-box {
    margin-top: -8px;
    max-width: none;
  }

  .dpanel {
    position: relative;
    display: flex;
    align-items: center;
    height: @panel-height;
    // padding-bottom: 6px;
    border-bottom: 1px dashed #ccc;
    &-area {
      display: flex;
      color: #999;
    }

    &-selectors {
      flex: 0 0 auto;
      align-items: center;
      gap: 6px;
      margin-right: 8px;
    }
    &-sec {
      margin-left: 12px;
      &-item {
        display: flex;
        padding: 2px 0;
        > p {
          margin-right: 4px;
        }
      }
    }
    &-addon {
      position: absolute;
      right: 0;
      top: -8px;
      .center();
    }
    &-tools {
      position: absolute;
      right: 0;
      bottom: 5px;
      .center();
    }
    .dpanel-sec-item {
      align-items: center;
    }
  }

  .dpanel-workshop-select {
    width: 150px;
  }

  .dpanel-line-select {
    width: 170px;
  }

  .registration-select {
    width: 250px;
    margin-right: 10px;
  }

  .affix {
    font-size: 15px;
    height: 32px;
    width: 110px;
    border-top-left-radius: 32px;
    border-bottom-left-radius: 32px;
    background-color: #ccc;
    color: #fff;
    .center();
    .simple-shadow();
    .hover-opacity();
    transition: none;

    &-text {
      color: #fff;
      white-space: nowrap;
    }

    &.signal {
      background-color: @color-primary;
    }
    &.status {
      background-color: @color-warn;
    }
  }
</style>
