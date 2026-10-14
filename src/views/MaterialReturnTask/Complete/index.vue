<template>
  <div v-loading:absolute="loading">
    <!-- 1、生产任务单-退料列表 -->
    <SubTitle :size="AntUniversalSize.small" title="1、生产任务单-退料列表" />
    <Form.Item label="">
      <MaterialReturnTable
        v-if="prepareTaskInfo && returnTaskInfo"
        :materialPrepareTaskDemandList="prepareTaskInfo.materialPrepareTaskDemandList"
        :materialPrepareTaskItemList="prepareTaskInfo.materialPrepareTaskItemList"
        :materialReturnTaskItemList="returnTaskInfo.materialReturnTaskItemList"
        :hideColumns="getHideColumns"
      />
    </Form.Item>

    <div v-if="isEditMode" :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="warn w-240px mr-16px" type="primary" :style="normalBtnStyle" @click="handleSomeComplete">
          部分退料
        </Button>
        <Button class="w-240px" type="primary" :style="normalBtnStyle" @click="handleComplete"> 全部退料 </Button>
      </Form.Item>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Button, Form, Modal, message } from "ant-design-vue";
  import { onMounted, ref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import MaterialReturnTable from "./return-table.vue";
  import {
    materialReturnTaskComplete,
    materialReturnTaskDetail,
    materialReturnTaskSomeComplete,
  } from "/@/api/materialReturnTask";
  import { MaterialReturnTaskDetail } from "/@/api/model/materialReturnTask";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { MaterialPrepareTaskDetail } from "/@/api/model/materialPrepareTask";
  import { materialPrepareTaskDetail } from "/@/api/materialPrepareTask";

  interface Props {
    mode?: CommonComponentMode;
    materialPrepareTaskId: number;
    materialReturnTaskId: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
  });

  const emits = defineEmits(["change:ok"]);

  const loading = ref(false);

  const prepareTaskInfo = ref<MaterialPrepareTaskDetail>();
  const returnTaskInfo = ref<MaterialReturnTaskDetail>();

  const returnTaskComplete = ref(true);

  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const isEditMode = props.mode === CommonComponentMode.EDIT;

  const getHideColumns = computed(() => {
    return isDetailMode ? "returnValue" : "";
  });

  onMounted(async () => {
    await toGetNeedInfo();
  });

  /** 获取退料批次列表 */
  function getReturnTaskItemList() {
    const dList = prepareTaskInfo.value?.materialPrepareTaskDemandList!!;
    // 获取退料批次列表
    const returnBatchList = dList
      .map((i) => {
        const { materialId, materialSpecsId } = i;
        // 注入 materialId, materialSpecsId
        // 数据加工
        i.materialBatchList.forEach((j) => {
          j.materialId = materialId;
          j.materialSpecsId = materialSpecsId;
        });
        // 返回批次列表
        return i.materialBatchList;
      })
      .flat()
      .filter((i) => i.returnValue);

    // 数据结构化
    const materialReturnTaskItemList = returnBatchList.map((i) => ({
      ...i,
      id: undefined,
      materialBatchId: i.id,
      value: i.returnValue,
    }));

    return materialReturnTaskItemList;
  }

  /** 部分退料 */
  async function handleSomeComplete() {
    const materialReturnTaskItemList = getReturnTaskItemList();
    if (!materialReturnTaskItemList.length) {
      message.warn("未存在退料项");
      return;
    }

    Modal.confirm({
      title: `确认部分退料？`,
      content: "后续可以继续提交",
      okText: "部分退料",
      cancelText: "取消",
      async onOk() {
        const { id } = returnTaskInfo.value!!;

        const data = { id, materialReturnTaskItemList };
        await materialReturnTaskSomeComplete(data);
        emits("change:ok");
      },
      onCancel() {},
    });
  }

  /** 全部退料 */
  async function handleComplete() {
    const materialReturnTaskItemList = getReturnTaskItemList();

    const noItemText = !materialReturnTaskItemList.length ? "未存在退料项, " : "";

    Modal.confirm({
      title: `${noItemText}确认全部退料？`,
      content: "后续可以继续提交",
      okText: "全部退料",
      cancelText: "取消",
      async onOk() {
        const { id } = returnTaskInfo.value!!;

        const data = { id, materialReturnTaskItemList };
        await materialReturnTaskComplete(data);
        emits("change:ok");
      },
      onCancel() {},
    });
  }

  /** 获取退料单详情 */
  async function toGetMaterialReturnTaskInfo() {
    const { materialReturnTaskId } = props;
    const mptInfo = await materialReturnTaskDetail(materialReturnTaskId);
    returnTaskInfo.value = mptInfo;
  }

  /** 获取退料单详情 */
  async function toGetMaterialPrepareTaskInfo() {
    const { materialPrepareTaskId } = props;
    const mptInfo = await materialPrepareTaskDetail(materialPrepareTaskId);
    prepareTaskInfo.value = mptInfo;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    loading.value = true;

    await toGetMaterialPrepareTaskInfo();
    await toGetMaterialReturnTaskInfo();

    loading.value = false;
  }
</script>

<style></style>
