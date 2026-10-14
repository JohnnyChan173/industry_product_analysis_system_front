<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div>
        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入工艺编号或名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleCraftAdd">创建工艺 + </Button>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<CraftDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 工艺编号 -->
          <template v-if="column.dataIndex === 'craftNo'">
            <span>{{ record.craftNo }}</span>
          </template>

          <!-- 工艺名称 -->
          <template v-if="column.dataIndex === 'craftName'">
            <span>{{ record.craftName }}</span>
          </template>

          <!-- 工艺适用产品 -->
          <template v-if="column.dataIndex === 'craftProductList'">
            <div style="width: 100%; display: flex; flex-wrap: wrap;justify-content: center;">
              <!-- <a-row :gutter="8" :justify="'space-around'"> -->
              <div v-for="item in record.craftProductList" :key="item.id" style="margin: 4px;">
                <TagProduct
                  :info="item"
                  style="width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px;"
                />
              </div>
            </div>
          </template>

          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="() => handleCraftDetail(record)"> 查看 </a>
            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleCraftEdit(record)">
                    <span class="text-primary hover-opacity">编辑</span>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleCraftCopy(record)">
                    <span class="text-primary hover-opacity">复制工艺</span>
                  </Menu.Item>

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

  <!-- 弹窗 - 创建工艺 -->
  <Modal
    :style="{ minWidth: AntModalWidth.lg }"
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
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Popover, Select, Tag } from "ant-design-vue";
  import { nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce, delay } from "/@/utils/util";
  import { craftList, craftDel } from "/@/api/craft";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { CraftDetail, CraftInfo } from "/@/api/model/craft";
  import { useDataStore } from "/@/store";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { PageEnum } from "/@/enums/pageEnum";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import { copyCraft } from "/@/utils/data-copy";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id asc",
    keyword: "",
    dictCraftTypeId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建工艺 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "创建工艺",
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

  /** 复制工艺 */
  async function handleCraftCopy(record: CraftInfo) {
    const { id, craftName } = record;
    Modal.confirm({
      title: `确认复制工艺: ${craftName}`,
      content: "",
      okText: "确认",
      cancelText: "取消",
      async onOk() {
        await copyCraft(id);
        await toGetList();
        message.success(CommonOperatorTip.COPY_OK);
      },
      onCancel() {},
    });
  }

  /** 工艺详情 */
  async function handleCraftDetail(record: CraftInfo) {
    const { id } = record;
    router.push({
      path: PageEnum.CRAFT_DETAIL,
      query: {
        id,
      },
    });
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取工艺列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
      craftNo: pageState.keyword,
      craftName: pageState.keyword,
    };

    const { records, total } = await craftList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 创建工艺 */
  function handleCraftAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建工艺";
  }

  /** 点击 - 编辑工艺 */
  function handleCraftEdit(record: CraftInfo) {
    const { id } = record;
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "编辑工艺";
  }

  /** 点击 - 删除 */
  function handleDelete(record: CraftInfo) {
    const { id, craftNo } = record;
    Modal.confirm({
      title: `确认删除工艺: ${craftNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await craftDel(id);
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
