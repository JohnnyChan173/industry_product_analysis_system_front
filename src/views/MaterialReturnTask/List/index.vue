<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <Select
          allowClear
          placeholder="退料单状态"
          v-model:value="pageState.returnTaskStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in MaterialReturnTaskStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '260px' }"
          v-model:value="pageState.keyword"
          placeholder="退料单或生产单号搜索"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right> </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        class="headerify"
        rowKey="id"
        size="small"
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialReturnTaskDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 退料单编号 -->
          <template v-if="column.dataIndex === 'returnTaskNo'">
            <span>{{ text }}</span>
          </template>

          <!-- 关联生产单 -->
          <template v-if="column.dataIndex === 'productTaskInfo'">
            <span class="text-primary hover-underline" @click="handle2ProductTask(record)">
              {{ record.productTaskInfo.taskNo }}
            </span>
          </template>

          <!-- 生产产品 -->
          <template v-if="column.key === 'productInfo'">
            <ProductRelate
              class="text-primary"
              :mode="CommonComponentMode.DETAIL"
              :productId="record.productTaskInfo.productId"
              :productAttrValueIdsList="record.productTaskInfo.productAttrValueIdsList"
            />
          </template>

          <!-- 生产数量 -->
          <template v-if="column.key === 'productNumber'">
            <span class="text-primary">{{ record.productTaskInfo.productNumber }}</span>
          </template>

          <!-- 生产产线 -->
          <template v-if="column.key === 'lineInfo'">
            <span>{{ record.productTaskInfo.lineInfo.lineName }}</span>
          </template>

          <!-- 物料仓管 -->
          <template v-if="column.dataIndex === 'operationUserInfo'">
            <span v-if="record.operationUserInfo">{{ record.operationUserInfo.nickname }}</span>
            <span v-else class="text-gray-400">(无仓管接单)</span>
          </template>

          <!-- 开始时间 -->
          <template v-if="column.dataIndex === 'startDate'">
            <span>{{ text?.slice(0, -3) }}</span>
          </template>

          <!-- 完成时间 -->
          <template v-if="column.dataIndex === 'completeDate'">
            <span>{{ text?.slice(0, -3) }}</span>
          </template>

          <!-- 退料单状态 -->
          <template v-if="column.dataIndex === 'returnTaskStatus'">
            <TagMaterialReturnTaskStatus
              :value="record.returnTaskStatus"
              :productTaskStatus="record.productTaskInfo.taskStatus"
            />
          </template>

          <template v-if="column.key === 'action'">
            <span class="text-primary hover-opacity" @click="handleMaterialReturnTaskDetail(record)">详情</span>

            <!-- 判断是否可以操作 -->
            <span v-if="canOperation(record)">
              <span v-if="record.returnTaskStatus === MaterialReturnTaskStatus.READY">
                <Divider type="vertical" />
                <span class="text-primary hover-opacity" @click="handleTaskStart(record)">开始退料</span>
              </span>

              <span v-else-if="record.returnTaskStatus === MaterialReturnTaskStatus.DOING">
                <Divider type="vertical" />
                <span class="text-primary hover-opacity" @click="handleTaskComplete(record)">完成退料</span>
              </span>

              <span v-else>
                <Divider type="vertical" />
                <span class="hover-opacity text-warn" @click="handleTaskContinueComplete(record)">继续退料</span>
              </span>
            </span>
            <span class="text-gray-400" v-else>(已被接单)</span>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 完成退料 -->
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
        :materialReturnTaskId="modalCompleteState.materialReturnTaskId"
        :materialPrepareTaskId="modalCompleteState.materialPrepareTaskId"
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
    materialReturnTaskList,
    materialReturnTaskComplete,
    materialReturnTaskStart,
  } from "/@/api/materialReturnTask";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Complete from "../Complete/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { MaterialReturnTaskStatusList } from "/@/config/data";
  import { MaterialReturnTaskDetail } from "/@/api/model/materialReturnTask";
  import TagMaterialReturnTaskStatus from "/@/views/baseComponents/TagMaterialReturnTaskStatus.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { MaterialReturnTaskStatus, ProductTaskStatus } from "/@/enums/model";
  import { canOperation } from "/@/config/parse/index";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    returnTaskStatus: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建退料单 */
  const modalCompleteState = reactive<{
    mode?: CommonComponentMode;
    materialReturnTaskId: number;
    materialPrepareTaskId: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    materialReturnTaskId: 0,
    materialPrepareTaskId: 0,
    visible: false,
    title: "物料退料单-创建",
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

  /** 跳转生产任务单 */
  function handle2ProductTask(record: MaterialReturnTaskDetail) {
    const {
      productTaskInfo: { taskNo },
    } = record;
    const query = {
      taskNo,
    };

    router.push({
      path: PageEnum.PRODUCT_TASK_LIST,
      query,
    });
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取退料单列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await materialReturnTaskList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 完成退料 */
  function handleTaskComplete(record: MaterialReturnTaskDetail) {
    const { productTaskInfo } = record;
    const { materialPrepareTaskId, materialReturnTaskId } = productTaskInfo;

    modalCompleteState.mode = undefined;
    modalCompleteState.materialReturnTaskId = materialReturnTaskId;
    modalCompleteState.materialPrepareTaskId = materialPrepareTaskId;
    modalCompleteState.title = "退料任务单 - 完成退料";
    modalCompleteState.visible = true;
  }

  /** 点击 - 继续退料 */
  function handleTaskContinueComplete(record: MaterialReturnTaskDetail) {
    const { productTaskInfo } = record;
    const { materialPrepareTaskId, materialReturnTaskId } = productTaskInfo;

    modalCompleteState.mode = undefined;
    modalCompleteState.materialReturnTaskId = materialReturnTaskId;
    modalCompleteState.materialPrepareTaskId = materialPrepareTaskId;
    modalCompleteState.title = "退料任务单 - 继续退料";
    modalCompleteState.visible = true;
  }

  /** 点击 - 开始退料 */
  function handleTaskStart(record: MaterialReturnTaskDetail) {
    const { id, returnTaskNo } = record;
    Modal.confirm({
      title: `确认开始退料单: ${returnTaskNo}，开始后不可取消！`,
      content: "",
      okText: "开始",
      cancelText: "取消",
      async onOk() {
        await materialReturnTaskStart(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 查看退料单 */
  function handleMaterialReturnTaskDetail(record: MaterialReturnTaskDetail) {
    const { productTaskInfo } = record;
    const { materialPrepareTaskId, materialReturnTaskId } = productTaskInfo;

    modalCompleteState.mode = CommonComponentMode.DETAIL;
    modalCompleteState.materialReturnTaskId = materialReturnTaskId;
    modalCompleteState.materialPrepareTaskId = materialPrepareTaskId;
    modalCompleteState.title = "退料任务单 - 查看";
    modalCompleteState.visible = true;
  }

  /** 点击 - 删除 */
  function handleDelete(record: MaterialReturnTaskDetail) {
    // const { returnTaskNo } = record;
    // Modal.confirm({
    //   title: `确认删除退料单: ${returnTaskNo}`,
    //   content: "",
    //   okText: "删除",
    //   cancelText: "取消",
    //   async onOk() {
    //     await materialReturnTaskDel(id);
    //     await toGetList();
    //     message.success(CommonOperatorTip.OK);
    //   },
    //   onCancel() {},
    // });
  }

  /** Add 组件变化 */
  async function handleCompleteChange() {
    await toGetList();
    modalCompleteState.visible = false;
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
