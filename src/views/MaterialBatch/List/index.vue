<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <div class="mr-6px !w-220px">
          <MaterialRelate
            v-model:materialId="pageState.materialId"
            v-model:materialSpecsId="pageState.materialSpecsId"
          />
        </div>

        <Select
          allowClear
          placeholder="检测状态"
          v-model:value="pageState.detectionStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in BatchDetectionStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Select
          allowClear
          placeholder="批次状态"
          v-model:value="pageState.batchStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in BatchStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入批次号或采购单号搜索"
          enter-button="搜索"
          allowClear
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button class="mr-8px" type="primary" ghost @click="handleBatchStockLogClick()">批次库存日志 </Button>

      <Button type="primary" @click="handleBatchAdd">创建物料批次 + </Button>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialBatchDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 物料批次号 -->
          <template v-if="column.dataIndex === 'batchNo'">
            <span>{{ text }}</span>
          </template>

          <!-- 关联任务单 -->
          <template v-if="column.dataIndex === 'materialPurchaseInfo'">
            <span v-if="record.materialPurchaseInfo" class="text-primary">
              {{ record.materialPurchaseInfo.purchaseNo }}
            </span>
            <span v-else class="text-gray-400">/</span>
          </template>

          <!-- 物料名称 -->
          <template v-if="column.dataIndex === 'materialInfo'">
            <span>{{ getMaterialWholeText(record.materialId, record.materialSpecsId) }}</span>
          </template>

          <!-- 数量 -->
          <template v-if="column.dataIndex === 'supplyValue'">
            <span class="text-gray-400">{{ text }}</span>
          </template>

          <!-- 检测状态 -->
          <template v-if="column.dataIndex === 'detectionStatus'">
            <TagBatchDetectionStatus :value="text" />
          </template>

          <!-- 批次状态 -->
          <template v-if="column.dataIndex === 'batchStatus'">
            <TagBatchStatus :value="text" />
          </template>

          <!-- 批次库存 -->
          <template v-if="column.dataIndex === 'stockValue'">
            <span v-if="record.batchStatus === BatchStatus.STOCK_IN" class="text-primary text-14px">{{ text }}</span>
            <span v-else class="text-gray-400 text-14px">批次未接收</span>
          </template>

          <template v-if="column.key === 'action'">
            <Dropdown v-if="record.batchStatus === BatchStatus.BACK">
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleDelete(record)">
                    <span class="text-danger hover-opacity">删除</span>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>

            <span v-else>
              <Dropdown>
                <a class="whitespace-nowrap">
                  库存
                  <DownOutlined />
                </a>
                <template #overlay>
                  <Menu v-if="record.batchStatus === BatchStatus.DEFAULT">
                    <Menu.Item @click="handleBatchReceive(record)">
                      <span class="text-primary hover-opacity">批次接收</span>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="handleBatchBack(record)">
                      <span class="text-danger hover-opacity">批次退回</span>
                    </Menu.Item>
                  </Menu>

                  <Menu v-else>
                    <Menu.Item @click="handleBatchStockOut(record)">
                      <span class="text-primary hover-opacity">出库</span>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="handleBatchStockIn(record)">
                      <span class="text-primary hover-opacity">入库</span>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="handleBatchStockReset(record)">
                      <span class="text-warn hover-opacity">盘库</span>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="handleBatchStockLogClick(record)">
                      <span class="text-primary hover-opacity">库存日志</span>
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>

              <Divider type="vertical" />
              <Dropdown>
                <a class="whitespace-nowrap">
                  更多
                  <DownOutlined />
                </a>
                <template #overlay>
                  <Menu>
                    <Menu.Item @click="() => handleBatchEdit(record)">
                      <span class="text-primary hover-opacity">编辑</span>
                    </Menu.Item>

                    <span v-if="!record.materialBatchDetectionId">
                      <Menu.Divider />
                      <Menu.Item @click="handleBatchDetectionAdd(record)">
                        <span class="text-primary hover-opacity">批次检测</span>
                      </Menu.Item>
                    </span>

                    <!-- <Menu.Divider />
                  <Menu.Item @click="handleBatchDetectionEdit(record)">
                    <span class="text-primary hover-opacity">批次检测(编辑)</span>
                  </Menu.Item> -->

                    <span v-else>
                      <Menu.Divider />
                      <Menu.Item @click="handleBatchDetectionDetail(record)">
                        <span class="text-primary hover-opacity">批次检测详情</span>
                      </Menu.Item>
                    </span>

                    <Menu.Divider />
                    <Menu.Item @click="handleDelete(record)">
                      <span class="text-danger hover-opacity">删除</span>
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </span>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 物料批次-批次入库 -->
  <Modal
    :style="{ width: AntModalWidth.sm }"
    v-model:visible="modalReceiveState.visible"
    :title="modalReceiveState.title"
    :footer="null"
    destroyOnClose
  >
    <div>
      <p class="text-warn">确认批次入库？入库后物料即可备货销售，操作不可逆。</p>
      <div class="my-12px">
        <Form.Item label="入库数量" required>
          <InputNumber
            v-focus
            size="large"
            :min="0"
            v-model:value="modalReceiveState.value"
            @keypress.enter="handleReceiveSubmit"
          />
        </Form.Item>
        <div>
          <Button type="primary" @click="handleReceiveSubmit">确认接收</Button>
        </div>
      </div>
    </div>
  </Modal>

  <!-- 弹窗 - 物料批次-批次退回 -->
  <Modal
    :style="{ width: AntModalWidth.sm }"
    v-model:visible="modalBackState.visible"
    :title="modalBackState.title"
    :footer="null"
    destroyOnClose
  >
    <div>
      <p class="text-warn">确认批次退回？该操作不可逆。</p>
      <div class="my-12px">
        <div>
          <Button type="primary" class="danger" @click="handleBackSubmit">确认退回</Button>
        </div>
      </div>
    </div>
  </Modal>

  <!-- 弹窗 - 创建物料批次 -->
  <Modal
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <Add
      :id="modalAddState.id"
      :mode="modalAddState.mode"
      :materialPurchaseId="modalAddState.materialPurchaseId"
      @change:ok="handleAddChange"
    />
  </Modal>

  <!-- 弹窗 - 批次检测 -->
  <Modal
    :style="{ minWidth: AntModalWidth.xl }"
    v-model:visible="modalDetectionState.visible"
    :title="modalDetectionState.title"
    :footer="null"
    destroyOnClose
    centered
    :mask-closable="false"
  >
    <Detection
      class="!-mt-20px"
      :mode="modalDetectionState.mode"
      :id="modalDetectionState.id"
      :materialBatchId="modalDetectionState.materialBatchId"
      @change="handleDetectionChange"
    />
  </Modal>

  <!-- 弹窗 - 库存 -->
  <Modal
    v-model:visible="modalStockState.visible"
    :title="modalStockState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <Stock
      class="!-mt-20px"
      :materialBatchId="modalStockState.materialBatchId!!"
      :materialId="modalStockState.materialId!!"
      :materialSpecsId="modalStockState.materialSpecsId!!"
      :operationType="modalStockState.operationType"
      @change="handleStockChange"
    />
  </Modal>

  <!-- 弹窗 - 库存日志 -->
  <Modal
    :style="{ minWidth: AntModalWidth.xl }"
    v-model:visible="modalStockLogState.visible"
    title="物料-库存日志"
    :footer="null"
    destroyOnClose
  >
    <StockLog :materialBatchId="modalStockLogState.materialBatchId" />
  </Modal>
