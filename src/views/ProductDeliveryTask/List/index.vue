<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <Select
          allowClear
          placeholder="产品出库单状态"
          v-model:value="pageState.deliveryTaskStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in ProductDeliveryTaskStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '260px' }"
          v-model:value="pageState.keyword"
          placeholder="输入产品出库单号搜索"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleProductAdd">创建产品出库单 + </Button>
    </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        class="headerify"
        rowKey="id"
        :loading="otherState.loading"
        :dataSource="dataSource"
        :columns="columns"
        :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductDeliveryTaskDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 产品出库单编号 -->
          <template v-if="column.dataIndex === 'deliveryTaskNo'">
            <span>{{ text }}</span>
          </template>

          <!-- 关联销售订单 -->
          <template v-if="column.dataIndex === 'saleOrderNo'">
            <span v-if="record.deliveryType === ProductDeliveryTaskType.SALE" class="text-primary">{{ text }}</span>
            <span v-else class="text-gray-400">直接出库</span>
          </template>

          <!-- 出库产品列表（产品名称+出库数量） -->
          <template v-if="column.dataIndex === 'productDeliveryTaskDemandList'">
            <DeliveryItemTable
              :mode="CommonComponentMode.DETAIL"
              :showHeader="false"
              hideColumns="stockValueTotal,action"
              v-model:value="record.productDeliveryTaskDemandList"
            />
          </template>

          <!-- 产品仓管 -->
          <template v-if="column.dataIndex === 'operationUserInfo'">
            <span>{{ record.operationUserInfo.nickname }}</span>
          </template>

          <!-- 出库单状态 -->
          <template v-if="column.dataIndex === 'deliveryTaskStatus'">
            <TagProductDeliveryTaskStatus :value="record.deliveryTaskStatus" />
          </template>

          <template v-if="column.key === 'action'">
            <span class="text-primary hover-opacity" @click="handleProductDeliveryTaskDetail(record)">详情</span>

            <Divider type="vertical" />

            <Dropdown v-if="!isCg">
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleProductDeliveryTaskEdit(record)">
                    <span class="text-primary hover-opacity">编辑</span>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleDelete(record)">
                    <span class="text-danger hover-opacity">删除</span>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>

            <!-- 判断是否可以操作 -->
            <span v-if="canOperation(record)">
              <span v-if="record.deliveryTaskStatus === ProductDeliveryTaskStatus.READY">
                <Divider type="vertical" />
                <span class="text-primary hover-opacity" @click="handleTaskStart(record)">开始出库</span>
              </span>

              <span v-else-if="record.deliveryTaskStatus === ProductDeliveryTaskStatus.DOING">
                <Divider type="vertical" />
                <span class="text-primary hover-opacity" @click="handleTaskComplete(record)">完成出库</span>
              </span>

              <span v-else>
                <Divider type="vertical" />
                <span class="hover-opacity text-warn" @click="handleTaskContinueComplete(record)">继续出库</span>
              </span>
            </span>

            <span class="text-gray-400" v-else>(已被接单)</span>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建产品出库单 -->
  <Modal
    :style="{ minWidth: '780px' }"
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
  >
    <Add class="!-mt-20px" :mode="modalAddState.mode" :id="modalAddState.id" @change="handleAddChange" />
  </Modal>

  <!-- 弹窗 - 完成出库 -->
  <Modal
    :style="{ minWidth: '780px' }"
    v-model:visible="modalCompleteState.visible"
    :title="modalCompleteState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <div class="!-mt-20px">
      <Complete
        :mode="modalCompleteState.mode"
        :productDeliveryTaskId="modalCompleteState.productDeliveryTaskId"
        @change:ok="handleCompleteChange"
      />
    </div>
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Select } from "ant-design-vue";
  import { onMounted, reactive, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import {
    productDeliveryTaskList,
    productDeliveryTaskDel,
    productDeliveryTaskComplete,
    productDeliveryTaskStart,
  } from "/@/api/productDeliveryTask";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import Complete from "../Complete/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { ProductDeliveryTaskStatusList } from "/@/config/data";
  import { ProductDeliveryTaskDetail } from "/@/api/model/productDeliveryTask";
  import TagProductDeliveryTaskStatus from "/@/views/baseComponents/TagProductDeliveryTaskStatus.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { ProductDeliveryTaskStatus, ProductDeliveryTaskType } from "/@/enums/model";
  import DeliveryItemTable from "/@/views/ProductDeliveryTask/Add/delivery-item-table.vue";
  import { useUserInfoStore } from "/@/store";
  import { canOperation } from "/@/config/parse/index";

  const router = useRouter();
  const { isCg } = useUserInfoStore();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    deliveryTaskStatus: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建产品出库单 */
  const modalAddState = reactive<{
    mode?: CommonComponentMode;
    id?: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    id: undefined,
    visible: false,
    title: "产品出库单-创建",
  });

  /** 弹窗 - 创建出库单 */
  const modalCompleteState = reactive<{
    mode?: CommonComponentMode;
    productDeliveryTaskId: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    productDeliveryTaskId: 0,
    visible: false,
    title: "物料出库单-创建",
  });

  const debounceToGetList = debounce(toGetList, 200);

  // 重置页码
  watch([() => pageState.keyword], () => {
    pageState.pageNum = 1;
  });

  // 检测变化刷新列表
  watch(
    () => pageState,
    () => {
      debounceToGetList();
    },
    { deep: true }
  );

  // mounted
  onMounted(() => {
    toGetNeedInfo();

    // 获取列表
    toGetList();
  });

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取产品出库单列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await productDeliveryTaskList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 创建产品出库单 */
  function handleProductAdd() {
    modalAddState.id = undefined;
    modalAddState.mode = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建产品出库单";
  }

  /** 点击 - 完成出库 */
  function handleTaskComplete(record: ProductDeliveryTaskDetail) {
    const { id } = record;
    modalCompleteState.mode = undefined;
    modalCompleteState.productDeliveryTaskId = id;
    modalCompleteState.title = "产品出库单 - 完成出库";
    modalCompleteState.visible = true;
  }

  /** 点击 - 继续出库 */
  function handleTaskContinueComplete(record: ProductDeliveryTaskDetail) {
    const { id } = record;
    modalCompleteState.mode = undefined;
    modalCompleteState.productDeliveryTaskId = id;
    modalCompleteState.title = "产品出库单 - 继续出库";
    modalCompleteState.visible = true;
  }

  /** 点击 - 开始出库 */
  async function handleTaskStart(record: ProductDeliveryTaskDetail) {
    const { id, deliveryTaskNo } = record;
    await productDeliveryTaskStart(id);
    await toGetList();
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 查看产品出库单 */
  function handleProductDeliveryTaskDetail(record: ProductDeliveryTaskDetail) {
    const { id } = record;
    modalCompleteState.mode = CommonComponentMode.DETAIL;
    modalCompleteState.productDeliveryTaskId = id;
    modalCompleteState.title = "产品出库单 - 查看";
    modalCompleteState.visible = true;
  }

  /** 点击 - 编辑产品出库单 */
  function handleProductDeliveryTaskEdit(record: ProductDeliveryTaskDetail) {
    const { id, deliveryTaskStatus } = record;
    if (record.deliveryTaskStatus !== ProductDeliveryTaskStatus.READY) {
      modalAddState.mode = CommonComponentMode.DETAIL;
    } else {
      modalAddState.mode = undefined;
    }
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "产品出库单-编辑";
  }

  /** 点击 - 删除 */
  function handleDelete(record: ProductDeliveryTaskDetail) {
    const { id, deliveryTaskNo } = record;
    Modal.confirm({
      title: `确认删除产品出库单: ${deliveryTaskNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await productDeliveryTaskDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** Complete 组件变化 */
  async function handleCompleteChange() {
    await toGetList();
    modalCompleteState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** Add 组件变化 */
  async function handleAddChange() {
    await toGetList();
    modalAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 搜索 */
  function handleSearch() {
    toGetList();
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }
</script>

<style lang="less" scoped></style>
