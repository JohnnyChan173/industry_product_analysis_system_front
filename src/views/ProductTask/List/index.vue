<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <Select
          v-model:value="workshopId"
          placeholder="选择车间"
          style="width: 150px; margin-right: 6px"
          :disabled="isXz"
          allowClear
          @change="handleWorkshopIdChange"
        >
          <Select.Option v-for="item in workshopSelectList" :key="item.id" :value="item.id">
            {{ item.workshopName }}
          </Select.Option>
        </Select>

        <Select
          v-model:value="pageState.lineId"
          placeholder="选择产线"
          style="width: 150px; margin-right: 6px"
          :disabled="isXz || !workshopId"
          @change="handleLineIdChange"
          allowClear
        >
          <Select.Option v-for="item in filteredLineList" :key="item.id" :value="item.id">
            {{ item.lineName }}
          </Select.Option>
        </Select>

        <Select
          allowClear
          placeholder="任务单类型"
          v-model:value="pageState.taskType"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in ProductTaskTypeList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Select
          allowClear
          placeholder="任务单状态"
          v-model:value="pageState.taskStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in ProductTaskStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '260px' }"
          v-model:value="pageState.keyword"
          placeholder="输入任务单编号搜索"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleProductAdd">创建任务单 + </Button>
    </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        v-if="tableShow"
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
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductTaskDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 关联销售订单 -->
          <template v-if="column.dataIndex === 'saleOrderNo'">
            <span v-if="record.taskType === ProductTaskType.SALE" class="text-primary">{{ text }}</span>
            <span v-else class="text-gray-400">预生产</span>
          </template>

          <!-- 计划完成时间 -->
          <template v-if="column.dataIndex === 'planCompleteDate'">
            <span>{{ formatDateByDayjs(text) }}</span>
          </template>

          <!-- 生产产品 -->
          <template v-if="column.dataIndex === 'productInfo'">
            <ProductRelate
              class="text-primary"
              :mode="CommonComponentMode.DETAIL"
              :productId="record.productId"
              :productAttrValueIdsList="record.productAttrValueIdsList"
            />
          </template>

          <!-- 生产产线 -->
          <template v-if="column.dataIndex === 'lineInfo'">
            <span>{{ record.lineInfo.lineName }}</span>
          </template>

          <!-- 备料状态 -->
          <template v-if="column.dataIndex === 'materialPrepareTaskInfo'">
            <TagMaterialPrepareTaskStatus :value="record.materialPrepareTaskInfo?.prepareTaskStatus || 0" />
          </template>

          <!-- 任务单状态 -->
          <template v-if="column.dataIndex === 'taskStatus'">
            <TagProductTaskStatus :info="record" />
          </template>

          <!-- 任务单进度 -->
          <template v-if="column.key === 'progress'">
            <!-- <el-progress
              :text-inside="true"
              :stroke-width="26"
              :percentage="
                Math.round(
                  (record.registrationActualProductNumber ||
                    record.registrationBeatProductNumber / record.productNumber) * 100
                ) > 100
                  ? 100
                  : Math.round(
                      (record.registrationActualProductNumber ||
                        record.registrationBeatProductNumber / record.productNumber) * 100
                    )
              "
            /> -->

            <Progress :ratio="(record.registrationActualProductNumber || record.registrationBeatProductNumber / record.productNumber)" />
          </template>

          <!-- 退料状态 -->
          <template v-if="column.dataIndex === 'materialReturnTaskInfo'">
            <TagMaterialReturnTaskStatus
              v-if="record.materialReturnTaskInfo"
              :value="record.materialReturnTaskInfo?.returnTaskStatus"
              :productTaskStatus="record.taskStatus"
            />
            <span v-else class="text-gray-400">/</span>
          </template>

          <!-- 关联产品批 -->
          <template v-if="column.dataIndex === 'productBatchIdList'">
            <div
              v-if="record.productBatchIdList"
              class="text-primary hover-underline"
              @click="handleRelateProductBatch(record)"
            >
              {{ record.productBatchIdList.length }} 批
            </div>
            <span v-else class="text-gray-400">(暂无批关联)</span>
          </template>

          <template v-if="column.key === 'action'">
            <span class="text-primary hover-opacity" @click="handleProductTaskDetail(record)">查看</span>
            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <span v-if="canProductTaskEdit(record)">
                    <Menu.Item @click="handleProductTaskEdit(record)">
                      <span class="text-primary hover-opacity">编辑</span>
                    </Menu.Item>
                  </span>

                  <Menu.Divider />
                  <Menu.Item @click="handlePrintCraftCard(record)">
                    <span class="text-primary hover-opacity"> 打印流程卡 </span>
                  </Menu.Item>

                  <span v-if="record.taskStatus === ProductTaskStatus.NOT_DO">
                    <Menu.Divider />
                    <Menu.Item @click="handleTaskStart(record)">
                      <span class="text-warn hover-opacity"> 开始任务单 </span>
                    </Menu.Item>
                  </span>

                  <span v-if="record.taskStatus === ProductTaskStatus.DOING">
                    <Menu.Divider />
                    <Menu.Item @click="handleTaskComplete(record)">
                      <span class="text-success hover-opacity"> 完成任务单 </span>
                    </Menu.Item>
                  </span>

                  <span>
                    <Menu.Divider />
                    <Menu.Item @click="handleTaskFastBatch(record)">
                      <span class="text-primary hover-opacity"> 快捷产品批 </span>
                    </Menu.Item>
                  </span>

                  <span v-if="canProductTaskDel(record)">
                    <Menu.Divider />
                    <Menu.Item @click="handleDelete(record)">
                      <span class="text-danger hover-opacity">删除</span>
                    </Menu.Item>
                  </span>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建任务单 -->
  <Modal
    :style="{ minWidth: '580px' }"
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <Add :id="modalAddState.id" @change="handleAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Popover, Select } from "ant-design-vue";
  import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce, delay, formatDateByDayjs, parseSearch } from "/@/utils/util";
  import { productTaskList, productTaskDel, productTaskComplete, productTaskStart } from "/@/api/productTask";
  import { lineListAll } from "/@/api/line";
  import { workshopListAll } from "/@/api/workshop";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { useAppStore, useDataStore, usePrintStore, useUserInfoStore } from "/@/store";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { ProductTaskStatusList, ProductTaskTypeList } from "/@/config/data";
  import { ProductTaskDetail, ProductTaskInfo } from "/@/api/model/productTask";
  import TagProductTaskStatus from "/@/views/baseComponents/TagProductTaskStatus.vue";
  import TagMaterialPrepareTaskStatus from "/@/views/baseComponents/TagMaterialPrepareTaskStatus.vue";
  import TagMaterialReturnTaskStatus from "/@/views/baseComponents/TagMaterialReturnTaskStatus.vue";
  import Progress from "/@/components/Progress/index.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { MaterialPrepareTaskStatus, ProductTaskStatus, ProductTaskType } from "/@/enums/model";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { useResize } from "/@/hooks/web/useResize";

  const router = useRouter();
  const { isXz, manageLineId, isCjzr, staffInfo } = useUserInfoStore();

  const searchParam = parseSearch();

  const tableShow = ref(true);

  /** 顶部选择：车间 -> 产线 */
  const workshopId = ref<number | undefined>();
  const workshopSelectList = ref<any[]>([]);
  const lineList = ref<any[]>([]);

  function getLineWorkshopId(item: any) {
    return item?.workshopId ?? item?.workshopInfo?.id;
  }

  const filteredLineList = computed(() => {
    if (!workshopId.value) return [];

    return lineList.value.filter(
      (item: any) => String(getLineWorkshopId(item)) === String(workshopId.value)
    );
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    taskStatus: undefined,
    lineId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 获取表格宽度 */
  const mainTableStyle = computed(() => {
    const { innerWidth } = window;
    const appStore = useAppStore();
    const siderWidth = appStore.siderCollapsed ? 80 : 200;
    const tw1 = innerWidth - siderWidth - 80;
    const tw2 = 1380;
    const tw = Math.min(tw1, tw2);
    return {
      width: tw + "px",
    };
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  const { dictItemProductTypeList } = useDataStore();
  const printStore = usePrintStore();

  /** 弹窗 - 创建任务单 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "生产任务单-创建",
  });

  const debounceToGetList = debounce(toGetList, 200);

  resizeTable();

  useResize(resizeTable);

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
  onMounted(async () => {
    await toGetNeedInfo();

    const taskNo = searchParam.taskNo || "";

    if (taskNo) {
      pageState.keyword = taskNo;
    }

    // 获取列表
    await toGetList();
  });

  /** 刷新表格 */
  function resizeTable() {
    // tableShow.value = false;
    // nextTick(() => {
    //   tableShow.value = true;
    // });
  }

  /** 跳转产品批次页 */
  async function handleRelateProductBatch(record: ProductTaskDetail) {
    const { taskNo } = record;
    const query = {
      productTaskNo: taskNo,
    };

    router.push({
      path: PageEnum.PRODUCT_BATCH_LIST,
      query,
    });
  }

  /** 快捷创建产品批次 */
  async function handleTaskFastBatch(record: ProductTaskDetail) {
    const { id: productTaskId } = record;
    const query = {
      productTaskId,
      operation: "add",
    };

    router.push({
      path: PageEnum.PRODUCT_BATCH_LIST,
      query,
    });
  }

  /** 是否允许任务单编辑 */
  function canProductTaskEdit(record: ProductTaskDetail) {
    const { materialPrepareTaskInfo, taskStatus } = record;
    const { prepareTaskStatus = 0 } = materialPrepareTaskInfo || {};
    // 备料单未开始，且任务单状态为0
    const taskStatusNotDo = taskStatus === ProductTaskStatus.NOT_DO;
    const prepareTaskStatusReady = prepareTaskStatus === MaterialPrepareTaskStatus.READY;
    if (taskStatusNotDo && prepareTaskStatusReady) {
      return true;
    }
  }

  /** 是否允许任务单删除 */
  function canProductTaskDel(record: ProductTaskDetail) {
    // 复用判定编辑逻辑
    return canProductTaskEdit(record);
  }

  /** 变化 - 车间；只有车间主任默认选择当前车间第一条产线 */
  function handleWorkshopIdChange() {
    pageState.pageNum = 1;
    pageState.lineId = filteredLineList.value[0]?.id
    // debounceToGetList();
  }

  /** 变化 - 产线 */
  function handleLineIdChange() {
    pageState.pageNum = 1;
    // debounceToGetList();
  }

  /** 获取车间列表；车间主任只保留自己负责的车间 */
  async function toGetWorkshopList() {
    const records = await workshopListAll();
    workshopSelectList.value = isCjzr
      ? records.filter((item: any) => String(item.staffId) === String(staffInfo?.id))
      : records;
  }

  /** 获取产线，并初始化顶部车间/产线 */
  async function toGetLineList() {
    lineList.value = await lineListAll();

    // 只有车间主任默认选中自己的第一个车间及该车间第一条产线。
    // 包括线长在内的其他角色，顶部筛选都保持未选择状态。
    if (isCjzr) {
      workshopId.value = workshopSelectList.value[0]?.id;
      pageState.lineId = filteredLineList.value[0]?.id;
    } else {
      workshopId.value = undefined;
      pageState.lineId = undefined;
    }
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetWorkshopList();
    await toGetLineList();
  }

  /** 获取任务单列表 */
  async function toGetList() {
    otherState.loading = true;

    // 车间主任未匹配到所属车间，或当前车间没有产线时，不请求全量数据。
    if ((isCjzr && !workshopId.value) || (workshopId.value && !pageState.lineId)) {
      dataSource.value = [];
      otherState.total = 0;
      otherState.loading = false;
      return;
    }

    const data = {
      ...pageState,
      // 线长仍然只查询自己管理的产线，但不把该值回填到顶部 Select，避免出现默认选中。
      lineId: isXz ? manageLineId : pageState.lineId,
    };

    const { records, total } = await productTaskList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 打印工艺流程卡 */
  function handlePrintCraftCard(record: ProductTaskDetail) {
    const { id } = record;
    printStore.toOpenPrintView("craft-card", id);
  }

  /** 点击 - 创建任务单 */
  function handleProductAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建任务单";
  }

  /** 点击 - 开始任务单 */
  async function handleTaskStart(record: ProductTaskDetail) {
    const { id, taskNo } = record;
    Modal.confirm({
      title: `确认开始任务单: ${taskNo} ？`,
      content: "理论是第一次【生产登记-开始】后，系统自动判定为进行中",
      okText: "确认",
      cancelText: "取消",
      async onOk() {
        await productTaskStart(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 完成任务单 */
  function handleTaskComplete(record: ProductTaskDetail) {
    const { id, taskNo } = record;
    Modal.confirm({
      title: `确认任务单: ${taskNo} 已完成？`,
      content: "理论基于每次【生产登记-完成】后，系统通过累计生产数量判定为完成",
      okText: "确认",
      cancelText: "取消",
      async onOk() {
        await productTaskComplete(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 查看任务单 */
  function handleProductTaskDetail(record: ProductTaskDetail) {
    const { id } = record;

    const query = {
      id,
    };

    router.push({
      path: PageEnum.PRODUCT_TASK_DETAIL,
      query,
    });
  }

  /** 点击 - 编辑任务单 */
  function handleProductTaskEdit(record: ProductTaskDetail) {
    const { id } = record;
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "生产任务单-编辑";
  }

  /** 点击 - 删除 */
  function handleDelete(record: ProductTaskDetail) {
    const { id, taskNo } = record;
    Modal.confirm({
      title: `确认删除任务单: ${taskNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await productTaskDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
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
