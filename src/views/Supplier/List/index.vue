<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div>
        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入供应商编号或名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleSupplierAdd">创建供应商 + </Button>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<SupplierDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 供应商编号 -->
          <template v-if="column.dataIndex === 'supplierNo'">
            <span>{{ record.supplierNo }}</span>
          </template>

          <!-- 供应商名称 -->
          <template v-if="column.dataIndex === 'supplierName'">
            <span>{{ record.supplierName }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="handleSupplierEdit(record.id)"> 编辑 </a>
            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleDelete(record, record.id)">
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

  <!-- 弹窗 - 创建供应商 -->
  <Modal v-model:visible="modalAddState.visible" :title="modalAddState.title" :footer="null" destroyOnClose>
    <Add :id="modalAddState.id" @change="handleAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Popover, Select } from "ant-design-vue";
  import { nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce, delay } from "/@/utils/util";
  import { supplierList, supplierDel } from "/@/api/supplier";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { SupplierDetail, SupplierInfo } from "/@/api/model/supplier";
  import { useDataStore } from "/@/store";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id asc",
    keyword: "",
    dictItemSupplierTypeId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建供应商 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "创建供应商",
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

  /** 获取供应商列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await supplierList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 创建供应商 */
  function handleSupplierAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建供应商";
  }

  /** 点击 - 编辑供应商 */
  function handleSupplierEdit(id: number) {
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "编辑供应商";
  }

  /** 点击 - 删除 */
  function handleDelete(record: any, id: number) {
    const { supplierNo } = record;
    Modal.confirm({
      title: `确认删除供应商: ${supplierNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await supplierDel(id);
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
