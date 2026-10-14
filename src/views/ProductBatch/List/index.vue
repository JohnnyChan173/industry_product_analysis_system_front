<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <div class="mr-6px w-220px">
          <ProductRelate
            v-model:productId="pageState.productId"
            v-model:productAttrValueIdsList="pageState.productAttrValueIdsList"
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
          placeholder="请输入批次号或生产单号搜索"
          enter-button="搜索"
          allowClear
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button class="mr-8px" type="primary" ghost @click="handleBatchStockLogClick()">批次库存日志 </Button>

      <Button type="primary" @click="handleBatchAdd">创建产品批次 + </Button>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductBatchDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 产品批次号 -->
          <template v-if="column.dataIndex === 'batchNo'">
            <span>{{ text }}</span>
          </template>

          <!-- 关联任务单 -->
          <template v-if="column.dataIndex === 'productTaskInfo'">
            <span v-if="record.productTaskInfo" class="text-primary">{{ record.productTaskInfo.taskNo }}</span>
            <span v-else class="text-gray-400">/</span>
          </template>

          <!-- 产品名称 -->
          <template v-if="column.dataIndex === 'productInfo'">
            <span>{{ getProductWholeText(record.productId, record.productAttrValueIdsList) }}</span>
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

                    <span v-if="!record.productBatchDetectionId">
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

  <!-- 弹窗 - 产品批次-批次入库 -->
  <Modal
    :style="{ width: AntModalWidth.sm }"
    v-model:visible="modalReceiveState.visible"
    :title="modalReceiveState.title"
    :footer="null"
    destroyOnClose
  >
    <div>
      <p class="text-warn">确认批次入库？入库后产品即可备货销售，操作不可逆。</p>
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

  <!-- 弹窗 - 产品批次-批次退回 -->
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

  <!-- 弹窗 - 创建产品批次 -->
  <Modal
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
    :mask-closable="false"
  >
    <Add
      :mode="modalAddState.mode"
      :id="modalAddState.id"
      :productTaskId="modalAddState.productTaskId"
      @change="handleAddChange"
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
      :productBatchId="modalDetectionState.productBatchId"
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
      :productBatchId="modalStockState.productBatchId!!"
      :productId="modalStockState.productId!!"
      :productAttrValueIdsList="modalStockState.productAttrValueIdsList!!"
      :operationType="modalStockState.operationType"
      @change="handleStockChange"
    />
  </Modal>

  <!-- 弹窗 - 库存日志 -->
  <Modal
    :style="{ minWidth: AntModalWidth.xl }"
    v-model:visible="modalStockLogState.visible"
    title="产品-库存日志"
    :footer="null"
    destroyOnClose
  >
    <StockLog :productBatchId="modalStockLogState.productBatchId" />
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
  import { debounce, delay, parseList2Ids, parseSearch } from "/@/utils/util";
  import {
    productBatchList,
    productBatchDel,
    productBatchBatchReceive,
    productBatchBatchBack,
  } from "/@/api/productBatch";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { ProductInfo } from "/@/api/model/product";
  import { BatchStatus, BatchStockLogOperationType } from "/@/enums/model";
  import { ProductBatchDetail, ProductBatchInfo } from "/@/api/model/productBatch";
  import { useDataStore } from "/@/store";
  import { BatchDetectionStatusList, BatchStatusList } from "/@/config/data";
  import { getProductWholeText } from "/@/config/parse";
  import TagBatchDetectionStatus from "/@/views/baseComponents/TagBatchDetectionStatus.vue";
  import TagBatchStatus from "/@/views/baseComponents/TagBatchStatus.vue";
  import { AntModalWidth } from "/@/enums/antEnum";
  import Add from "../Add/index.vue";
  import Detection from "../Detection/index.vue";
  import Stock from "../Stock/index.vue";
  import StockLog from "../StockLog/index.vue";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";

  const router = useRouter();

  const searchParam = parseSearch();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    productId: undefined,
    productAttrValueIdsList: [],
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

  const productAllList = ref<ProductInfo[]>([]);
  const productFilterList = ref<ProductInfo[]>([]);

  /** 弹窗 - 库存日志 */
  const modalStockLogState = reactive<{
    productBatchId?: number;
    keyword?: string;
    visible: boolean;
  }>({
    productBatchId: undefined,
    keyword: "",
    visible: false,
  });

  /** 弹窗 - 创建库存 */
  const modalStockState = reactive<{
    productBatchId?: number;
    productId?: number;
    productAttrValueIdsList?: number[];
    operationType?: BatchStockLogOperationType;
    visible: boolean;
    title: string;
  }>({
    productBatchId: undefined,
    productId: undefined,
    productAttrValueIdsList: [],
    operationType: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 创建批次 */
  const modalAddState = reactive<{
    mode?: CommonComponentMode;
    id?: number;
    productTaskId?: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    id: undefined,
    productTaskId: undefined,
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
    productBatchId?: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    id: undefined,
    productBatchId: undefined,
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
    const productTaskNo = searchParam.productTaskNo || "";
    const productTaskId = Number(searchParam.productTaskId);

    // 存在操作符，执行快捷操作
    if (operation === "add") {
      toFastOperation(productTaskId);
    }

    if (productTaskNo) {
      pageState.keyword = productTaskNo;
    }

    // 获取列表
    toGetList();
  });

  /** 快捷操作 */
  function toFastOperation(productTaskId: number) {
    modalAddState.productTaskId = productTaskId;
    handleBatchAdd();
  }

  /** 点击 - 库存日志点击  */
  function handleBatchStockLogClick(record?: ProductBatchInfo) {
    if (record) {
      const { id: productBatchId } = record;
      modalStockLogState.productBatchId = productBatchId;
    }
    modalStockLogState.visible = true;
  }

  /** 库存变更 */
  async function handleStockChange() {
    await toGetList();

    modalStockState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 产品搜索 */
  function onProductSelectSearch(input: string) {
    const al = productAllList.value;
    const filterList = al.filter((item) => item.productName.includes(input));
    productFilterList.value = filterList;
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
    await productBatchBatchReceive(data);
    await toGetList();

    modalReceiveState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 批次退回确认 */
  async function handleBackSubmit() {
    // 简单校验
    const { id } = modalBackState;

    await productBatchBatchBack(id!!);
    await toGetList();

    modalBackState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取产品批次列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
      productAttrValueIdsList: parseList2Ids(pageState.productAttrValueIdsList),
    };

    const { records, total } = await productBatchList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 批次检测创建 */
  function handleBatchDetectionAdd(record: ProductBatchInfo) {
    const { id: productBatchId, productBatchDetectionId } = record;

    modalDetectionState.mode = CommonComponentMode.ADD;
    modalDetectionState.id = undefined;
    modalDetectionState.productBatchId = productBatchId;
    modalDetectionState.visible = true;
    modalDetectionState.title = "产品批次-批次检测-创建";
  }

  /** 点击 - 批次检测编辑 */
  function handleBatchDetectionEdit(record: ProductBatchInfo) {
    const { id: productBatchId, productBatchDetectionId } = record;

    modalDetectionState.mode = CommonComponentMode.EDIT;
    modalDetectionState.id = productBatchDetectionId;
    modalDetectionState.productBatchId = productBatchId;
    modalDetectionState.visible = true;
    modalDetectionState.title = "产品批次-批次检测-编辑";
  }

  /** 点击 - 批次检测详情 */
  function handleBatchDetectionDetail(record: ProductBatchInfo) {
    const { id: productBatchId, productBatchDetectionId } = record;

    modalDetectionState.mode = CommonComponentMode.DETAIL;
    modalDetectionState.id = productBatchDetectionId;
    modalDetectionState.productBatchId = productBatchId;
    modalDetectionState.visible = true;
    modalDetectionState.title = "产品批次-批次检测-详情";
  }

  /** 点击 - 创建产品批次 */
  function handleBatchAdd() {
    modalAddState.id = undefined;
    modalAddState.mode = undefined;
    modalAddState.visible = true;
    modalAddState.title = "产品批次-创建";
  }

  /** 点击 - 编辑产品批次 */
  function handleBatchEdit(record: ProductBatchInfo) {
    const { id } = record;
    if (record.batchStatus !== BatchStatus.DEFAULT) {
      modalAddState.mode = CommonComponentMode.DETAIL;
    } else {
      modalAddState.mode = undefined;
    }
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "产品批次-编辑";
  }

  /** 点击 - 出库 */
  function handleBatchStockOut(record: ProductBatchInfo) {
    const { id: productBatchId, productId, productAttrValueIdsList } = record;

    modalStockState.productBatchId = productBatchId;
    modalStockState.productId = productId;
    modalStockState.productAttrValueIdsList = productAttrValueIdsList;
    modalStockState.operationType = BatchStockLogOperationType.STOCK_OUT;
    modalStockState.title = "产品批次-库存操作";
    modalStockState.visible = true;
  }

  /** 点击 - 入库 */
  function handleBatchStockIn(record: ProductBatchInfo) {
    const { id: productBatchId, productId, productAttrValueIdsList } = record;

    modalStockState.productBatchId = productBatchId;
    modalStockState.productId = productId;
    modalStockState.productAttrValueIdsList = productAttrValueIdsList;
    modalStockState.operationType = BatchStockLogOperationType.STOCK_IN;
    modalStockState.title = "产品批次-库存操作";
    modalStockState.visible = true;
  }

  /** 点击 - 盘库 */
  function handleBatchStockReset(record: ProductBatchInfo) {
    const { id: productBatchId, productId, productAttrValueIdsList } = record;

    modalStockState.productBatchId = productBatchId;
    modalStockState.productId = productId;
    modalStockState.productAttrValueIdsList = productAttrValueIdsList;
    modalStockState.operationType = BatchStockLogOperationType.STOCK_RESET;
    modalStockState.title = "产品批次-库存操作";
    modalStockState.visible = true;
  }

  /** 点击 - 批次接收 */
  function handleBatchReceive(record: ProductBatchInfo) {
    modalReceiveState.id = record.id;
    modalReceiveState.value = record.supplyValue;
    modalReceiveState.title = "产品批次-批次接收";
    modalReceiveState.visible = true;
  }

  /** 点击 - 批次退回 */
  function handleBatchBack(record: ProductBatchInfo) {
    modalBackState.id = record.id;
    modalBackState.title = "产品批次 - 批次退回";
    modalBackState.visible = true;
  }

  /** 点击 - 删除 */
  function handleDelete(record: ProductBatchInfo) {
    const { id, batchNo } = record;
    Modal.confirm({
      title: `确认删除产品批次: ${batchNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await productBatchDel(id);
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
