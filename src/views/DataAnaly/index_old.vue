<template>
  <div class="dpanel-box" :style="{ width: panelWholeWidth + 'px' }">
    <!-- 顶部选项栏 -->
    <div class="dpanel">
      <!-- 1.产线信息 -->
      <div class="dpanel-area">
        <!-- <Select
          :style="{ width: '240px' }"
          size="large"
          v-model:value="lineId"
          placeholder="选择产线"
          @change="handleLineIdChange"
        >
          <Select.Option v-for="{ id, lineName } in lineList" :key="id" :value="id">
            {{ lineName }}
          </Select.Option>
        </Select> -->
        <LineRelate class="mr-6px !w-240px" v-model:lineId="lineId" @update:lineId="handleLineIdChange" size="large" />
      </div>
      <!-- 2.生产信息 -->
      <div class="dpanel-area">
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <p>生产产品:</p>
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
            <p>生产状态:</p>
            <TagRegistrationStatus v-if="registrationInfo" :value="registrationInfo.registrationStatus" size="small" />
            <span v-else>/</span>
          </div>
        </section>
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <p>开始时间:</p>
            <p class="text-gray-400">{{ registrationInfo?.startDate?.slice(0, -3) || "/" }}</p>
          </div>
          <div class="dpanel-sec-item">
            <p>结束时间:</p>
            <p class="text-gray-400">{{ registrationInfo?.endDate?.slice(0, -3) || "/" }}</p>
          </div>
        </section>
        <section class="dpanel-sec">
          <div class="dpanel-sec-item">
            <p class="mr-6px">生产进度:</p>
            <p class="text-20px text-primary" v-if="registrationInfo">
              <span v-if="latestProductData.beatProductNumber">{{ latestProductData.beatProductNumber }}</span>
              <span v-else>
                {{ registrationInfo.beatProductNumber || 0 }}
              </span>
              <span> / {{ registrationInfo.planProductNumber }}</span>
            </p>
          </div>
          <div class="dpanel-sec-item">
            <p class="mr-6px">实际生产:</p>
            <div v-if="registrationInfo">
              <p
                v-if="registrationInfo.registrationStatus === RegistrationStatus.END_REGISTRATION"
                class="text-20px text-primary"
              >
                {{ registrationInfo.actualProductNumber }}
              </p>
              <p v-else class="text-gray-400">(待登记结束)</p>
            </div>
            <span v-else>/</span>
          </div>
        </section>

        <!-- 安灯播报迷你版 -->
        <div class="dpanel-addon" v-if="isStatusMode && lineId">
          <AddonBoard :hidden="true" :lineId="lineId" />
        </div>

        <!-- 看板选项 -->
        <div class="dpanel-tools">
          <p class="hover-underline text-16px mr-5px">
            <span class="text-success" @click="setFiltration(true)"> 过滤 </span>
          </p>
          <p class="hover-underline text-16px mr-5px">
            <span v-if="dataPolling" class="text-warn" @click="closePolling"> 暂停 </span>
            <span v-else class="text-primary" @click="openPolling">恢复</span>
          </p>

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
                <Form.Item label="生产登记">
                  <Select placeholder="请选择" v-model:value="registrationId" @change="handleRegistrationIdChange">
                    <Select.Option
                      v-for="{
                        id,
                        startDate,
                        productInfo,
                        productId,
                        productAttrValueIdsList,
                      } in registrationSelectList"
                      :key="id"
                      :value="id"
                    >
                      <div class="flex">
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
                </Form.Item>
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
          <div class="affix ml-14px" :class="getModeTextClass" @click="handleModeChange"> {{ modeText }}</div>
        </div>
      </div>
    </div>

    <TestDebugger />
    <!-- 节拍分析 -->
    <SignalAnaly v-if="isSignalMode" ref="signalAnalyRef"></SignalAnaly>

    <!-- 状态分析 -->
    <StatusAnaly v-if="isStatusMode" ref="statusAnalyRef"></StatusAnaly>

    <Modal v-model:visible="isFiltration" title="过滤设置" width="640px"  @ok="handleOk">
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
  import SignalAnaly from "./SignalAnaly_old/index.vue";
  import StatusAnaly from "./StatusAnaly/index.vue";
  import TestDebugger from "./TestDebugger.vue";

  import { withDefaults, defineProps, computed, onMounted, ref, watch, nextTick, onUnmounted, reactive } from "vue";
  import { lineListAll } from "/@/api/line";
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
  import LineRelate from "/@/views/components/LineRelate/index.vue";
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

  /** 变化-线体id */
  async function handleLineIdChange() {
    replaceUrlQuery(
      {
        lineId: lineId.value,
      },
      false
    );

    nextTick(async () => {
      toGetRegistrationList();
      reloadAnaly();
      signalAnalyRef.value.setIsFirst(true);
    });
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

  /** 变化-登记信息 */
  async function handleRegistrationIdChange() {
    await reRenderAllData();
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
      rInfo = await registrationDetailGetByLatest(lid);
    }

    if (rInfo) {
      const { registrationStatus } = rInfo;

      // 同步id
      registrationId.value = rInfo.id;
      registrationInfo.value = rInfo;

      // 判断是不是生产中，如果是的话，就开启轮询查生产数量
      if (registrationStatus === RegistrationStatus.IN_REGISTRATION) {
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
    vInfo.virtualStationList = vInfo.virtualStationList.sort((a, b) => a.virtualStationSort-b.virtualStationSort) || [];

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

  /** 获取线体列表 */
  async function toGetLineList() {
    // 获取产线列表
    const lList = await lineListAll();
    lineList.value = lList;

    // 检测参数是否存在
    if (searchLineId) {
      lineId.value = searchLineId;
    } else {
      // 默认选中产线就是第一条
      lineId.value = lList.length > 0 ? lList[0].id : undefined;
    }
  }

  /** 获取登记列表（近30条） */
  async function toGetRegistrationList() {
    const lid = lineId.value;
    // const dateDelay = 360 * 24 * 60 * 60 * 1000;
    // const startDate = formatDateByDayjs(Date.now() - dateDelay, "YYYY-MM-DD HH:mm:ss");
    // const endDate = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");

    const records = await registrationListAll({
      sort: "id desc",
      lineId: lid,
      pageSize: 30,
      // startDate,
      // endDate,
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
    &-area {
      display: flex;
      color: #999;
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
