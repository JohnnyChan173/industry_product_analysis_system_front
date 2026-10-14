<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div>
        <Select
          allowClear
          placeholder="产品类型"
          v-model:value="pageState.dictItemProductTypeId"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ id, itemValue } in dataStore.dictItemProductTypeList" :key="id" :value="id">
            {{ itemValue }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入产品编码或名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <!-- 批量编辑 -->
      <Button type="primary" @click="handleBatchEdit">批量编辑</Button>
      <Button type="primary" @click="handleProductAdd">创建产品 + </Button>

      <div class="uploadXlsx">
        <Dropdown>
          <div class="uploadXlsx-arrow">
            <DownOutlined />
          </div>
          <template #overlay>
            <Menu>
              <Menu.Item>
                <Upload
                  class="uploadXlsx-btn"
                  accept=".xls,.xlsx"
                  :actionUrl="xlsxUploadUrl"
                  v-model:value="xlsxFileList"
                  :beforeUpload="handleXlsxBeforeUpload"
                  @uploaded="handleXlsxUploaded"
                  @error="handleXlsxUploadError"
                  :showUploadList="false"
                >
                  <span class="flex items-center text-primary"> <UploadOutlined /><p>上传产品xlsx</p> </span>
                </Upload>
              </Menu.Item>

              <Menu.Divider />
              <Menu.Item @click="handleDownloadXlsx">
                <span class="flex items-center text-success"><p>产品xlsx模版</p> </span>
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        class="headerify"
        rowKey="id"
        :loading="otherState.loading"
        :dataSource="dataSource"
        :columns="columns"
        size="small"
        :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
        :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 产品编码 -->
          <template v-if="column.dataIndex === 'productNo'">
            <span>{{ record.productNo }}</span>
          </template>

          <!-- 产品名称 -->
          <template v-if="column.dataIndex === 'productName'">
            <span class="text-primary">{{ record.productName }}</span>
          </template>

          <!-- 产品型号 -->
          <template v-if="column.dataIndex === 'productModel'">
            <span>{{ record.productModel }}</span>
          </template>

          <!-- 产品类型 -->
          <template v-if="column.dataIndex === 'dictItemProductTypeId'">
            <span>{{ record.dictItemProductTypeInfo?.itemValue }}</span>
          </template>

          <!-- 产品选项列表 -->
          <template v-if="column.dataIndex === 'productAttrList'">
            <div>
              <Table
                class="borderify"
                bordered
                size="small"
                :showHeader="false"
                :dataSource="record.productAttrList"
                :columns="productAttrColumns"
                :pagination="false"
              >
                <template #emptyText>
                  <span class="text-gray-400">产品未设置选项</span>
                </template>
                <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductAttrDetail>">
                  <!-- 产品选项列表-选项值列表 -->
                  <template v-if="column.dataIndex === 'productAttrValueList'">
                    <span>{{ getProductAttrValueListText(text) }}</span>
                  </template>
                </template>
              </Table>
            </div>
          </template>

          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="handleProductDetectionManage(record)"> 检测项管理 </a>
            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="() => handleProductAttrManage(record)">
                    <span class="text-primary hover-opacity">选项管理</span>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleProductBOMManage(record)">
                    <span class="text-primary hover-opacity">BOM管理</span>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleProductEdit(record)">
                    <span class="text-primary hover-opacity">编辑</span>
                  </Menu.Item>

                  <!-- <Menu.Divider />
                  <Menu.Item @click="handleProductCopy(record)">
                    <span class="text-primary hover-opacity">复制产品</span>
                  </Menu.Item> -->

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

  <!-- 弹窗 - 创建产品 -->
  <Modal v-model:visible="modalAddState.visible" :title="modalAddState.title" :footer="null" destroyOnClose>
    <Add :id="modalAddState.id" @change="handleAddChange" />
  </Modal>

  <!-- 弹窗 - 产品选项管理 -->
  <Modal
    :style="{ minWidth: AntModalWidth.md }"
    v-model:visible="modalAttrState.visible"
    :title="modalAttrState.title"
    :footer="null"
    destroyOnClose
  >
    <ProductAttrManage :productId="modalAttrState.productId" @change:ok="onProductAttrChangeOk" />
  </Modal>

  <!-- 弹窗 - 产品检测项管理 -->
  <Modal
    :style="{ minWidth: AntModalWidth.lg }"
    v-model:visible="modalDetectionState.visible"
    :title="modalDetectionState.title"
    :footer="null"
    destroyOnClose
  >
    <ProductDetectionManage :productId="modalDetectionState.productId" @change:ok="onProductDetectionChangeOk" />
  </Modal>
  <!-- 弹窗 - 产品编辑 -->
  <Modal
    :style="{ width: AntModalWidth.xl }"
    v-model:visible="state.showEditModal"
    :title="'批量编辑产品'"
    :footer="null"
    destroyOnClose
  >
    <Edit :list="state.list" @change:ok="onProductChangeOk" v-if="state.showEditModal"/>
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Popover, Select } from "ant-design-vue";
  import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { XLSX_TEMPLATE_PATH, defaultPageSize, defaultSort } from "/@/config";
  import { useTable } from "./useTable";
  import { createDownload, debounce, delay } from "/@/utils/util";
  import { productList, productDel } from "/@/api/product";
  import { useRouter } from "vue-router";
  import { DownOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { ProductDetail, ProductInfo } from "/@/api/model/product";
  import { useDataStore } from "/@/store";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { ProductAttrDetail } from "/@/api/model/productAttr";
  import { getProductAttrValueListText } from "/@/config/parse";
  import ProductAttrManage from "../ProductAttrManage/index.vue";
  import ProductDetectionManage from "../ProductDetectionManage/index.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { useGlobSetting } from "/@/hooks/setting";
  import Upload from "/@/components/Upload/index.vue";
  import Edit from "../edit/index.vue";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id asc",
    keyword: "",
    dictItemProductTypeId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { productAttrColumns, columns, dataSource } = useTable();
  const state = reactive({
    selectedRowKeys: [] as number[],
    showEditModal: false,
    list: [] as ProductDetail[],
  });
  /** 选择行 */
  function onSelectChange(keys: number[]) {
    state.selectedRowKeys = keys;
    const arr = dataSource.value.filter((item) => state.selectedRowKeys.includes(item.id));
    state.list = JSON.parse(JSON.stringify(arr));
  }
  /** 批量编辑 */
  function handleBatchEdit() {
    if (state.selectedRowKeys.length === 0) {
      message.warning("请选择产品");
      return;
    }
    state.showEditModal = true;
  }
  const dataStore = useDataStore();

  /** xlsx上传地址 */
  const xlsxUploadUrl = computed(() => {
    const { domainUrl, apiUrlPrefix } = useGlobSetting();
    return `${domainUrl}${apiUrlPrefix}/file/productImportExcel`;
  });

  const xlsxFileList = ref<any[]>([]);

  /** 弹窗 - 创建产品 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 产品选项 */
  const modalAttrState = reactive<{
    productId?: number;
    visible: boolean;
    title: string;
  }>({
    productId: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 产品检测项 */
  const modalDetectionState = reactive<{
    productId?: number;
    visible: boolean;
    title: string;
  }>({
    productId: undefined,
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
  onMounted(() => {
    toGetNeedInfo();

    // 获取列表
    toGetList();
  });

  /** xlsx 下载 */
  function handleDownloadXlsx() {
    const xlsxPath = XLSX_TEMPLATE_PATH.PRODUCT;
    createDownload(xlsxPath, "产品导入模板.xlsx");
  }

  /** xlsx上传前置 */
  function handleXlsxBeforeUpload() {
    message.loading("xlsx文件上传中...");
  }

  /** xlsx上传失败 */
  function handleXlsxUploadError(file: any, msg: string) {
    message.destroy();
    message.error(msg);
    xlsxFileList.value = [];
  }

  /** xlsx文件上传成功 */
  function handleXlsxUploaded(file: any) {
    message.destroy();
    message.success("产品xlsx解析成功");
    xlsxFileList.value = [];
    toGetList();
  }

  /** 检测项管理 */
  async function handleProductDetectionManage(record: ProductInfo) {
    toProductDetectionShow(record);
  }

  /** BOM管理 */
  async function handleProductBOMManage(record: ProductInfo) {
    const { id } = record;
    router.push({
      path: PageEnum.PRODUCT_BOM_DETAIL,
      query: {
        productId: id,
      },
    });
  }

  /** 产品选项管理 */
  async function handleProductAttrManage(record: ProductInfo) {
    toProductAttrShow(record);
  }

  /** 复制产品 */
  async function handleProductCopy(record: any) {
    message.info(CommonOperatorTip.DEVELOPING);
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取产品列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await productList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 变化 - 产品选项变化 */
  async function onProductAttrChangeOk() {
    await toGetList();
  }

  /** 点击 - 产品选项展示 */
  function toProductAttrShow(record: ProductInfo) {
    const { id, productName } = record;
    modalAttrState.productId = id;
    modalAttrState.visible = true;
    modalAttrState.title = `产品-选项管理: ${productName}`;
  }

  /** 变化 - 产品检测项变化 */
  async function onProductDetectionChangeOk() {
    // 无需更新
    // await toGetList();
  }

  /** 变化 - 产品变化 */
  async function onProductChangeOk() {
    state.selectedRowKeys = [];
    state.list = [];
    await toGetList();
  }
  /** 点击 - 产品检测项展示 */
  function toProductDetectionShow(record: ProductInfo) {
    const { id, productName } = record;
    modalDetectionState.productId = id;
    modalDetectionState.visible = true;
    modalDetectionState.title = `产品-检测项管理: ${productName}`;
  }

  /** 点击 - 创建产品 */
  function handleProductAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建产品";
  }

  /** 点击 - 编辑产品 */
  function handleProductEdit(record: ProductInfo) {
    const { id } = record;
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "编辑产品";
  }

  /** 点击 - 删除 */
  function handleDelete(record: ProductInfo) {
    const { id, productNo } = record;
    Modal.confirm({
      title: `确认删除产品: ${productNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await productDel(id);
        await toGetList();
        await dataStore.initProductList();
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
