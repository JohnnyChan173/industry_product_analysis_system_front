<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <!-- 普通用户保持原来的产线筛选；车间主任使用“车间 -> 产线”两级筛选 -->
        <template v-if="isCjzr">
          <Select
            v-model:value="workshopId"
            placeholder="选择车间"
            style="width: 160px; margin-right: 6px"
            @change="handleWorkshopIdChange"
          >
            <Select.Option v-for="item in workshopSelectList" :key="item.id" :value="item.id">
              {{ item.workshopName }}
            </Select.Option>
          </Select>

          <Select
            v-model:value="pageState.lineId"
            placeholder="选择产线"
            style="width: 180px; margin-right: 6px"
            :disabled="!workshopId"
            @change="handleLineIdChange"
          >
            <Select.Option v-for="item in filteredLineList" :key="item.id" :value="item.id">
              {{ item.lineName }}
            </Select.Option>
          </Select>
        </template>

        <LineRelate v-else class="mr-6px" v-model:lineId="pageState.lineId" />

        <Select
          allowClear
          placeholder="事件类型"
          v-model:value="pageState.eventType"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in AddonEventTypeList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Select
          allowClear
          placeholder="事件状态"
          v-model:value="pageState.eventStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in AddonEventStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入事件编号或名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleAdd">新增</Button>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<AddonEventDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 虚拟产线 -->
          <template v-if="column.dataIndex === 'virtualLineInfo'">
            {{ record.virtualLineInfo?.virtualLineName || "/" }}
          </template>

          <!-- 虚拟工位 -->
          <template v-if="column.dataIndex === 'virtualStationInfo'">
            <TagVirtualStation :info="record.virtualStationInfo" />
          </template>

          <!-- 生产产品 -->
          <template v-if="column.dataIndex === 'productInfo'">
            <TagProduct :info="record.productInfo" />
          </template>

          <!-- 呼叫时间 -->
          <template v-if="column.dataIndex === 'happenDate'">
            <span>
              <span>{{ record.happenDate.split(" ")[0] }}</span>
              <br />
              <span>{{ record.happenDate.split(" ")[1] }}</span>
            </span>
          </template>

          <!-- 接收时间 -->
          <template v-if="column.dataIndex === 'receiveDate'">
            <span v-if="record.receiveDate">
              <span>{{ record.receiveDate.split(" ")[0] }}</span>
              <br />
              <span>{{ record.receiveDate.split(" ")[1] }}</span>
            </span>
            <span v-else>/</span>
          </template>

          <!-- 处理时间 -->
          <template v-if="column.dataIndex === 'handleDate'">
            <span v-if="record.handleDate">
              <span>{{ record.handleDate.split(" ")[0] }}</span>
              <br />
              <span>{{ record.handleDate.split(" ")[1] }}</span>
            </span>
            <span v-else>/</span>
          </template>

          <!-- 处理方式 -->
          <template v-if="column.dataIndex === 'handleMethod'">
            <span>{{ record.handleMethod }}</span>
          </template>

          <!-- 管理人员-->
          <template v-if="column.dataIndex === 'eventStaffInfo'">
            <span>{{ record.eventStaffInfo?.staffName }}</span>
          </template>

          <!-- 事件类型-->
          <template v-if="column.dataIndex === 'eventType'">
            <TagAddonEventType :info="record" />
          </template>

          <!-- 事件状态 -->
          <template v-if="column.dataIndex === 'eventStatus'">
            <TagAddonEventStatus :info="record" />
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a class="!text-secondary" @click="handleEventDetailClick(record.id, record)">查看</a>

            <Divider type="vertical" />
            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>

              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleEventDel(record.id, record)">
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

  <!-- 弹窗 - 详情 -->
  <Modal v-model:visible="modalDetailState.visible" :title="modalDetailState.title" :footer="null" destroyOnClose>
    <Detail class="!-mt-20px" :id="modalDetailState.id" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Modal, Table, Dropdown, Menu, Divider, message, Select, Tag, Button } from "ant-design-vue";
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import { addonEventList, addonEventDel } from "/@/api/addonEvent";
  import { lineListAll } from "/@/api/line";
  import { workshopListAll } from "/@/api/workshop";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { AddonEventDetail } from "/@/api/model/addonEvent";
  import { AddonEventTypeList, AddonEventStatusList, getListItemLabel } from "/@/config/data";
  import Detail from "../Detail/index.vue";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import TagAddonEventStatus from "../../baseComponents/TagAddonEventStatus.vue";
  import TagAddonEventType from "../../baseComponents/TagAddonEventType.vue";
  import TagVirtualStation from "../../baseComponents/TagVirtualStation.vue";
  import LineRelate from "/@/views/components/LineRelate/index.vue";
  import { useUserInfoStore } from "/@/store";
  import { beatExceptionAdd } from "/@/api/beatException";

  const { isXz, manageLineId, isCjzr, staffInfo } = useUserInfoStore();

  /** 车间主任筛选：只显示自己负责的车间，以及当前车间下的产线 */
  const workshopId = ref<number | undefined>();
  const workshopSelectList = ref<any[]>([]);
  const lineList = ref<any[]>([]);

  function getLineWorkshopId(item: any) {
    return item?.workshopId ?? item?.workshopInfo?.id;
  }

  const filteredLineList = computed(() => {
    if (!workshopId.value) return [];

    return lineList.value.filter(
      (item: any) => String(getLineWorkshopId(item)) === String(workshopId.value)
    );
  });

  /** 弹窗 - 安灯事件详情 */
  const modalDetailState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "安灯事件详情",
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    eventType: undefined,
    eventStatus: undefined,
    keyword: "",
    lineId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

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

    // 权限筛选初始化完成后再获取列表，避免车间主任首次请求到全部产线数据
    await toGetList();
  });

  /** 车间变化：车间主任默认切换到该车间第一条产线 */
  function handleWorkshopIdChange() {
    pageState.pageNum = 1;
    pageState.lineId = filteredLineList.value[0]?.id;
  }

  /** 产线变化 */
  function handleLineIdChange() {
    pageState.pageNum = 1;
  }

  /** 获取车间列表；车间主任只保留 staffId 属于自己的车间 */
  async function toGetWorkshopList() {
    const records = await workshopListAll();
    workshopSelectList.value = isCjzr
      ? records.filter((item: any) => String(item.staffId) === String(staffInfo?.id))
      : records;
  }

  /** 获取产线，并初始化车间主任的“车间 -> 产线”筛选 */
  async function toGetLineList() {
    lineList.value = await lineListAll();

    if (!isCjzr) return;

    // 车间主任只从自己的车间开始选，不从全量产线反推车间。
    workshopId.value = workshopSelectList.value[0]?.id;
    pageState.lineId = filteredLineList.value[0]?.id;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    if (!isCjzr) return;

    await toGetWorkshopList();
    await toGetLineList();
  }

  /** 获取事件列表 */
  async function toGetList() {
    otherState.loading = true;

    // 如果是线长
    if (isXz && !isCjzr) {
      pageState.lineId = manageLineId;
    }

    // 车间主任必须限定到自己车间内的产线；未匹配到车间/产线时不查询全量数据。
    if (isCjzr && (!workshopId.value || !pageState.lineId)) {
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

    const { records, total } = await addonEventList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 事件查看 */
  function handleEventDetailClick(id: number, record: AddonEventDetail) {
    modalDetailState.id = id;
    modalDetailState.visible = true;
    modalDetailState.title = `安灯事件-${record.eventNo}`;
  }

  /** 点击 - 删除事件 */
  function handleEventDel(id: number, record: AddonEventDetail) {
    const { eventNo } = record;
    Modal.confirm({
      title: `确认删除事件: ${eventNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await addonEventDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
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

  /** 新增 */
  function handleAdd() {
    beatExceptionAdd({
      "exceedAvgCount": 24,
      "exceedAvgBeatMax": 10,
      "standardBeat": 54,
      "virtualStationId": 606,
      "sumAvg": 47.486486486486484,
      "singleConSum": 46,
      "registrationId": 174,
      "exDesc": "【咖啡机2楼流水线-挡水板】单次作业时间超出累计平均值 24 次，已达预设上限 10 次",
    }).then((res) => {
      console.log(res);
      // message.success(CommonOperatorTip.OK);
      // toGetList();
    });
  }
</script>

<style lang="less" scoped></style>
