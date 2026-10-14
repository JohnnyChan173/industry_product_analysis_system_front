<template>
  <div class="text-18px flex fullscreen" v-if="!hidden">
    <section>
      <div class="text-22px flex">
        <span> 产线名称：{{ lineInfo?.lineName }} </span>
        <div class="!text-24px text-gray-400 hover-opacity ml-12px" @click="resetData">
          <ReloadOutlined />
        </div>
      </div>
      <div class="py-12px">
        当前登记：<span class="text-primary">{{ registrationInfo?.registrationNo }}</span>
      </div>
      <div class="py-12px">生产产品：{{ registrationInfo?.productInfo.productName }}</div>
      <div class="py-12px"
        >生产状态：
        <TagRegistrationStatus :value="registrationInfo?.registrationStatus" size="large" />
      </div>
      <div class="mt-12px">
        <Button v-if="canVoice" type="primary" size="large" class="warn" @click="handleStop">停止</Button>
        <Button v-else type="primary" size="large" @click="handleRecover">开始播报</Button>
      </div>
    </section>
    <section class="ml-18px pl-6px" style="border-left: 1px solid #ccc">
      <div v-if="noReceiveAddonEventList.length">
        <p class="my-8px">待解决安灯事件列表:</p>
        <div
          v-for="(item, index) in noReceiveAddonEventList"
          :key="item.id"
          class="text-18px p-10px"
          :class="index === boardData.voiceIndex && 'text-primary font-bold !text-20px'"
        >
          <span>{{ index + 1 }}. 工位信息：{{ item.virtualStationInfo.virtualStationName }}</span>
          <span>, 发生时间：{{ item.happenDate }}</span>
          <span>, 问题类型：{{ getListItemLabel(AddonEventTypeList, item.eventType) }}</span>
          <span>, 事件管理员：{{ item.eventStaffInfo?.staffName }}</span>
        </div>
      </div>
      <div v-else-if="canVoice" class="text-gray-400">暂无事件数据!</div>
    </section>
  </div>
  <div v-else>
    <Checkbox v-model:checked="canVoice" @change="onCanVoiceCheckboxChange">
      <!-- 检测是否已启用 -->
      <div v-if="canVoice">
        <span v-if="noReceiveAddonEventList.length > 0" class="text-warn">
          {{ noReceiveAddonEventList.length }}个事件
        </span>
        <span v-else class="text-success">正常</span>
      </div>
      <div v-else>
        <span>未启用播报</span>
      </div>
    </Checkbox>
  </div>
