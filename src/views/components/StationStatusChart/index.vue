<template>
  <div class="schart">
    <!-- 左侧 -->
    <div class="left">
      <div class="left-header">
        <div class="left-header-item">工位名称</div>
      </div>
      <div class="left-body">
        <div class="left-body-item" v-for="item in formatVirtualStationList" :key="item.id">
          {{ getVirtualStationText(item) }}
        </div>
        <p v-if="!formatVirtualStationList.length" class="text-gray-400">暂无工位</p>
      </div>
    </div>
    <!-- {{ addonEventList }} -->
    <!-- 右侧 -->
    <div class="right">
      <div class="right-vertical"></div>
      <div class="right-header">
        <div class="right-header-item" :style="{ flex: bodyItemFlex[0] }">静电手环</div>
        <div class="right-header-item" :style="{ flex: bodyItemFlex[1] }">设备接地</div>
        <div class="right-header-item flex" :style="{ flex: bodyItemFlex[2] }">
          <div class="flex-center" :style="{ flex: 1 }"> 物料 </div>
          <div class="flex-center" :style="{ flex: 1 }"> 设备 </div>
          <div class="flex-center" :style="{ flex: 1 }"> 品质 </div>
          <div class="flex-center" :style="{ flex: 1 }"> 其他 </div>
          <div class="flex-center" :style="{ flex: 1 }"> 制程 </div>
        </div>
      </div>
      <div class="right-body">
        <div class="right-body-item" v-for="item in formatVirtualStationList" :key="item.id">
          <div class="right-body-item-sub" :style="{ flex: bodyItemFlex[0] }" @click="handleWristbandClick(item)">
            <Popover placement="top">
              <template #content>
                <div v-if="item.signalData && isSignalExist(item, 'wristband')">
                  <p class="text-gray-400"> 手环信号更新时间: </p>
                  <p>{{ formatDateByDayjs(item.signalData.wristband.timestamp, "YYYY-MM-DD HH:mm:ss") }}</p>
                </div>
                <div v-else class="text-gray-400">暂无信号</div>
              </template>
              <div v-if="!item.needWristband">/</div>
              <div
                v-else-if="item.signalData && isSignalExist(item, 'wristband')"
                class="circle"
                :class="item.signalData.wristband.payload === SignalPayloadCheck.ON && 'success'"
              ></div>
              <div v-else class="circle none"></div>
            </Popover>
          </div>

          <div class="right-body-item-sub" :style="{ flex: bodyItemFlex[1] }" @click="handleGroundClick(item)">
            <Popover placement="top">
              <template #content>
                <div v-if="item.signalData && isSignalExist(item, 'deviceGround')">
                  <p class="text-gray-400"> 接地信号更新时间: </p>
                  <p>{{ formatDateByDayjs(item.signalData.deviceGround.timestamp, "YYYY-MM-DD HH:mm:ss") }}</p>
                </div>
                <div v-else class="text-gray-400">暂无信号</div>
              </template>
              <div v-if="!item.needGround" class="text-gray-400">/</div>
              <div
                v-else-if="item.signalData && isSignalExist(item, 'deviceGround')"
                class="circle"
                :class="item.signalData.deviceGround.payload === SignalPayloadCheck.ON && 'success'"
              ></div>
              <div v-else class="circle none"></div>
            </Popover>
          </div>

          <Popover placement="top">
            <template #content>
              <div v-if="item.signalData && isSignalExist(item, 'addon')">
                <p class="text-gray-400"> 安灯信号更新时间: </p>
                <p>{{ formatDateByDayjs(item.signalData.addon.timestamp, "YYYY-MM-DD HH:mm:ss") }}</p>
              </div>
              <div v-else class="text-gray-400">暂无信号</div>
            </template>
            <!-- {{ item.signalData }} -->
            <div v-if="!item.needAddon" class="flex items-center justify-center" :style="{ flex: bodyItemFlex[2] }">/</div>
            <section v-else class="flex" :style="{ flex: bodyItemFlex[2] }">
              <div class="flex-center" :style="{ flex: 1 }">
                <div
                  class="circle"
                  :class="isAddonReady(item, AddonEventType.MATERIAL) ? 'warn' : 'close'"
                ></div>
              </div>

              <div class="flex-center" :style="{ flex: 1 }">
                <div
                  class="circle"
                  :class="isAddonReady(item, AddonEventType.DEVICE) ? 'warn' : 'close'"
                ></div>
              </div>

              <div class="flex-center" :style="{ flex: 1 }">
                <div
                  class="circle"
                  :class="isAddonReady(item, AddonEventType.QUALITY) ? 'warn' : 'close'"
                ></div>
              </div>

              <div class="flex-center" :style="{ flex: 1 }">
                <div
                  class="circle"
                  :class="isAddonReady(item, AddonEventType.OTHER) ? 'warn' : 'close'"
                ></div>
              </div>

              <div class="flex-center" :style="{ flex: 1 }">
                <div
                  class="circle"
                  :class="isAddonReady(item, AddonEventType.MULTIPLE) ? 'warn' : 'close'"
                ></div>
              </div>
            </section>
          </Popover>
        </div>
      </div>
    </div>
  </div>

  <!-- 弹窗 - 静电手环趋势图表【调试用】 -->
  <Modal
    :style="{ width: '75vw' }"
    v-model:visible="modalSignalChartState.visible"
    :title="modalSignalChartState.title"
    :footer="null"
    destroyOnClose
  >
    <SignalChart
      :type="modalSignalChartState.type"
      :virtualStationInfo="modalSignalChartState.virtualStationInfo"
      :registationInfo="props.registrationInfo"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { reactive, withDefaults, defineProps, computed, watch, ref, onMounted } from "vue";
  import SignalChart from "./SignalChart.vue";
  import { Modal, Popover } from "ant-design-vue";
  import { VirtualStationDetail } from "/@/api/model/virtualStation";
  import { StationLatestSignalData } from "/@/api/model/signal";
  import { getVirtualStationText } from "/@/config/parse";
  import { SignalPayloadCheck, SubModuleType, AddonEventStatus, AddonEventType } from "/@/enums/model";
  import { formatDateByDayjs } from "/@/utils/util";
  import { RegistrationDetail } from "/@/api/model/registration";
  import { AddonEventDetail } from "/@/api/model/addonEvent.js";

  type FormatVirtualStation = VirtualStationDetail & {
    signalData?: StationLatestSignalData;
  };

  interface Props {
    virtualStationList: VirtualStationDetail[];
    stationLatestSignalList?: StationLatestSignalData[];
    registrationInfo?: RegistrationDetail;
    addonEventList?: AddonEventDetail[];
  }

  const props = withDefaults(defineProps<Props>(), {
    virtualStationList: () => [],
    stationLatestSignalList: () => [],
    addonEventList: () => [],
  });

  const bodyItemFlex = [2, 2, 5.5];

  /** 弹窗 - 常规信号趋势 */
  const modalSignalChartState = reactive<{
    type?: SubModuleType;
    virtualStationInfo?: VirtualStationDetail;
    visible: boolean;
    title: string;
  }>({
    type: undefined,
    virtualStationInfo: undefined,
    visible: false,
    title: "信号趋势",
  });

  const formatVirtualStationList = ref<FormatVirtualStation[]>([]);

  /** 每个工位、每种类型只保留最新一条安灯事件 */
  const latestAddonEventMap = computed(() => {
    const eventMap = new Map<string, AddonEventDetail>();
    for (const event of props.addonEventList) {
      const key = `${Number(event.stationId)}-${Number(event.eventType)}`;
      const currentEvent = eventMap.get(key);
      if (!currentEvent || String(event.happenDate) >= String(currentEvent.happenDate)) {
        eventMap.set(key, event);
      }
    }
    return eventMap;
  });

  // 检测实时状态更新
  watch(
    () => props.stationLatestSignalList,
    () => {
      toFormatVirtualStationList();
    }
  );

  /** 对应信号是否存在 */
  function isSignalExist(item: FormatVirtualStation, key: keyof StationLatestSignalData) {
    if (item.signalData && item.signalData[key]) {
      return true;
    }
  }

  /** 对应工位、对应类型是否存在最新的待接收安灯事件 */
  function isAddonReady(item: FormatVirtualStation, eventType: AddonEventType) {
    const key = `${Number(item.stationId)}-${Number(eventType)}`;
    const latestEvent = latestAddonEventMap.value.get(key);
    return Number(latestEvent?.eventStatus) === Number(AddonEventStatus.READY);
  }

  /** 静电手环点击 */
  function handleWristbandClick(item: FormatVirtualStation) {
    modalSignalChartState.type = SubModuleType.WRISTBAND;
    modalSignalChartState.virtualStationInfo = item;
    modalSignalChartState.title = getVirtualStationText(item);
    modalSignalChartState.visible = true;
  }

  /** 设备接地点击 */
  function handleGroundClick(item: FormatVirtualStation) {
    modalSignalChartState.type = SubModuleType.DEVICE_GROUND;
    modalSignalChartState.virtualStationInfo = item;
    modalSignalChartState.title = getVirtualStationText(item);
    modalSignalChartState.visible = true;
  }

  /** 格式化虚拟工位列表 */
  function toFormatVirtualStationList() {
    const { virtualStationList: vl, stationLatestSignalList: sl } = props;
    const newList = [...vl] as FormatVirtualStation[];

    // 兼容无数据情况，从工位列表再逐个注入信号量
    newList.map((i) => {
      // 注入信号量数据
      const item = sl.find((j) => j && i.stationId === j.stationId);
      if (item) {
        const sd = _getStationSignalData(item.stationId);
        if (sd) {
          i.signalData = sd;
        }
      }
    });
    // console.log(newList);
    formatVirtualStationList.value = newList;
  }

  /** 获取当前工位对应信号量 */
  function _getStationSignalData(stationId: number) {
    const { stationLatestSignalList: sl } = props;
    const signalData = sl.find((i) => i.stationId === stationId);
    return signalData;
  }
  // watch(
  //   () => props.addonEventList,
  //   () => {
  //     console.log(props.addonEventList,"==============");
  //     // toFormatVirtualStationList();
  //   }
  // );
