<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <Input.Search
        allowClear
        :style="{ width: AntButtonWidth.xl }"
        v-model:value="pageState.keyword"
        placeholder="输入字典名称搜索"
        enter-button="搜索"
        @search="handleSearch"
      />
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleUserAdd">创建字典 + </Button>
      <Button type="primary" @click="handleDownloadXlsx">下载模板</Button>
      <a-upload :beforeUpload="handleImportXlsxClick" :showUploadList="false" accept=".xlsx">
        <Button type="primary" class="success">
          <UploadOutlined />
          上传字典数据
        </Button>
      </a-upload>
    </template>

    <!-- 3、主体区 -->
    <template #default>
      <Table
        class="!max-w-820px my-table"
        rowKey="id"
        :loading="state.loading"
        :dataSource="dataSource"
        :columns="columns"
        :pagination="{
          size: 'default',
          total: state.total,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<any>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 数据量 -->
          <template v-if="column.dataIndex === 'dictItemTotal'">
            <span class="text-gray-400">{{ text }}</span>
          </template>

          <!-- 操作 -->
          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="() => handleDictConfig(record.id, record)"> 配置字典 </a>

            <!-- <Divider type="vertical" />

            <span>
              <Dropdown>
                <a class="ant-dropdown-link" @click.prevent>
                  更多
                  <DownOutlined />
                </a>
                <template #overlay>
                  <Menu>
                    <Menu.Item @click="() => handleDictEdit(record.id)">
                      <a class="!text-primary" > 编辑 </a>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="() => handleUserDelClick(record.id, record)">
                      <a class="!text-danger" > 删除 </a>
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </span> -->
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建字典 -->
  <Modal
    v-model:visible="modalAddState.visible"
    :title="compModeText(modalAddState.id, '字典')"
    :footer="null"
    destroyOnClose
  >
    <Add :id="modalAddState.id" @change="handleAddChange" />
  </Modal>

  <!-- 弹窗 - 配置字典 -->
  <Modal
    :style="{ width: '520px' }"
    v-model:visible="modalConfigState.visible"
    :title="`配置字典: ${modalConfigState.dictName}`"
    :footer="null"
    destroyOnClose
    @cancel="handleConfigModalCancel"
  >
    <Config :dictId="modalConfigState.id" :dictNo="modalConfigState.dictNo" />
  </Modal>
</template>

<script setup lang="ts">
  import { Button, Dropdown, Menu, Input, Modal, Table, Divider, message } from "ant-design-vue";

  import { onMounted, reactive, watch } from "vue";
  import { useRouter } from "vue-router";
  import { DownOutlined, UploadOutlined } from "@ant-design/icons-vue";
  import { AntButtonWidth, AntModalWidth } from "/@/enums/antEnum";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { useTable } from "./useTable";
  import { defaultPageSize, defaultSort, XLSX_TEMPLATE_PATH } from "/@/config";
  import { debounce, compModeText, createDownload } from "/@/utils/util";
  import { BodyCellData } from "/#/antd";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import Add from "../Add/index.vue";
  import Config from "../Config/index.vue";
  import { dictDel, dictList } from "/@/api/dict";
  import { DictInfo } from "/@/api/model/dict";
  import { dictItemImport } from "/@/api/dictItem";
  import { createLoading } from "/@/components/Loading/createLoading";

  /** 数据 */
  const state = reactive({
    loading: true,
    total: 0,
  });

  /** 分页数据 */
  const pageState = reactive({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: defaultSort,
    keyword: "",
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建字典 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
  }>({
    id: undefined,
    visible: false,
  });

  /** 弹窗 - 配置字典 */
  const modalConfigState = reactive<{
    id?: number;
    visible: boolean;
    dictName: string;
    dictNo: string;
  }>({
    id: undefined,
    visible: false,
    dictName: "",
    dictNo: "",
  });

  const debounceToGetList = debounce(toGetList, 200);

  // 检测分页变化
  watch(
    () => pageState,
    () => {
      debounceToGetList();
    },
    {
      deep: true,
    }
  );

  // mounted
  onMounted(() => {
    toGetList();
  });

  /** 点击 - 字典删除 */
  async function handleUserDelClick(id: number, record: any) {
    const { dictName } = record;
    Modal.confirm({
      title: `确认删除字典: [${dictName}]`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await dictDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 获取列表 */
  async function toGetList() {
    state.loading = true;
    const { records, total } = await dictList(pageState);
    dataSource.value = records;
    state.total = total;
    state.loading = false;
  }

  /** 点击 - 创建字典 */
  function handleUserAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
  }

  /** 点击 - 配置字典 */
  function handleDictConfig(id: number, record: DictInfo) {
    modalConfigState.id = id;
    modalConfigState.dictName = record.dictName;
    modalConfigState.dictNo = record.dictNo;
    modalConfigState.visible = true;
  }

  /** 点击 - 编辑字典 */
  function handleDictEdit(id: number) {
    modalAddState.id = id;
    modalAddState.visible = true;
  }

  /** Add 组件变化 */
  async function handleAddChange() {
    await toGetList();
    modalAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** ConfigModal 弹窗关闭 */
  async function handleConfigModalCancel() {
    await toGetList();
    modalConfigState.visible = false;
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

  function handleDownloadXlsx() {
    const xlsxPath = XLSX_TEMPLATE_PATH.TENANT_DICT;
    createDownload(xlsxPath, "字典模板.xlsx");
  }

  async function handleImportXlsxClick(file: File) {
    state.loading = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      await dictItemImport(formData);
      message.success("导入成功");
      await toGetList();
    } catch (e) {
      // 接口失败/异常都会走到这里
      // 如果 request 层已经统一弹了 message.error，这里可以只 console 或留空
      console.error("字典导入失败:", e);
    } finally {
      state.loading = false;
    }
    // 阻止 a-upload 默认上传行为
    return Promise.reject();
  }
</script>

<style lang="less" scoped></style>
