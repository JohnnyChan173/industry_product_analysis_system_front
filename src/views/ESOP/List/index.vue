<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <!-- <LineRelate class="mr-6px" v-model:lineId="pageState.lineId" /> -->
        <Input :style="{ width: '300px', marginRight: '10px' }" v-model:value="pageState.virtualLineName" placeholder="请输入虚拟产线名称过滤"/>
        <Input.Search :style="{ width: '300px' }" v-model:value="pageState.virtualStationName" placeholder="请输入虚拟工位名称过滤"
          enter-button="搜索" @search="handleSearch" />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <!-- <template #nav-right>
      <Button class="mr-4px" type="primary" @click="handleVirtualLineAdd">创建虚拟产线 + </Button>
    </template> -->

    <!-- 2、主体区 -->
    <template #default>
      <Table class="headerify !w-1080px" rowKey="id" :loading="otherState.loading" :dataSource="dataSource"
        :columns="columns" :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }">
        <template #bodyCell="{ text, record, index, column }: BodyCellData<VirtualLineDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>



          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a class="!text-secondary" @click="handleVirtualLineDetailClick(record)">查看</a>

            <Divider type="vertical" />
            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>

              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleVirtualLineEdit(record)">
                    <a class="!text-secondary">编辑</a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleVirtualLineDel(record)">
                    <a style="color: red;"> 删除 </a>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建虚拟产线 -->
  <Modal :style="{ width: '80vw' }" v-model:visible="modalAddState.visible" :title="modalAddState.title" :footer="null"
    :mask-closable="false" destroyOnClose>
    <Add class="!-mt-20px" :lineId="modalAddState.id" :virtualStationId="modalAddState.virtualStationId"
      @change="handleAddChange" />
  </Modal>

  <!-- 弹窗 - ESOP方案详情 -->
  <Modal :style="{ width: AntModalWidth.xl }" v-model:visible="modalDetailState.visible" :title="modalDetailState.title"
    :footer="null" :mask-closable="false" destroyOnClose>
    <Detail :esopDetailData="modalDetailState.esopDetailData" />
  </Modal>
</template>

<script setup lang="ts">
import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Select } from "ant-design-vue";
import { onMounted, reactive, ref, watch } from "vue";
import AreaWorkSpace from "/@/components/Area/Workspace.vue";
import { defaultPageSize } from "/@/config";
import { useTable } from "./useTable";
import { debounce } from "/@/utils/util";
import { virtualLineList, virtualLineDel } from "/@/api/virtualLine";
import { useRouter } from "vue-router";
import { DownOutlined } from "@ant-design/icons-vue";
import Add from "../../VirtualLine/ESOPAdd/index.vue";
import Detail from "../Detail/index.vue";
import { CommonOperatorTip } from "/@/enums/commonEnum";
import { BodyCellData } from "/#/antd";
import { VirtualLineDetail, VirtualLineInfo } from "/@/api/model/virtualLine";
import { AntModalWidth } from "/@/enums/antEnum";
import { LineDetailTabEnum, PageEnum } from "/@/enums/pageEnum";
import { lineListAll } from "/@/api/line";
import { LineInfo } from "/@/api/model/line";
import LineRelate from "/@/views/components/LineRelate/index.vue";
import { copyVirtualLine } from "/@/utils/data-copy";
import { esopList, esopDel } from "/@/api/esop";
import { ESOPInfo } from "/@/api/model/esop";

const router = useRouter();

/** 分页数据 */
const pageState = reactive<any>({
  pageNum: 1,
  pageSize: defaultPageSize,
  sort: "id asc",
  lineId: undefined,
  keyword: "",
  dictLineTypeId: undefined,
});

/** 其他数据 */
const otherState = reactive({
  loading: true,
  total: 0,
});

/** 表单数据 */
const { columns, dataSource } = useTable();

/** 弹窗 - 创建虚拟产线 */
const modalAddState = reactive<{
  id?: number;
  virtualStationId?: number;
  visible: boolean;
  title: string;
}>({
  id: undefined,
  virtualStationId: undefined,
  visible: false,
  title: "创建ESOP方案",
});

const modalDetailState = reactive<{
  esopDetailData?: ESOPInfo;
  visible: boolean;
  title: string;
}>({
  esopDetailData: {},
  visible: false,
  title: "ESOP方案详情",
});

const lineSelectList = ref<LineInfo[]>([]);

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

/** 复制虚拟产线 */
async function handleVirtualLineCopy(record: VirtualLineInfo) {
  const { id, virtualLineName } = record;
  Modal.confirm({
    title: `确认复制虚拟产线: ${virtualLineName}`,
    content: "",
    okText: "确认",
    cancelText: "取消",
    async onOk() {
      await copyVirtualLine(id);
      await toGetList();
      message.success(CommonOperatorTip.COPY_OK);
    },
    onCancel() { },
  });
}

/** 获取必要数据 */
async function toGetNeedInfo() {
  // 获取物理产线列表
  const records = await lineListAll();
  lineSelectList.value = records;
}

/** 获取虚拟产线列表 */
async function toGetList() {
  otherState.loading = true;

  const { records, total } = await esopList(pageState);
  dataSource.value = records;
  otherState.total = total;
  otherState.loading = false;
  console.log(records);
}

/** 点击 - 虚拟产线查看 */
function handleVirtualLineDetailClick(record: ESOPInfo) {
  // const { stationUuid } = record;
  modalDetailState.esopDetailData = record;
  modalDetailState.visible = true;
}

/** 点击 - 创建虚拟产线 */
function handleVirtualLineAdd() {
  modalAddState.id = undefined;
  modalAddState.visible = true;
  modalAddState.title = "创建ESOP方案";
}

/** 点击 - 编辑虚拟产线 */
function handleVirtualLineEdit(record: ESOPInfo & { virtualLineId: number }) {
  const { virtualLineId, virtualStationId } = record;
  modalAddState.id = virtualLineId;
  modalAddState.virtualStationId = virtualStationId;
  modalAddState.visible = true;
  modalAddState.title = "编辑ESOP方案";
}

/** 点击 - 删除虚拟产线 */
function handleVirtualLineDel(record: VirtualLineDetail) {
  const { id } = record;
  const { virtualLineName } = record;
  Modal.confirm({
    title: `确认删除ESOP方案: ${virtualLineName}`,
    content: "",
    okText: "删除",
    cancelText: "取消",
    async onOk() {
      await esopDel(id);
      await toGetList();
      message.success(CommonOperatorTip.OK);
    },
    onCancel() { },
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
