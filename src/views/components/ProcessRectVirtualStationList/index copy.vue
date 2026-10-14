<!-- 虚拟工位区-专用 -->
<template>
  <div class="rbox">
    <div class="text-right" v-if="isEditMode">
      <span class="text-14px" style="color: #ccc"> (可拖拽变更顺序) </span>
    </div>
    <div class="rpanel">
      <div class="rlist">

        <!-- :draggable="isEditMode"
          @dragstart="() => handleDragStart(item.virtualStationUuid)"
          @dragover="(e) => e.preventDefault()"
          @drop="handleDrop" -->
        <div
          v-for="item in list"
          :key="item.id"
          class="rpanel-rect inline-block"
          @mouseenter="(e) => handleMouseEnter(e, item)"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          :data-uuid="item.virtualStationUuid"
        >
          <ProcessRect
            :mode="mode"
            :size="CommonComponentSize.SMALL"
            :uuid="item.virtualStationUuid"
            :active="activeUuid === item.virtualStationUuid"
            :is-diamond="isCheckProcedure(getVirtualStationFirstProcedure(item))"
            :title="getVirtualStationFirstProcedure(item)?.procedureName"
            :sub-title="item.virtualStationName"
            :color="getVirtualStationColor(item)"
            @select:edit="handleVirtualStationEdit(item)"
            @select:del="handleVirtualStationDel(item)"
            @select:click="handleVirtualStationSelect(item)"
          />
        </div>
      </div>
      <div v-if="isEditMode">
        <p v-if="stationList.length == 0" class="text-warn">请关联物理产线</p>
        <p v-else-if="craftProcedureList.length == 0" class="text-warn">请关联工艺</p>
        <p v-else-if="list.length === 0" class="text-gray-400">当前暂无虚拟工位，请创建。</p>
      </div>
    </div>
    <div class="text-right mt-6px" v-if="isEditMode && canOperate">
      <Button type="primary" ghost @click="handleVirtualStationAdd">创建虚拟工位 +</Button>
    </div>
  </div>

  <!-- 弹窗 - 创建虚拟工位 -->
  <Modal
    :style="{ minWidth: AntModalWidth.sm }"
    v-model:visible="modalVirtualStationAddState.visible"
    :title="modalVirtualStationAddState.title"
    :footer="null"
    :mask-closable="false"
    destroyOnClose
  >
    <VirtualStationAdd
      class="!-mt-20px"
      :stationList="stationList"
      :craftProcedureList="craftProcedureList"
      :info="modalVirtualStationAddState.info"
      @change:add="handleVirtualStationAddChange"
      @change:edit="handleVirtualStationEditChange"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { defineEmits, withDefaults, defineProps, ref, watch, reactive, unref, computed } from "vue";
  import { Button, Modal } from "ant-design-vue";
  import { CommonComponentMode, CommonComponentSize } from "/@/enums/commonEnum";
  import { VirtualStationDetail } from "/@/api/model/virtualStation";
  import { isCheckProcedure, getVirtualStationFirstProcedure, getVirtualStationColor } from "/@/config/parse";
  import ProcessRect from "/@/views/components/ProcessRect/index.vue";
  import VirtualStationAdd from "/@/views/components/ProcessRectVirtualStationList/VirtualStationAdd/index.vue";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { findParentDom } from "/@/utils/dom";
  import { StationInfo } from "/@/api/model/station";
  import { CraftProcedureDetail } from "/@/api/model/craftProcedure";

  interface Props {
    mode?: CommonComponentMode;
    stationList: StationInfo[];
    craftProcedureList: CraftProcedureDetail[];
    list: VirtualStationDetail[];
    defaultActiveUuid?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    stationList: () => [],
    craftProcedureList: () => [],
    list: () => [],
    defaultActiveUuid: "",
  });

  const emits = defineEmits(["select:click", "update:list", "exchange", "mouse:enter", "mouse:move", "mouse:leave"]);

  /** 弹窗 - 创建虚拟工位 */
  const modalVirtualStationAddState = reactive<{
    info?: VirtualStationDetail;
    visible: boolean;
    title: string;
  }>({
    info: undefined,
    visible: false,
    title: "创建虚拟工位",
  });

  /** 激活项uuid */
  const activeUuid = ref<string>(props.defaultActiveUuid);

  const dragStartUuid = ref("");

  const isDetailMode = computed(() => props.mode === CommonComponentMode.DETAIL);
  const isEditMode = computed(() => props.mode === CommonComponentMode.EDIT);

  const canOperate = computed(() => props.craftProcedureList.length && props.stationList.length);

  /** 鼠标划出 */
  function handleMouseLeave(e: MouseEvent) {
    emits("mouse:leave", e);
  }

  /** 鼠标移动 */
  function handleMouseMove(e: MouseEvent) {
    emits("mouse:move", e);
  }

  /** 鼠标划入 */
  function handleMouseEnter(e: MouseEvent, item: VirtualStationDetail) {
    emits("mouse:enter", e, item);
  }

  /** 拖拽 开始 - 虚拟工位 */
  function handleDragStart(uuid: string) {
    dragStartUuid.value = uuid;
  }

  /** 拖拽 放下 - 虚拟工位 */
  function handleDrop(e: DragEvent) {
    const parentElement = findParentDom(e.target as HTMLElement, "rpanel-rect");
    if (parentElement) {
      const endUuid = parentElement.getAttribute("data-uuid")!!;
      const startUuid = unref(dragStartUuid);
      console.log(startUuid, endUuid);
      // emits("exchange", startUuid, endUuid);
      handleProcedureExchange(startUuid, endUuid);
    }
  }

  /** 设置激活项 */
  function setActiveItem(uuid: string) {
    activeUuid.value = uuid;
  }

  /** 点击 - 虚拟工位选中 */
  function handleVirtualStationSelect(item: VirtualStationDetail) {
    setActiveItem(item.virtualStationUuid);
    emits("select:click", item);
  }

  /** 点击 - 交换虚拟工位 */
  function handleProcedureExchange(startUuid: string, endUuid: string) {
    const curList = Array.from(props.list);
    const startIndex = curList.findIndex((i) => i.virtualStationUuid === startUuid);
    const endIndex = curList.findIndex((i) => i.virtualStationUuid === endUuid);
    const startInfo = curList[startIndex];

    // 去掉首元素
    curList.splice(startIndex, 1);
    // 插至尾元素位置
    curList.splice(endIndex, 0, startInfo);

    setList(curList);
  }

  /** 点击 - 创建虚拟工位 */
  async function handleVirtualStationAdd() {
    modalVirtualStationAddState.info = undefined;
    modalVirtualStationAddState.visible = true;
    modalVirtualStationAddState.title = "创建虚拟工位";
  }

  /** 点击 - 虚拟工位 */
  async function handleProcedureClick(info: VirtualStationDetail) {}

  /** 点击 - 编辑虚拟工位 */
  async function handleVirtualStationEdit(info: VirtualStationDetail) {
    modalVirtualStationAddState.info = info;
    modalVirtualStationAddState.visible = true;
    modalVirtualStationAddState.title = "编辑虚拟工位";
  }

  /** 点击 - 删除虚拟工位 */
  async function handleVirtualStationDel(info: VirtualStationDetail) {
    const curList = Array.from(props.list);
    const { virtualStationUuid } = info;
    const findIndex = curList.findIndex((i) => i.virtualStationUuid === virtualStationUuid);

    curList.splice(findIndex, 1);
    setList(curList);
  }

  /** 变化 - 虚拟工位添加 */
  async function handleVirtualStationAddChange(info: VirtualStationDetail) {
    // 虚拟工位追加至最后
    const curList = Array.from(props.list);
    console.log(info);

    curList.push(info);
    setList(curList);

    modalVirtualStationAddState.info = undefined;
    modalVirtualStationAddState.visible = false;
  }

  /** 变化 - 虚拟工位编辑 */
  async function handleVirtualStationEditChange(info: VirtualStationDetail) {
    const curList = Array.from(props.list);
    const { virtualStationUuid } = info;
    const findIndex = curList.findIndex((i) => i.virtualStationUuid === virtualStationUuid);

    curList[findIndex] = info;
    setList(curList);

    modalVirtualStationAddState.info = undefined;
    modalVirtualStationAddState.visible = false;
  }

  /** 更新数组 */
  function setList(list: VirtualStationDetail[]) {
    emits("update:list", list);
  }
</script>

<style lang="less" scoped>
  .rpanel {
    position: relative;
    border: 1px dashed #999;
    padding: 10px 10px;
    min-height: 120px;
  }
</style>
