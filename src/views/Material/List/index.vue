<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div>
        <Select
          allowClear
          placeholder="物料类型"
          v-model:value="pageState.dictItemMaterialTypeId"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ id, itemValue } in dataStore.dictItemMaterialTypeList" :key="id" :value="id">
            {{ itemValue }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入物料编号或名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleMaterialAdd">创建物料 + </Button>

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
                  <span class="flex items-center text-primary"> <UploadOutlined /><p>上传物料xlsx</p> </span>
                </Upload>
              </Menu.Item>

              <Menu.Divider />
              <Menu.Item @click="handleDownloadXlsx">
                <span class="flex items-center text-success"> <p>物料xlsx模版</p> </span>
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
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 物料类型 -->
          <template v-if="column.dataIndex === 'dictItemMaterialTypeId'">
            <span>{{ record.dictItemMaterialTypeInfo.itemValue }}</span>
          </template>

          <!-- 物料名称 -->
          <template v-if="column.dataIndex === 'materialName'">
            <span class="text-primary">{{ record.materialName }}</span>
          </template>

          <!-- 用量单位 -->
          <template v-if="column.dataIndex === 'dictItemMaterialUnitId'">
            <span>{{ record.dictItemMaterialUnitInfo.itemValue }}</span>
          </template>

          <!-- 物料选项列表 -->
          <template v-if="column.dataIndex === 'materialSpecsList'">
            <SpecsTable
              :mode="CommonComponentMode.DETAIL"
              :showHeader="false"
              hideColumns="action"
              :value="record.materialSpecsList"
            />
          </template>

          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="handleMaterialDetectionManage(record)"> 检测项管理 </a>
            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleMaterialEdit(record)">
                    <span class="text-primary hover-opacity">编辑</span>
                  </Menu.Item>

                  <!-- <Menu.Divider />
                  <Menu.Item @click="handleMaterialCopy(record)">
                    <span class="text-primary hover-opacity">复制物料</span>
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

  <!-- 弹窗 - 创建物料 -->
  <Modal
    :style="{ minWidth: AntModalWidth.lg }"
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
  >
    <div class="!-mt-20px">
      <Add :id="modalAddState.id" @change="handleAddChange" />
    </div>
  </Modal>

  <!-- 弹窗 - 物料检测项管理 -->
  <Modal
    :style="{ minWidth: AntModalWidth.lg }"
    v-model:visible="modalDetectionState.visible"
    :title="modalDetectionState.title"
    :footer="null"
    destroyOnClose
  >
    <MaterialDetectionManage :materialId="modalDetectionState.materialId" @change:ok="onMaterialDetectionChangeOk" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Popover, Select } from "ant-design-vue";
  import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { XLSX_TEMPLATE_PATH, defaultPageSize, defaultSort } from "/@/config";
  import { useTable } from "./useTable";
  import { createDownload, debounce, delay } from "/@/utils/util";
  import { materialList, materialDel } from "/@/api/material";
  import { useRouter } from "vue-router";
  import { DownOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { MaterialDetail, MaterialInfo } from "/@/api/model/material";
  import { useDataStore } from "/@/store";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { MaterialSpecsDetail } from "/@/api/model/materialSpecs";
  import MaterialDetectionManage from "../MaterialDetectionManage/index.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import SpecsTable from "/@/views/Material/Add/specs-table.vue";
  import { useGlobSetting } from "/@/hooks/setting";
  import Upload from "/@/components/Upload/index.vue";

  const router = useRouter();

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id asc",
    keyword: "",
    dictItemMaterialTypeId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { materialSpecsColumns, columns, dataSource } = useTable();

  const dataStore = useDataStore();

  /** xlsx上传地址 */
  const xlsxUploadUrl = computed(() => {
    const { domainUrl, apiUrlPrefix } = useGlobSetting();
    return `${domainUrl}${apiUrlPrefix}/file/materialImportExcel`;
  });

  const xlsxFileList = ref<any[]>([]);

  /** 弹窗 - 创建物料 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "",
  });

  /** 弹窗 - 物料检测项 */
  const modalDetectionState = reactive<{
    materialId?: number;
    visible: boolean;
    title: string;
  }>({
    materialId: undefined,
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
    const xlsxPath = XLSX_TEMPLATE_PATH.MATERIAL;
    createDownload(xlsxPath, "物料导入模板.xlsx");
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
    message.success("物料xlsx解析成功");
    xlsxFileList.value = [];
    toGetList();
  }

  /** 检测项管理 */
  async function handleMaterialDetectionManage(record: MaterialInfo) {
    toMaterialDetectionShow(record);
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取物料列表 */
  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
    };

    const { records, total } = await materialList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 变化 - 物料检测项变化 */
  async function onMaterialDetectionChangeOk() {
    await toGetList();
    modalDetectionState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 物料检测项展示 */
  function toMaterialDetectionShow(record: MaterialInfo) {
    const { id, materialName } = record;
    modalDetectionState.materialId = id;
    modalDetectionState.visible = true;
    modalDetectionState.title = `物料-检测项管理: ${materialName}`;
  }

  /** 点击 - 创建物料 */
  function handleMaterialAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建物料";
  }

  /** 点击 - 编辑物料 */
  function handleMaterialEdit(record: MaterialInfo) {
    const { id } = record;
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "编辑物料";
  }

  /** 点击 - 删除 */
  function handleDelete(record: MaterialInfo) {
    const { id, materialName } = record;
    Modal.confirm({
      title: `确认删除物料: ${materialName}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await materialDel(id);
        await toGetList();
        await dataStore.initMaterialList();

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
