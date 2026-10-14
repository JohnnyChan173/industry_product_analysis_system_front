<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div>
        <Select :allowClear="!isCjzr" placeholder="选择车间" v-model:value="pageState.workshopId"
          style="width: 150px; margin-right: 6px">
          <Select.Option v-for="{ id, workshopName } in workshopSelectList" :key="id" :value="id">
            {{ workshopName }}
          </Select.Option>
        </Select>

        <Input.Search :style="{ width: '300px' }" v-model:value="pageState.keyword" placeholder="请输入产线编号或名称过滤"
          enter-button="搜索" @search="handleSearch" />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button class="success mr-6px !flex !items-center" type="primary" @click="handleWorkshopClick">
        <ApartmentOutlined />
        车间管理
      </Button>

      <Button class="mr-4px" type="primary" @click="handleLineAdd">创建产线 + </Button>
      <!-- 
      <Button type="primary" class="warn !flex !items-center" ghost @click="handleUnableSpotcheckClick">
        <MinusCircleOutlined />
        无法点检申请
      </Button> -->
    </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table class="headerify" rowKey="id" :loading="otherState.loading" :dataSource="dataSource" :columns="columns"
        :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }">
        <template #bodyCell="{ text, record, index, column }: BodyCellData<LineDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 产线类型 -->
          <template v-if="column.dataIndex === 'lineType'">
            <span>{{ getListItemLabel(LineTypeList, record.lineType) }}</span>
          </template>

          <!-- 产线名称-->
          <template v-if="column.dataIndex === 'lineName'">
            <span class="text-primary">{{ record.lineName }}</span>
          </template>

          <!-- 所属车间 -->
          <template v-if="column.key === 'workshopName'">
            <span>{{ record.workshopInfo.workshopName }}</span>
          </template>

          <!-- 线长-->
          <template v-if="column.dataIndex === 'lineLeaderStaffInfo'">
            <span>{{ record.lineLeaderStaffInfo?.staffName }}</span>
          </template>

          <!-- 最近登记信息 -->
          <template v-if="column.dataIndex === 'latestRegistrationInfo'">
            <Popover v-if="record.latestRegistrationInfo" placement="left">
              <template #content>
                <RegistrationPanel :info="record.latestRegistrationInfo" class="min-w-360px" />
              </template>

              <Tag class="large" :color="isToday(record.latestRegistrationInfo.startDate) ? 'blue' : ''">
                <ProductRelate class="text-primary" :mode="CommonComponentMode.DETAIL"
                  :productId="record.latestRegistrationInfo.productId"
                  :productAttrValueIdsList="record.latestRegistrationInfo.productAttrValueIdsList" />
              </Tag>
            </Popover>

            <span v-else class="text-gray-400">(暂无登记)</span>
          </template>

          <!-- 今日过程检 -->
          <!-- <template v-if="column.dataIndex === 'todayProcessCharacterSpotcheck'">
            <p class="borderify py-3px px-12px hover-opacity text-gray-400"> 未提交 </p>
          </template> -->

          <!-- 今日产品检 -->
          <!-- <template v-if="column.dataIndex === 'todayProductCharacterSpotcheck'">
            <p class="borderify py-3px px-12px hover-opacity text-gray-400"> 未提交 </p>
          </template> -->

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a class="!text-secondary" @click="handleLineDetailClick(record)">查看</a>

            <Divider type="vertical" />
            <a class="!text-secondary" @click="handleStationManage(record)">工位管理</a>

            <!-- <Divider type="vertical" /> -->
            <!-- <Dropdown>
              <a class="whitespace-nowrap">
                产线点检
                <DownOutlined />
              </a>

              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleProcessSpotcheckClick(record.id, record)">
                    <a class="!text-secondary"> 过程特性点检 </a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleProductSpotcheckClick(record.id, record)">
                    <a class="!text-secondary"> 产品特性点检 </a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleUnableSpotcheckClick(record.id, record)">
                    <a class="!text-warn"> 取消无法点检申请 </a>
                  </Menu.Item>
                </Menu>
              </template>