</template>
<script setup lang="ts">
  import { defineExpose, withDefaults, defineProps, computed, onMounted, reactive, ref, onUnmounted } from "vue";
  import { delay, parseSearch } from "/@/utils/util";
  import { lineDetail } from "/@/api/line";
  import { LineDetail } from "/@/api/model/line";
  import { RegistrationDetail } from "/@/api/model/registration";
  import { registrationDetailGetByLatest } from "/@/api/registration";
  import TagRegistrationStatus from "../baseComponents/TagRegistrationStatus.vue";
  import { AddonEventDetail } from "/@/api/model/addonEvent";
  import { addonEventListByRegistrationId } from "/@/api/addonEvent";
  import { AddonEventTypeList, getListItemLabel } from "/@/config/data";
  import { AddonEventStatus, AddonEventType, RegistrationStatus } from "/@/enums/model";
  import { Button, Checkbox, message } from "ant-design-vue";
  import { ReloadOutlined } from "@ant-design/icons-vue";
  import { createLoading } from "/@/components/Loading/createLoading";
  interface Props {
    hidden?: boolean;
    lineId: number;
  }
  const props = withDefaults(defineProps<Props>(), {
    hidden: false,
    lineId: undefined,
  });
  defineExpose({
    start: handleRecover,
    stop: handleStop,
  });
  const searchParams = parseSearch();
  const canVoice = ref(false);
  const lineId = props.lineId ? props.lineId : Number(searchParams.lineId);
  const lineInfo = ref<LineDetail>();
  const registrationInfo = ref<RegistrationDetail>();
  const addonEventList = ref<AddonEventDetail[]>([]);
  const VOICE_DELAY = 1000;
  const noReceiveAddonEventList = computed(() => {
    const l = addonEventList.value.filter((i) => i.eventStatus === AddonEventStatus.READY);
    console.log(l);
    return l;
  });
  const boardData = reactive<any>({
    timer: null,
    delay: 1000,
    voiceList: [],
    voiceIndex: null,
    running: false,
    updating: false,
    sessionId: 0,
  });
  onMounted(async () => {
    await toGetNeedInfo();
  });
  onUnmounted(() => {
    handleStop();
  });
  function onCanVoiceCheckboxChange() {
    console.log(canVoice.value);
    if (canVoice.value) {
      handleRecover();
    } else {
      handleStop();
    }
  }
  // 恢复播报
  async function handleRecover() {
    // const rInfo = registrationInfo.value;
    // if (rInfo) {
    //   if (rInfo.registrationStatus === RegistrationStatus.END_REGISTRATION) {
    //     message.warn("当前登记已结束,无法播报");
    //     return;
    //   }
    // } else {
    //   message.warn("暂无生产登记!");
    //   return;
    // }
    canVoice.value = true;
    boardData.sessionId++;
    const sessionId = boardData.sessionId;
    await updateBoardData(sessionId);
    if (!canVoice.value || sessionId !== boardData.sessionId) {
      return;
    }
    // 开启轮询播报
    // clearInterval(boardData.timer);
    // boardData.timer = setInterval(() => {
    //   void updateBoardData(boardData.sessionId);
    // }, boardData.delay);
  }
  // 停止播报
  function handleStop() {
    canVoice.value = false;
    boardData.sessionId++;
    boardData.running = false;
    boardData.voiceIndex = null;
    clearInterval(boardData.timer);
    window.speechSynthesis.cancel();
  }
  // 简单实现
  function toVoiceSpeak(sessionId: number) {
    if (!canVoice.value || sessionId !== boardData.sessionId) {
      boardData.running = false;
      return;
    }
    const curIndex = boardData.voiceIndex;
    const text = boardData.voiceList[curIndex] || "";
    if (!text) {
      boardData.running = false;
      boardData.voiceIndex = null;
      return;
    }
    console.log(text);
    const msg = new SpeechSynthesisUtterance();
    const synth = window.speechSynthesis;
    msg.text = text; //要读的文字
    msg.lang = "zh-CN"; //读汉语
    msg.volume = 1; //音量
    msg.rate = 1.2; //语速
    msg.pitch = 0.8; //音色
    msg.addEventListener("start", () => {
      console.log("开始！！！！！");
    });
    msg.addEventListener("end", () => onVoiceEnd(sessionId));
    synth.speak(msg); //开始读
  }
  async function onVoiceEnd(sessionId: number) {
    if (!canVoice.value || sessionId !== boardData.sessionId) {
      boardData.running = false;
      return;
    }
    boardData.voiceIndex++;
    // 当前轮还有下一条
    if (boardData.voiceIndex < boardData.voiceList.length) {
      await delay(VOICE_DELAY);
      if (!canVoice.value || sessionId !== boardData.sessionId) {
        return;
      }
      toVoiceSpeak(sessionId);
      return;
    }
    // 当前轮播放完成
    boardData.running = false;
    boardData.voiceIndex = null;
    const roundEndTime = Date.now();
    // 马上请求下一轮数据，把接口耗时计算在 1000ms 内
    await updateBoardData(sessionId, roundEndTime);
  }
  /** 更新播报数据 */
  async function updateBoardData(sessionId: number, roundEndTime?: number) {
    if (!canVoice.value || boardData.running || boardData.updating || sessionId !== boardData.sessionId) {
      return;
    }
    boardData.updating = true;
    try {
      // ========== 新增：每轮更新前先刷新最新登记数据 ==========
      await refreshRegistrationInfo();
      if (!canVoice.value || sessionId !== boardData.sessionId) {
        return;
      }
      // ======================================================

      await toGetLatestAddonList();
      if (!canVoice.value || sessionId !== boardData.sessionId) {
        return;
      }
      const l = noReceiveAddonEventList.value;
      const voiceList = l.map((item) => {
        const stationText = item.virtualStationInfo.virtualStationName;
        const addonEventTypeText = getListItemLabel(AddonEventTypeList, item.eventType);
        const addonEventStaffText = item.eventStaffInfo?.staffName || "事件管理员";
        return `${stationText}工位,触发${addonEventTypeText}问题,请${addonEventStaffText}前往处理`;
      });
      boardData.voiceList = voiceList;
      if (!voiceList.length) {
        boardData.voiceIndex = null;
        // 没数据时 1 秒后继续检查
        await delay(VOICE_DELAY);
        if (canVoice.value && sessionId === boardData.sessionId) {
          void updateBoardData(sessionId);
        }
        return;
      }
      // 如果是上一轮刚结束，确保两轮之间总间隔尽量为 1000ms
      if (roundEndTime) {
        const elapsed = Date.now() - roundEndTime;
        const remaining = Math.max(0, VOICE_DELAY - elapsed);
        if (remaining > 0) {
          await delay(remaining);
        }
      }
      if (!canVoice.value || sessionId !== boardData.sessionId) {
        return;
      }
      boardData.voiceIndex = 0;
      boardData.running = true;
      toVoiceSpeak(sessionId);
    } finally {
      boardData.updating = false;
    }
  }
  /** 请求必要数据（初始化+手动重置使用，带加载动画） */
  async function toGetNeedInfo() {
    const { close } = createLoading();
    // 请求产线数据
    const linfo = await lineDetail(lineId);
    lineInfo.value = linfo;
    // 请求产线最新登记数据
    const rInfo = await registrationDetailGetByLatest(lineId);
    registrationInfo.value = rInfo;
    close();
  }
  /** ========== 新增：刷新最新登记数据（无加载动画，轮询使用） ========== */
  async function refreshRegistrationInfo() {
    const rInfo = await registrationDetailGetByLatest(lineId);
    registrationInfo.value = rInfo;
  }
  /** 获取最新安灯数据 */
  async function toGetLatestAddonList() {
    const rInfo = registrationInfo.value;
    if (rInfo) {
      // 如果存在登记数据获取安灯列表
      const records = await addonEventListByRegistrationId(rInfo.id);
      records.reverse();
      addonEventList.value = records;
    }
  }
  /** 重新获取数据 */
  async function resetData() {
    await toGetNeedInfo();
  }
</script>
<style></style>