</template>

<script setup lang="ts">
  import {
    Input,
    Button,
    Modal,
    Table,
    Dropdown,
    Menu,
    Divider,
    message,
    Popover,
    Select,
    Form,
    InputNumber,
  } from "ant-design-vue";
  import { nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce, delay, parseSearch } from "/@/utils/util";
  import {
    materialBatchList,
    materialBatchDel,
    materialBatchBatchReceive,
    materialBatchBatchBack,
  } from "/@/api/materialBatch";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { MaterialInfo } from "/@/api/model/material";
  import { BatchStatus, BatchStockLogOperationType } from "/@/enums/model";
  import { MaterialBatchDetail, MaterialBatchInfo } from "/@/api/model/materialBatch";
  import { useDataStore } from "/@/store";
  import { BatchDetectionStatusList, BatchStatusList } from "/@/config/data";
  import { getMaterialWholeText } from "/@/config/parse";
  import TagBatchDetectionStatus from "/@/views/baseComponents/TagBatchDetectionStatus.vue";
  import TagBatchStatus from "/@/views/baseComponents/TagBatchStatus.vue";
  import { AntModalWidth } from "/@/enums/antEnum";
  import Add from "../Add/index.vue";
  import Detection from "../Detection/index.vue";
  import Stock from "../Stock/index.vue";
  import StockLog from "../StockLog/index.vue";
  import MaterialRelate from "/@/views/components/MaterialRelate/index.vue";

  const router = useRouter();

  const searchParam = parseSearch();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    materialId: undefined,
    materialSpecsId: undefined,
    detectionStatus: undefined,
    batchStatus: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  const materialAllList = ref<MaterialInfo[]>([]);
  const materialFilterList = ref<MaterialInfo[]>([]);

  /** 弹窗 - 库存日志 */
  const modalStockLogState = reactive<{
    materialBatchId?: number;
    keyword?: string;
    visible: boolean;
  }>({
    materialBatchId: undefined,
    keyword: "",
    visible: false,
  });

  /** 弹窗 - 创建库存 */
  const modalStockState = reactive<{
    materialBatchId?: number;
    materialId?: number;
    materialSpecsId?: number;
    operationType?: BatchStockLogOperationType;
    visible: boolean;
    title: string;
  }>({
    materialBatchId: undefined,
    materialId: undefined,
    materialSpecsId: undefined,
    operationType: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 创建批次 */
  const modalAddState = reactive<{
    mode?: CommonComponentMode;
    id?: number;
    materialPurchaseId?: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    id: undefined,
    materialPurchaseId: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 接收批次 */
  const modalReceiveState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
    value: number;
  }>({
    id: undefined,
    visible: false,
    title: "",
    value: 0,
  });

  /** 弹窗 - 接收退回 */
  const modalBackState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 批次检测 */
  const modalDetectionState = reactive<{
    mode?: CommonComponentMode;
    id?: number;
    materialBatchId?: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    id: undefined,
    materialBatchId: undefined,
    visible: false,
    title: "",
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
  onMounted(async () => {
    await toGetNeedInfo();
    const operation = searchParam.operation || "";
    const materialPurchaseNo = searchParam.materialPurchaseNo || "";
    const materialPurchaseId = Number(searchParam.materialPurchaseId);

    // 存在操作符，执行快捷操作
    if (operation === "add") {
      toFastOperation(materialPurchaseId);
    }

    if (materialPurchaseNo) {
      pageState.keyword = materialPurchaseNo;
    }

    // 获取列表
    toGetList();
  });

  /** 快捷操作 */
  function toFastOperation(materialPurchaseId: number) {
    modalAddState.materialPurchaseId = materialPurchaseId;
    handleBatchAdd();
  }

  /** 点击 - 库存日志点击  */
  function handleBatchStockLogClick(record?: MaterialBatchInfo) {
    if (record) {
      const { id: materialBatchId } = record;
      modalStockLogState.materialBatchId = materialBatchId;
    }
    modalStockLogState.visible = true;
  }

  /** 库存变更 */
  async function handleStockChange() {
    await toGetList();

    modalStockState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 批次接收确认 */
  async function handleReceiveSubmit() {
    // 简单校验
    const { id, value } = modalReceiveState;
    if (!value) {
      message.error("请填写入库数量");
      return;
    }

    const data = { id: id!!, stockValue: value };
    await materialBatchBatchReceive(data);
    await toGetList();

    modalReceiveState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 批次退回确认 */
  async function handleBackSubmit() {
    // 简单校验
    const { id } = modalBackState;

    await materialBatchBatchBack(id!!);
    await toGetList();

    modalBackState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取物料批次列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await materialBatchList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 批次检测创建 */
  function handleBatchDetectionAdd(record: MaterialBatchInfo) {
    const { id: materialBatchId, materialBatchDetectionId } = record;

    modalDetectionState.mode = CommonComponentMode.ADD;
    modalDetectionState.id = undefined;
    modalDetectionState.materialBatchId = materialBatchId;
    modalDetectionState.visible = true;
    modalDetectionState.title = "物料批次-批次检测-创建";
  }

  /** 点击 - 批次检测编辑 */
  function handleBatchDetectionEdit(record: MaterialBatchInfo) {
    const { id: materialBatchId, materialBatchDetectionId } = record;

    modalDetectionState.mode = CommonComponentMode.EDIT;
    modalDetectionState.id = materialBatchDetectionId;
    modalDetectionState.materialBatchId = materialBatchId;
    modalDetectionState.visible = true;
    modalDetectionState.title = "物料批次-批次检测-编辑";
  }

  /** 点击 - 批次检测详情 */
  function handleBatchDetectionDetail(record: MaterialBatchInfo) {
    const { id: materialBatchId, materialBatchDetectionId } = record;

    modalDetectionState.mode = CommonComponentMode.DETAIL;
    modalDetectionState.id = materialBatchDetectionId;
    modalDetectionState.materialBatchId = materialBatchId;
    modalDetectionState.visible = true;
    modalDetectionState.title = "物料批次-批次检测-详情";
  }

  /** 点击 - 创建物料批次 */
  function handleBatchAdd() {
    modalAddState.id = undefined;
    modalAddState.mode = undefined;
    modalAddState.visible = true;
    modalAddState.title = "物料批次-创建";
  }

  /** 点击 - 编辑物料批次 */
  function handleBatchEdit(record: MaterialBatchInfo) {
    const { id } = record;
    if (record.batchStatus !== BatchStatus.DEFAULT) {
      modalAddState.mode = CommonComponentMode.DETAIL;
    } else {
      modalAddState.mode = undefined;
    }
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "物料批次-编辑";
  }

  /** 点击 - 出库 */
  function handleBatchStockOut(record: MaterialBatchInfo) {
    const { id: materialBatchId, materialId, materialSpecsId } = record;

    modalStockState.materialBatchId = materialBatchId;
    modalStockState.materialId = materialId;
    modalStockState.materialSpecsId = materialSpecsId;
    modalStockState.operationType = BatchStockLogOperationType.STOCK_OUT;
    modalStockState.title = "物料批次-库存操作";
    modalStockState.visible = true;
  }

  /** 点击 - 入库 */
  function handleBatchStockIn(record: MaterialBatchInfo) {
    const { id: materialBatchId, materialId, materialSpecsId } = record;

    modalStockState.materialBatchId = materialBatchId;
    modalStockState.materialId = materialId;
    modalStockState.materialSpecsId = materialSpecsId;
    modalStockState.operationType = BatchStockLogOperationType.STOCK_IN;
    modalStockState.title = "物料批次-库存操作";
    modalStockState.visible = true;
  }

  /** 点击 - 盘库 */
  function handleBatchStockReset(record: MaterialBatchInfo) {
    const { id: materialBatchId, materialId, materialSpecsId } = record;

    modalStockState.materialBatchId = materialBatchId;
    modalStockState.materialId = materialId;
    modalStockState.materialSpecsId = materialSpecsId;
    modalStockState.operationType = BatchStockLogOperationType.STOCK_RESET;
    modalStockState.title = "物料批次-库存操作";
    modalStockState.visible = true;
  }

  /** 点击 - 批次接收 */
  function handleBatchReceive(record: MaterialBatchInfo) {
    modalReceiveState.id = record.id;
    modalReceiveState.value = record.supplyValue;
    modalReceiveState.title = "物料批次-批次接收";
    modalReceiveState.visible = true;
  }

  /** 点击 - 批次退回 */
  function handleBatchBack(record: MaterialBatchInfo) {
    modalBackState.id = record.id;
    modalBackState.title = "物料批次 - 批次退回";
    modalBackState.visible = true;
  }

  /** 点击 - 删除 */
  function handleDelete(record: MaterialBatchInfo) {
    const { id, batchNo } = record;
    Modal.confirm({
      title: `确认删除物料批次: ${batchNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await materialBatchDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** Detection 组件变化 */
  async function handleDetectionChange() {
    await toGetList();
    modalDetectionState.visible = false;
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