</Dropdown> -->

            <Divider type="vertical" />
            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>

              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleLineEdit(record)">
                    <a class="!text-secondary">编辑</a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleLineCopy(record)">
                    <a class="!text-secondary"> 复制产线 </a>
                  </Menu.Item>
                  <Menu.Divider />

                  <Menu.Item @click="handleEventStaffManage(record)">
                    <a class="!text-secondary">管理事件管理员</a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleLineDel(record)">
                    <a class="!text-danger"> 删除 </a>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 车间列表 -->
  <Modal :style="{ width: AntModalWidth.md }" v-model:visible="modalWorkshopListState.visible" title="车间管理"
    :footer="null" destroyOnClose @cancel="handleWorkshopListChange">
    <WorkshopList />
  </Modal>

  <!-- 弹窗 - 创建产线 -->
  <Modal :style="{ width: AntModalWidth.md }" v-model:visible="modalAddState.visible" :title="modalAddState.title"
    :footer="null" destroyOnClose>
    <Add :id="modalAddState.id" @change:add="handleLineAddAddChange" @change:edit="handleLineAddEditChange" />
  </Modal>

  <!-- 弹窗 - 工位管理 -->
  <Modal :style="{ width: AntModalWidth.xl }" v-model:visible="modalStationManageState.visible"
    :title="modalStationManageState.title" :footer="null" @cancel="handleStationManageChange" destroyOnClose>
    <FormTitle :size="AntUniversalSize.medium" title="1、产线工位列表" />
    <StationManage :lineId="modalStationManageState.lineId" />
  </Modal>
  <!-- 弹窗 - 事件管理员 -->
  <Modal :style="{ width: '70vw' }" v-model:visible="modalEventStaffState.visible"
    :title="modalEventStaffState.title" :footer="null" destroyOnClose>
    <EventStaff :lineId="modalEventStaffState.lineId" />
  </Modal>
</template>

<script setup lang="ts">
import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Popover, Select, Tag } from "ant-design-vue";
import { nextTick, onMounted, reactive, ref, watch } from "vue";
import AreaWorkSpace from "/@/components/Area/Workspace.vue";
import { defaultPageSize, defaultSort } from "/@/config";
import { useTable } from "./useTable";
import { debounce, delay, isToday } from "/@/utils/util";
import { lineList, lineDel, lineDetail } from "/@/api/line";
import { useRouter } from "vue-router";
import { ApartmentOutlined, DownOutlined, MinusCircleOutlined } from "@ant-design/icons-vue";
import Add from "../Add/index.vue";
import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
import { BodyCellData } from "/#/antd";
import { LineDetail, LineInfo } from "/@/api/model/line";
import { useDataStore, useUserInfoStore } from "/@/store";
import { WorkshopInfo } from "/@/api/model/workshop";
import { workshopList, workshopListAll } from "/@/api/workshop";
import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
import WorkshopList from "/@/views/Workshop/List/index.vue";
import StationManage from "/@/views/components/StationManage/index.vue";
import FormTitle from "/@/components/Title/FormTitle.vue";
import { PageEnum } from "/@/enums/pageEnum";
import ProductRelate from "/@/views/components/ProductRelate/index.vue";
import RegistrationPanel from "./registration-panel.vue";
import { copyLine } from "/@/utils/data-copy";
import { getListItemLabel, LineTypeList } from "/@/config/data";
import EventStaff from "../EventStaff/index.vue";

const router = useRouter();
const { isCjzr, staffInfo } = useUserInfoStore();

/** 分页数据 */
const pageState = reactive<any>({
  pageNum: 1,
  pageSize: defaultPageSize,
  sort: "id asc",
  workshopId: undefined,
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

/** 弹窗 - 车间列表 管理 */
const modalWorkshopListState = reactive<{
  visible: boolean;
}>({
  visible: false,
});

/** 弹窗 - 创建产线 */
const modalAddState = reactive<{
  id?: number;
  visible: boolean;
  title: string;
}>({
  id: undefined,
  visible: false,
  title: "创建产线",
});

/** 弹窗 - 管理工位 */
const modalStationManageState = reactive<{
  lineId?: number;
  visible: boolean;
  title: string;
}>({
  lineId: undefined,
  visible: false,
  title: "工位管理",
});

/** 弹窗 - 事件管理员 */
const modalEventStaffState = reactive<{
  lineId?: number;
  visible: boolean;
  title: string;
}>({
  lineId: undefined,
  visible: false,
  title: "编辑事件管理员",
});

const workshopSelectList = ref<WorkshopInfo[]>([]);

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

  // 获取列表
  await toGetList();
});

