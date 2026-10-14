<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <Select
          allowClear
          placeholder="采购单状态"
          v-model:value="pageState.purchaseStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in MaterialPurchaseStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '260px' }"
          v-model:value="pageState.keyword"
          placeholder="输入采购单编号搜索"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleProductAdd">创建采购单 + </Button>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialPurchaseDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 采购单编号 -->
          <template v-if="column.dataIndex === 'purchaseNo'">
            <span>{{ text }}</span>
          </template>

          <!-- 供应商对象 -->
          <template v-if="column.dataIndex === 'supplierInfo'">
            <span>{{ record.supplierInfo.supplierName }}</span>
          </template>

          <!-- 采购物料列表（物料名称+单价+数量） -->
          <template v-if="column.dataIndex === 'materialPurchaseItemList'">
            <PurchaseItemTable
              :mode="CommonComponentMode.DETAIL"
              :showHeader="false"
              hideColumns="action,priceTotal"
              v-model:value="record.materialPurchaseItemList"
            />
          </template>

          <!-- 总金额 -->
          <template v-if="column.key === 'priceTotal'">
            <span class="text-warn">￥{{ getMaterialPurchasePriceTotal(record.materialPurchaseItemList) }}</span>
          </template>

          <!-- 采购单状态 -->
          <template v-if="column.dataIndex === 'purchaseStatus'">
            <TagMaterialPurchaseStatus :value="record.purchaseStatus" />
          </template>

          <!-- 关联物料批 -->
          <template v-if="column.dataIndex === 'materialBatchIdList'">
            <div
              v-if="record.materialBatchIdList"
              class="text-primary hover-underline"
              @click="handleRelateMaterialBatch(record)"
            >
              {{ record.materialBatchIdList.length }} 批
            </div>
            <span v-else class="text-gray-400">(暂无批关联)</span>
          </template>

          <template v-if="column.key === 'action'">
            <span class="text-primary hover-opacity" @click="handleMaterialPurchaseEdit(record)"> 编辑 </span>

            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <span v-if="record.purchaseStatus === MaterialPurchaseStatus.READY">
                    <Menu.Divider />
                    <Menu.Item @click="handleTaskComplete(record)">
                      <span class="text-success hover-opacity"> 完成采购单 </span>
                    </Menu.Item>
                  </span>

                  <span>
                    <Menu.Divider />
                    <Menu.Item @click="handleTaskFastBatch(record)">
                      <span class="text-primary hover-opacity"> 快捷物料批 </span>
                    </Menu.Item>
                  </span>

                  <Menu.Divider />
                  <Menu.Item @click="handleDelete(record)">
                    <span class="text-danger hover-opacity">删除</span>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建采购单 -->
  <Modal
    :style="{ minWidth: '780px' }"
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
  >
    <Add :id="modalAddState.id" :mode="modalAddState.mode" @change="handleAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Select } from "ant-design-vue";
  import { onMounted, reactive, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import { materialPurchaseList, materialPurchaseDel, materialPurchaseComplete } from "/@/api/materialPurchase";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { MaterialPurchaseStatusList } from "/@/config/data";
  import { MaterialPurchaseDetail } from "/@/api/model/materialPurchase";
  import TagMaterialPurchaseStatus from "/@/views/baseComponents/TagMaterialPurchaseStatus.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { MaterialPurchaseStatus } from "/@/enums/model";
  import { getMaterialPurchasePriceTotal } from "/@/config/parse";
  import PurchaseItemTable from "/@/views/MaterialPurchase/Add/purchase-item-table.vue";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    purchaseStatus: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建采购单 */
  const modalAddState = reactive<{
    mode?: CommonComponentMode;
    id?: number;
    visible: boolean;
    title: string;
  }>({
    mode: undefined,
    id: undefined,
    visible: false,
    title: "物料采购单-",
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

  /** 跳转物料批次页 */
  async function handleRelateMaterialBatch(record: MaterialPurchaseDetail) {
    const { purchaseNo } = record;
    const query = {
      materialPurchaseNo: purchaseNo,
    };

    router.push({
      path: PageEnum.MATERIAL_BATCH_LIST,
      query,
    });
  }

  /** 快捷创建物料批次 */
  async function handleTaskFastBatch(record: MaterialPurchaseDetail) {
    const { id: materialPurchaseId } = record;
    const query = {
      materialPurchaseId,
      operation: "add",
    };

    router.push({
      path: PageEnum.MATERIAL_BATCH_LIST,
      query,
    });
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取采购单列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await materialPurchaseList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 创建采购单 */
  function handleProductAdd() {
    modalAddState.id = undefined;
    modalAddState.mode = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建采购单";
  }

  /** 点击 - 完成采购单 */
  function handleTaskComplete(record: MaterialPurchaseDetail) {
    const { id, purchaseNo } = record;
    Modal.confirm({
      title: `确认采购单: ${purchaseNo} 已完成？`,
      content: "",
      okText: "确认",
      cancelText: "取消",
      async onOk() {
        await materialPurchaseComplete(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 编辑采购单 */
  function handleMaterialPurchaseEdit(record: MaterialPurchaseDetail) {
    const { id } = record;
    if (record.purchaseStatus !== MaterialPurchaseStatus.READY) {
      modalAddState.mode = CommonComponentMode.DETAIL;
    } else {
      modalAddState.mode = undefined;
    }
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "物料采购单-编辑";
  }

  /** 点击 - 删除 */
  function handleDelete(record: MaterialPurchaseDetail) {
    const { id, purchaseNo } = record;
    Modal.confirm({
      title: `确认删除采购单: ${purchaseNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await materialPurchaseDel(id);
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
