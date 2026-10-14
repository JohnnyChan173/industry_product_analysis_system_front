<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <Select
          allowClear
          placeholder="备料单状态"
          v-model:value="pageState.prepareTaskStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in MaterialPrepareTaskStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '260px' }"
          v-model:value="pageState.keyword"
          placeholder="备料单或生产单号搜索"
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialPrepareTaskDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 备料单编号 -->
          <template v-if="column.dataIndex === 'prepareTaskNo'">
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

          <!-- 备料单状态 -->
          <template v-if="column.dataIndex === 'prepareTaskStatus'">
            <TagMaterialPrepareTaskStatus :value="record.prepareTaskStatus" />
          </template>

          <template v-if="column.key === 'action'">
            <span class="text-primary hover-opacity" @click="handleMaterialPrepareTaskDetail(record)">详情</span>

            <!-- 判断是否可以操作 -->
            <span v-if="canOperation(record)">
              <span v-if="record.productTaskInfo.taskStatus === ProductTaskStatus.COMPLETE" class="text-gray-400">
                [任务单已完成，无法备料]
              </span>
              <span v-else-if="record.prepareTaskStatus === MaterialPrepareTaskStatus.READY">
                <Divider type="vertical" />
                <span class="text-primary hover-opacity" @click="handleTaskStart(record)">开始备料</span>
              </span>

              <span v-else-if="record.prepareTaskStatus === MaterialPrepareTaskStatus.DOING">
                <Divider type="vertical" />
                <span class="text-primary hover-opacity" @click="handleTaskComplete(record)">完成备料</span>
              </span>

              <span v-else>
                <Divider type="vertical" />
                <span class="hover-opacity text-warn" @click="handleTaskContinueComplete(record)">继续备料</span>
              </span>
            </span>

            <span class="text-gray-400" v-else>(已被接单)</span>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 完成备料 -->
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
    materialPrepareTaskList,
    materialPrepareTaskComplete,
    materialPrepareTaskStart,
  } from "/@/api/materialPrepareTask";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Complete from "../Complete/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { MaterialPrepareTaskStatusList } from "/@/config/data";
  import { MaterialPrepareTaskDetail } from "/@/api/model/materialPrepareTask";
  import TagMaterialPrepareTaskStatus from "/@/views/baseComponents/TagMaterialPrepareTaskStatus.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { MaterialPrepareTaskStatus, ProductTaskStatus } from "/@/enums/model";
  import { canOperation } from "/@/config/parse/index";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    prepareTaskStatus: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建备料单 */
  const modalCompleteState = reactive<{
    mode?: CommonComponentMode;
    materialPrepareTaskId: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    materialPrepareTaskId: 0,
    visible: false,
    title: "物料备料单-创建",
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
  function handle2ProductTask(record: MaterialPrepareTaskDetail) {
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

  /** 获取备料单列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await materialPrepareTaskList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 完成备料 */
  function handleTaskComplete(record: MaterialPrepareTaskDetail) {
    const { id } = record;
    modalCompleteState.mode = undefined;
    modalCompleteState.materialPrepareTaskId = id;
    modalCompleteState.title = "备料任务单 - 完成备料";
    modalCompleteState.visible = true;
  }

  /** 点击 - 继续备料 */
  function handleTaskContinueComplete(record: MaterialPrepareTaskDetail) {
    const { id } = record;
    modalCompleteState.mode = undefined;
    modalCompleteState.materialPrepareTaskId = id;
    modalCompleteState.title = "备料任务单 - 继续备料";
    modalCompleteState.visible = true;
  }

  /** 点击 - 开始备料 */
  function handleTaskStart(record: MaterialPrepareTaskDetail) {
    const { id, prepareTaskNo } = record;
    Modal.confirm({
      title: `确认开始备料单: ${prepareTaskNo}，开始后不可取消！`,
      content: "",
      okText: "开始",
      cancelText: "取消",
      async onOk() {
        await materialPrepareTaskStart(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 查看备料单 */
  function handleMaterialPrepareTaskDetail(record: MaterialPrepareTaskDetail) {
    const { id } = record;
    modalCompleteState.mode = CommonComponentMode.DETAIL;
    modalCompleteState.materialPrepareTaskId = id;
    modalCompleteState.title = "备料任务单 - 查看";
    modalCompleteState.visible = true;
  }

  /** 点击 - 删除 */
  function handleDelete(record: MaterialPrepareTaskDetail) {
    // const { prepareTaskNo } = record;
    // Modal.confirm({
    //   title: `确认删除备料单: ${prepareTaskNo}`,
    //   content: "",
    //   okText: "删除",
    //   cancelText: "取消",
    //   async onOk() {
    //     await materialPrepareTaskDel(id);
    //     await toGetList();
    //     message.success(CommonOperatorTip.OK);
    //   },
    //   onCancel() {},
    // });
  }

  /** Complete 组件变化 */
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