/** 点击 - 车间管理 */
function handleWorkshopClick() {
  modalWorkshopListState.visible = true;
}

/** 复制产线 */
async function handleLineCopy(record: LineDetail) {
  const { id, lineName } = record;
  Modal.confirm({
    title: `确认复制产线: ${lineName}`,
    content: "",
    okText: "确认",
    cancelText: "取消",
    async onOk() {
      await copyLine(id);
      await toGetList();
      message.success(CommonOperatorTip.COPY_OK);
    },
    onCancel() { },
  });
}

/** 获取必要数据 */
async function toGetNeedInfo() {
  // 获取车间列表；车间主任只保留自己负责的车间。
  const records = await workshopListAll();
  workshopSelectList.value = isCjzr
    ? records.filter((item: any) => String(item.staffId) === String(staffInfo?.id))
    : records;

  // 只有车间主任默认选中自己的第一个车间。
  // 其他角色保持未选择状态；刷新车间列表时尽量保留当前有效选择。
  if (isCjzr) {
    const currentWorkshopStillValid = workshopSelectList.value.some(
      (item) => String(item.id) === String(pageState.workshopId)
    );
    if (!currentWorkshopStillValid) {
      pageState.workshopId = workshopSelectList.value[0]?.id;
    }
  }
}

/** 获取产线列表 */
async function toGetList() {
  otherState.loading = true;

  // 车间主任必须限定在自己的车间内查询；未匹配到所属车间时不请求全量产线。
  if (isCjzr && !pageState.workshopId) {
    dataSource.value = [];
    otherState.total = 0;
    otherState.loading = false;
    return;
  }

  const data = {
    ...pageState,
    lineNo: pageState.keyword,
    lineName: pageState.keyword,
  };

  const { records, total } = await lineList(data);
  dataSource.value = records;
  otherState.total = total;
  otherState.loading = false;
  console.log(records);
}

/** 点击 - 产线查看 */
function handleLineDetailClick(record: LineInfo) {
  const { id } = record;

  const query = {
    id,
  };

  router.push({
    path: PageEnum.LINE_DETAIL,
    query,
  });
}

/** 点击 - 管理工位 */
function handleStationManage(record: LineInfo) {
  const { id: lineId } = record;
  modalStationManageState.lineId = lineId;
  modalStationManageState.visible = true;
  modalStationManageState.title = `工位管理-${record.lineName}`;
}

/** 点击 - 创建产线 */
function handleLineAdd() {
  modalAddState.id = undefined;
  modalAddState.visible = true;
  modalAddState.title = "创建产线";
}

/** 点击 - 编辑产线 */
function handleLineEdit(record: LineInfo) {
  const { id } = record;
  modalAddState.id = id;
  modalAddState.visible = true;
  modalAddState.title = "编辑产线";
}

/** 点击 - 管理事件管理员 */
function handleEventStaffManage(record: LineInfo) {
  const { id: lineId } = record;
  modalEventStaffState.lineId = lineId;
  modalEventStaffState.visible = true;
  modalEventStaffState.title = `${record.lineName}-事件管理员`;
}



/** 点击 - 删除产线 */
function handleLineDel(record: LineDetail) {
  const { id, lineNo } = record;
  Modal.confirm({
    title: `确认删除产线: ${lineNo}`,
    content: "",
    okText: "删除",
    cancelText: "取消",
    async onOk() {
      await lineDel(id);
      await toGetList();
      message.success(CommonOperatorTip.OK);
    },
    onCancel() { },
  });
}

async function handleStationManageChange() {
  await toGetList();
}

/** 变化-Add 组件-add */
async function handleLineAddAddChange(lineId: number) {
  await toGetList();
  modalAddState.visible = false;

  // 获取产线详情
  const lInfo = await lineDetail(lineId);

  handleStationManage(lInfo);

  message.success(`${CommonOperatorTip.OK}，开始创建物理工位`);
}

/** 变化-Add 组件-edit */
async function handleLineAddEditChange(lineId: number) {
  await toGetList();
  modalAddState.visible = false;
  message.success(CommonOperatorTip.OK);
}

/** Workshop 组件变化 */
async function handleWorkshopListChange() {
  await toGetNeedInfo();
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
