<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <LineRelate class="mr-6px" v-model:lineId="pageState.lineId" />

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
    <template #nav-right> </template>

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
            {{ record.virtualLineInfo.virtualLineName }}
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
  import { Input, Modal, Table, Dropdown, Menu, Divider, message, Select, Tag } from "ant-design-vue";
  import { onMounted, reactive, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import { addonEventList, addonEventDel } from "/@/api/addonEvent";
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

  const { isXz, manageLineId } = useUserInfoStore();

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
  onMounted(() => {
    toGetNeedInfo();

    // 获取列表
    toGetList();
  });

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取事件列表 */
  async function toGetList() {
    otherState.loading = true;

    // 如果是线长
    if (isXz) {
      pageState.lineId = manageLineId;
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
</script>

<style lang="less" scoped></style>
