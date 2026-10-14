<template>
  <div v-loading:absolute="loading">
    <!-- 1、生产任务单-备料列表 -->
    <SubTitle :size="AntUniversalSize.small" title="1、生产任务单-备料列表" />
    <Form.Item label="">
      <MaterialPrepareTable
        v-if="prepareTaskInfo"
        v-model:materialPrepareTaskDemandList="prepareTaskInfo.materialPrepareTaskDemandList"
        :materialPrepareTaskItemList="prepareTaskInfo.materialPrepareTaskItemList"
        v-model:prepareTaskComplete="prepareTaskComplete"
        :hideColumns="getHideColumns"
      />
    </Form.Item>

    <div v-if="isEditMode" :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="warn w-240px mr-16px" type="primary" :style="normalBtnStyle" @click="handleSomeComplete">
          部分备料
        </Button>
        <Button class="w-240px" type="primary" :style="normalBtnStyle" @click="handleComplete"> 全部备料 </Button>
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
  import MaterialPrepareTable from "./prepare-table.vue";
  import {
    materialPrepareTaskComplete,
    materialPrepareTaskDetail,
    materialPrepareTaskSomeComplete,
  } from "/@/api/materialPrepareTask";
  import { MaterialPrepareTaskDetail } from "/@/api/model/materialPrepareTask";
  import { CommonComponentMode } from "/@/enums/commonEnum";

  interface Props {
    mode?: CommonComponentMode;
    materialPrepareTaskId: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
  });

  const emits = defineEmits(["change:ok"]);

  const loading = ref(false);

  const prepareTaskInfo = ref<MaterialPrepareTaskDetail>();

  const prepareTaskComplete = ref(true);

  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const isEditMode = props.mode === CommonComponentMode.EDIT;

  const getHideColumns = computed(() => {
    return isDetailMode ? "prepareValue" : "";
  });

  onMounted(async () => {
    await toGetNeedInfo();
  });

  /** 获取备料批次列表 */
  function getPrepareTaskItemList() {
    const dList = prepareTaskInfo.value?.materialPrepareTaskDemandList!!;
    // 获取备料批次列表
    const prepareBatchList = dList
      .map((i) => {
        const { materialId, materialSpecsId } = i;
        const materialPrepareTaskDemandId = i.id;
        // 注入 materialId, materialSpecsId, materialPrepareTaskDemandId
        // 数据加工
        i.materialBatchList.forEach((j) => {
          j.materialId = materialId;
          j.materialSpecsId = materialSpecsId;
          j.materialPrepareTaskDemandId = materialPrepareTaskDemandId;
        });
        // 返回批次列表
        return i.materialBatchList;
      })
      .flat()
      .filter((i) => i.prepareValue);

    // 数据结构化
    const materialPrepareTaskItemList = prepareBatchList.map((i) => ({
      ...i,
      id: undefined,
      materialBatchId: i.id,
      value: i.prepareValue,
    }));

    return materialPrepareTaskItemList;
  }

  /** 部分备料 */
  async function handleSomeComplete() {
    const materialPrepareTaskItemList = getPrepareTaskItemList();
    if (!materialPrepareTaskItemList.length) {
      message.warn("未存在备料项");
      return;
    }

    Modal.confirm({
      title: `确认部分备料？`,
      content: "后续可以继续提交",
      okText: "部分备料",
      cancelText: "取消",
      async onOk() {
        const { id } = prepareTaskInfo.value!!;

        const data = { id, materialPrepareTaskItemList };
        await materialPrepareTaskSomeComplete(data);
        emits("change:ok");
      },
      onCancel() {},
    });
  }

  /** 全部备料 */
  async function handleComplete() {
    const materialPrepareTaskItemList = getPrepareTaskItemList();
    if (!materialPrepareTaskItemList.length) {
      message.warn("未存在备料项");
      return;
    }

    Modal.confirm({
      title: `确认全部备料？`,
      content: "后续可以继续提交",
      okText: "全部备料",
      cancelText: "取消",
      async onOk() {
        const { id } = prepareTaskInfo.value!!;

        const data = { id, materialPrepareTaskItemList };

        await materialPrepareTaskComplete(data);
        emits("change:ok");
      },
      onCancel() {},
    });
  }

  /** 获取备料单详情 */
  async function toGetMaterialPrepareTaskInfo() {
    const { materialPrepareTaskId } = props;
    const mptInfo = await materialPrepareTaskDetail(materialPrepareTaskId);
    prepareTaskInfo.value = mptInfo;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    loading.value = true;

    await toGetMaterialPrepareTaskInfo();

    loading.value = false;
  }
</script>

<style></style>