</script>

<style lang="less" scoped>
  @item-height: 36px;
  @circle-width: 22px;
  @left-flex: 1;
  @right-flex: 5;
  @border-color: #ccc;

  .baseHeaderItem() {
    font-weight: bold;
    height: @item-height;
    line-height: @item-height;
    text-align: center;
    white-space: nowrap;
  }
  .baseBodyItem {
    height: @item-height;
    line-height: @item-height;
    text-align: center;
    white-space: nowrap;
  }

  .schart {
    font-size: 15px;
    min-width: 500px;
    display: flex;
  }
  .left {
    flex: @left-flex;
    &-header {
      .center();

      &-item {
        .baseHeaderItem();
      }
    }
    &-body {
      &-item {
        .baseBodyItem();
      }
    }
  }

  .right {
    position: relative;
    flex: @right-flex;
    &-vertical {
      position: absolute;
      left: 3px;
      top: 10px;
      height: 100%;
      width: 1px;
      border-left: 1px solid @border-color;
    }
    &-header {
      display: flex;
      &-item {
        .baseHeaderItem();
      }
    }
    &-body {
      border-top: 1px solid @border-color;
      border-bottom: 1px solid @border-color;
      // border-left: 1px solid @border-color;
      &-item {
        display: flex;
        border-bottom: 1px dashed @border-color;
        &:last-child {
          border-bottom: none;
        }
        .baseBodyItem();
        &-sub {
          .center();
          &:nth-child(2) {
            border-right: 1px dashed @border-color;
          }
        }
      }
    }
  }

  .circle {
    width: @circle-width;
    height: @circle-width;
    border-radius: @circle-width;
    background: rgb(255, 175, 27);
    .simple-shadow();
    &.success {
      background: @color-success;
    }
    &.warn {
      background: @color-warn;
      box-shadow: 0 0 2px 3px #fa7c1496;
    }
    &.none {
      background: transparent;
      // box-shadow: none;
    }
    &.close {
      background: #dddddd;
    }
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
