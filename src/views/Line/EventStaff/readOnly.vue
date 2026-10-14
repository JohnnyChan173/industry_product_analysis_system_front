<template>

    <a-table
      row-key="id"
      :loading="loading"
      :columns="columns"
      :data-source="dataSource"
      :pagination="false"
      :scroll="{ y: '600px' }"
      class="event-station-view__table"
    >
      <template #bodyCell="{ text, index, column }: BodyCellData<EventStationRow>">
        <template v-if="column.key === 'order'">
          <span class="order-index">{{ (pageState.pageNum - 1) * pageState.pageSize + index + 1 }}</span>
        </template>

        <template v-else-if="isEventStaffColumn(column)">
          <span v-if="text" class="staff-tag" :title="String(text)">{{ text }}</span>
          <span v-else class="staff-empty">未绑定</span>
        </template>
      </template>
    </a-table>
</template>

<script setup lang="ts">
  import { ref, onMounted, reactive, watch } from "vue";
  import { message } from "ant-design-vue";
  import { stationListAll } from "/@/api/station";
  import { staffListAll } from "/@/api/staff";
  import { eventStationStaffFindByLineId } from "/@/api/staff";
  import { useTable } from "./useTable";
  import { StationInfo } from "/@/api/model/station";
  import { StaffInfo } from "/@/api/model/staff";
  import { BodyCellData } from "/#/antd";
  import { AddonEventTypeList } from "/@/config/data";
  import { StaffType } from "/@/enums/model";

  interface EventStationStaffInfo {
    id?: number;
    eventLineId?: number;
    eventStaffId?: number | string;
    eventStaffType?: number;
    eventStationId?: number;
    staffName?: string;
    staffNo?: string;
    staffInfo?: StaffInfo;
  }

  interface EventStationRow extends StationInfo {
    eventStaffMap: Record<string, EventStationStaffInfo>;
    [key: string]: any;
  }

  const { columns, dataSource } = useTable();

  const props = defineProps({
    lineId: {
      type: Number,
      default: 0,
    },
  });

  const pageState = reactive({
    total: 0,
    pageNum: 1,
    pageSize: 10,
  });

  const loading = ref(false);
  const eventStaffList = ref<StaffInfo[]>([]);

  function unwrapRecords(result: any): any[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.records)) return result.records;
    if (Array.isArray(result?.data?.records)) return result.data.records;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  }

  function isEventStaffColumn(column: any) {
    return String(column?.key ?? "").startsWith("eventStaff_");
  }

  function getBindStaffName(bindInfo?: EventStationStaffInfo) {
    if (!bindInfo) return "";

    const staffInfo = eventStaffList.value.find(
      (item) => String(item.id) === String(bindInfo.eventStaffId)
    );
    return bindInfo.staffName || bindInfo.staffInfo?.staffName || staffInfo?.staffName || "";
  }

  function buildStationList(
    stationList: StationInfo[],
    bindList: EventStationStaffInfo[]
  ): EventStationRow[] {
    const stationEventMap = new Map<string, EventStationStaffInfo>();

    bindList.forEach((item) => {
      if (item?.eventStationId == null || item?.eventStaffType == null) return;
      stationEventMap.set(`${item.eventStationId}-${item.eventStaffType}`, item);
    });

    return stationList.map((stationInfo) => {
      const eventStaffMap: Record<string, EventStationStaffInfo> = {};
      const stationRow: EventStationRow = {
        ...stationInfo,
        eventStaffMap,
      };

      AddonEventTypeList.forEach(({ value }) => {
        const bindInfo = stationEventMap.get(`${stationInfo.id}-${value}`);
        if (bindInfo) eventStaffMap[String(value)] = bindInfo;
        stationRow[`eventStaffName_${value}`] = getBindStaffName(bindInfo);
      });

      return stationRow;
    });
  }

  async function toGetList() {
    const { lineId } = props;
    if (!lineId) {
      dataSource.value = [];
      eventStaffList.value = [];
      pageState.total = 0;
      return;
    }

    loading.value = true;
    try {
      const [stationResult, bindResult, staffResult] = await Promise.allSettled([
        stationListAll(lineId),
        eventStationStaffFindByLineId(lineId),
        staffListAll(StaffType.EVENT),
      ]);

      if (stationResult.status === "rejected") throw stationResult.reason;

      const stationRecords = unwrapRecords(stationResult.value) as StationInfo[];
      const bindRecords = bindResult.status === "fulfilled" ? unwrapRecords(bindResult.value) : [];
      eventStaffList.value =
        staffResult.status === "fulfilled" ? unwrapRecords(staffResult.value) : [];
      dataSource.value = buildStationList(stationRecords, bindRecords);
      pageState.total = stationRecords.length;

      if (bindResult.status === "rejected") {
        console.error("事件管理员绑定关系加载失败", bindResult.reason);
        message.warning("事件管理员绑定关系加载失败，物理工位仍可正常显示");
      }
      if (staffResult.status === "rejected") {
        console.error("事件管理员列表加载失败", staffResult.reason);
        message.warning("事件管理员列表加载失败，请稍后重试");
      }
    } finally {
      loading.value = false;
    }
  }

  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }

  onMounted(() => {
    toGetList();
  });

  watch(
    () => props.lineId,
    () => {
      pageState.pageNum = 1;
      toGetList();
    }
  );
</script>

<style lang="less" scoped>
  .event-station-view {
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__bar {
      display: inline-block;
      width: 4px;
      height: 16px;
      background: linear-gradient(180deg, #1677ff 0%, #69b1ff 100%);
      border-radius: 2px;
    }

    &__text {
      color: rgba(0, 0, 0, 0.85);
      font-weight: 600;
      font-size: 16px;
    }

    &__count {
      padding: 1px 10px;
      color: #1677ff;
      font-size: 12px;
      line-height: 20px;
      background: #e6f4ff;
      border-radius: 10px;
    }

    &__table {
      :deep(.ant-table) {
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      }

      :deep(.ant-table-thead > tr > th) {
        color: rgba(0, 0, 0, 0.65);
        font-weight: 600;
        background: #fafafa;
        border-bottom: 1px solid #f0f0f0;
      }

      :deep(.ant-table-tbody > tr:hover > td) {
        background: #f5faff;
      }
    }
  }

  .order-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    color: rgba(0, 0, 0, 0.65);
    font-size: 12px;
    background: #f5f5f5;
    border-radius: 50%;
  }

  .staff-tag {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 1px 10px;
    overflow: hidden;
    color: #0958d9;
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;
    text-overflow: ellipsis;
    background: #e6f4ff;
    border: 1px solid #91caff;
    border-radius: 10px;
  }

  .staff-empty {
    color: rgba(0, 0, 0, 0.25);
  }
</style>