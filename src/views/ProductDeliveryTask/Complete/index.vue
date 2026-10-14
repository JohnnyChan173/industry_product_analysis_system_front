<template>
  <div v-loading:absolute="loading">
    <!-- 1、产品出库单-出库列表 -->
    <SubTitle :size="AntUniversalSize.small" title="1、产品出库单-出库列表" />
    <Form.Item label="">
      <MaterialPrepareTable
        v-if="productDeliveryTaskInfo"
        v-model:productDeliveryTaskDemandList="productDeliveryTaskInfo.productDeliveryTaskDemandList"
        :productDeliveryTaskItemList="productDeliveryTaskInfo.productDeliveryTaskItemList"
        :hideColumns="getHideColumns"
      />
    </Form.Item>

    <div v-if="isEditMode" :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="warn w-240px mr-16px" type="primary" :style="normalBtnStyle" @click="handleSomeComplete">
          部分出库
        </Button>
        <Button class="w-240px" type="primary" :style="normalBtnStyle" @click="handleComplete"> 出库完成 </Button>
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
    productDeliveryTaskComplete,
    productDeliveryTaskDetail,
    productDeliveryTaskSomeComplete,
  } from "/@/api/productDeliveryTask";
  import { ProductDeliveryTaskDetail } from "/@/api/model/productDeliveryTask";
  import { CommonComponentMode } from "/@/enums/commonEnum";

  interface Props {
    mode?: CommonComponentMode;
    productDeliveryTaskId: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
  });

  const emits = defineEmits(["change:ok"]);

  const loading = ref(false);

  const productDeliveryTaskInfo = ref<ProductDeliveryTaskDetail>();

  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const isEditMode = props.mode === CommonComponentMode.EDIT;

  const getHideColumns = computed(() => {
    return isDetailMode ? "prepareValue" : "";
  });

  onMounted(async () => {
    await toGetNeedInfo();
  });

  /** 获取出库批次列表 */
  function getProductDeliveryTaskItemList() {
    const dList = productDeliveryTaskInfo.value?.productDeliveryTaskDemandList!!;
    // 获取出库批次列表
    const prepareBatchList = dList
      .map((i) => {
        const { productId, productAttrValueIdsList } = i;
        const productDeliveryTaskDemandId = i.id;
        // 注入 productId, productAttrValueIdsList, productDeliveryTaskDemandId
        // 数据加工
        i.productBatchList.forEach((j) => {
          j.productId = productId;
          j.productAttrValueIdsList = productAttrValueIdsList;
          j.productDeliveryTaskDemandId = productDeliveryTaskDemandId;
        });
        // 返回批次列表
        return i.productBatchList;
      })
      .flat()
      .filter((i) => i.prepareValue);

    // 数据结构化
    const productDeliveryTaskItemList = prepareBatchList.map((i) => ({
      ...i,
      id: undefined,
      productBatchId: i.id,
      deliveryValue: i.prepareValue,
    }));

    return productDeliveryTaskItemList;
  }

  /** 部分出库 */
  async function handleSomeComplete() {
    const productDeliveryTaskItemList = getProductDeliveryTaskItemList();
    if (!productDeliveryTaskItemList.length) {
      message.warn("未存在出库项");
      return;
    }

    Modal.confirm({
      title: `确认部分出库？`,
      content: "后续可以继续提交",
      okText: "部分出库",
      cancelText: "取消",
      async onOk() {
        const { id } = productDeliveryTaskInfo.value!!;

        const data = { id, productDeliveryTaskItemList };
        await productDeliveryTaskSomeComplete(data);
        emits("change:ok");
      },
      onCancel() {},
    });
  }

  /** 出库完成 */
  async function handleComplete() {
    const productDeliveryTaskItemList = getProductDeliveryTaskItemList();
    if (!productDeliveryTaskItemList.length) {
      message.warn("未存在出库项");
      return;
    }

    Modal.confirm({
      title: `确认出库完成？`,
      content: "后续可以继续提交",
      okText: "出库完成",
      cancelText: "取消",
      async onOk() {
        const { id } = productDeliveryTaskInfo.value!!;

        const data = { id, productDeliveryTaskItemList };
        await productDeliveryTaskComplete(data);
        emits("change:ok");
      },
      onCancel() {},
    });
  }

  /** 获取出库单详情 */
  async function toGetProductDeliveryTaskInfo() {
    const { productDeliveryTaskId } = props;
    const mptInfo = await productDeliveryTaskDetail(productDeliveryTaskId);
    productDeliveryTaskInfo.value = mptInfo;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    loading.value = true;

    await toGetProductDeliveryTaskInfo();

    loading.value = false;
  }
</script>

<style></style>
