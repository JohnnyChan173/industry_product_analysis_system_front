<!-- 工艺工序区-专用 -->
<template>
  <div class="rbox">
    <div class="text-right" v-if="isEditMode">
      <span class="text-14px" style="color: #ccc"> (可拖拽变更顺序) </span>
    </div>
    <div class="rpanel">
      <div class="rlist">
        <div
          v-for="item in list"
          :key="item.id"
          class="rpanel-rect inline-block"
          :draggable="isEditMode"
          @dragstart="() => handleDragStart(item.procedureUuid)"
          @dragover="(e) => e.preventDefault()"
          @drop="handleDrop"
          :data-uuid="item.procedureUuid"
        >
          <ProcessRect
            :mode="mode"
            :size="CommonComponentSize.SMALL"
            :uuid="item.procedureUuid"
            :active="activeUuid === item.procedureUuid"
            :is-diamond="isCheckProcedure(item)"
            :title="item.procedureName"
            :color="themeColor.primary"
            :showBackground="false"
            @select:edit="handleProcedureEdit(item)"
            @select:del="handleProcedureDel(item)"
            @select:click="handleProcedureSelect(item)"
          />
        </div>
      </div>
      <p v-if="list.length === 0" class="text-gray-400">当前暂无工序，请创建。</p>
    </div>
    <div class="text-right mt-6px" v-if="isEditMode">
      <Button type="primary" ghost @click="handleProcedureAdd">创建工序 +</Button>
    </div>
  </div>

  <!-- 弹窗 - 创建工序 -->
  <Modal
    :style="{ minWidth: AntModalWidth.md }"
    v-model:visible="modalProcedureAddState.visible"
    :title="modalProcedureAddState.title"
    :footer="null"
    destroyOnClose
  >
    <ProcedureAdd
      :info="modalProcedureAddState.info"
      @change:add="handleProcedureAddChange"
      @change:edit="handleProcedureEditChange"
    />
  </Modal>
</template>

<script setup lang="ts">
  import { defineEmits, withDefaults, defineProps, ref, watch, reactive, unref, computed } from "vue";
  import { Button, Modal } from "ant-design-vue";
  import { CommonComponentMode, CommonComponentSize } from "/@/enums/commonEnum";
  import { CraftProcedureInfo } from "/@/api/model/craftProcedure";
  import { isCheckProcedure } from "/@/config/parse";
  import ProcessRect from "/@/views/components/ProcessRect/index.vue";
  import ProcedureAdd from "/@/views/components/ProcessRectProcedureList/ProcedureAdd/index.vue";
  import { themeColor } from "/@/settings/var";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { findParentDom } from "/@/utils/dom";
  import { craftProcedureDel, craftProcedureDetail } from "/@/api/craftProcedure";
  interface Props {
    mode?: CommonComponentMode;
    list: CraftProcedureInfo[];
    defaultActiveUuid?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    list: () => [],
    defaultActiveUuid: "",
  });

  const emits = defineEmits(["select:click", "update:list", "exchange"]);

  /** 弹窗 - 创建工序 */
  const modalProcedureAddState = reactive<{
    info?: CraftProcedureInfo;
    visible: boolean;
    title: string;
  }>({
    info: undefined,
    visible: false,
    title: "创建工序",
  });

  /** 激活项uuid */
  const activeUuid = ref<string>(props.defaultActiveUuid);

  const dragStartUuid = ref("");

  const isDetailMode = computed(() => props.mode === CommonComponentMode.DETAIL);
  const isEditMode = computed(() => props.mode === CommonComponentMode.EDIT);

  /** 拖拽 开始 - 工序 */
  function handleDragStart(uuid: string) {
    dragStartUuid.value = uuid;
  }

  /** 拖拽 放下 - 工序 */
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

  /** 点击 - 工序选中 */
  function handleProcedureSelect(item: CraftProcedureInfo) {
    setActiveItem(item.procedureUuid);
    emits("select:click", item);
  }

  /** 点击 - 交换工序 */
  function handleProcedureExchange(startUuid: string, endUuid: string) {
    const curList = Array.from(props.list);
    const startIndex = curList.findIndex((i) => i.procedureUuid === startUuid);
    const endIndex = curList.findIndex((i) => i.procedureUuid === endUuid);
    const startInfo = curList[startIndex];

    // 去掉首元素
    curList.splice(startIndex, 1);
    // 插至尾元素位置
    curList.splice(endIndex, 0, startInfo);

    setList(curList);
  }

  /** 点击 - 创建工序 */
  async function handleProcedureAdd() {
    modalProcedureAddState.info = undefined;
    modalProcedureAddState.visible = true;
    modalProcedureAddState.title = "创建工序";
  }

  /** 点击 - 工序 */
  async function handleProcedureClick(info: CraftProcedureInfo) {}

  /** 点击 - 编辑工序 */
  async function handleProcedureEdit(info: CraftProcedureInfo) {
    modalProcedureAddState.info = info;
    modalProcedureAddState.visible = true;
    modalProcedureAddState.title = "编辑工序";
  }

  /** 点击 - 删除工序 */
  async function handleProcedureDel(info: CraftProcedureInfo) {
    const curList = Array.from(props.list);
    const { procedureUuid,id } = info;
    const findIndex = curList.findIndex((i) => i.procedureUuid === procedureUuid);
    console.log(1234);
    if (findIndex === -1) {
      return;
    }
    curList.splice(findIndex, 1);
    setList(curList);
    await craftProcedureDel(id.toString());
  }

  /** 变化 - 工序添加 */
  async function handleProcedureAddChange(info: CraftProcedureInfo) {
    // 工序追加至最后
    const curList = Array.from(props.list);

    curList.push(info);
    setList(curList);

    modalProcedureAddState.info = undefined;
    modalProcedureAddState.visible = false;
  }

  /** 变化 - 工序编辑 */
  async function handleProcedureEditChange(info: CraftProcedureInfo) {
    const curList = Array.from(props.list);
    const { procedureUuid } = info;
    const findIndex = curList.findIndex((i) => i.procedureUuid === procedureUuid);

    curList[findIndex] = info;
    setList(curList);

    modalProcedureAddState.info = undefined;
    modalProcedureAddState.visible = false;
  }

  /** 更新数组 */
  function setList(list: CraftProcedureInfo[]) {
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
