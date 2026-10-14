<template>
  <div>
    <div class="event-station-toolbar">
      <span class="selected-tip">已选择 {{ selectedRowKeys.length }} 个物理工位</span>
      <span v-if="selectedRowKeys.length > 1" class="batch-hint">
        编辑任一已选工位的单元格，会同步更新全部已选工位
      </span>

      <template v-if="changedCount">
        <span class="changed-tip">
          待提交 <span class="selected-count">{{ changedCount }}</span> 处修改
        </span>
        <Button :disabled="submitting" @click="handleResetChanges">重置</Button>
      </template>

      <Button
        type="primary"
        :disabled="!changedCount"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交修改
      </Button>
    </div>

    <a-table
      row-key="id"
      :loading="loading"
      :columns="columns"
      :data-source="dataSource"
      :row-selection="rowSelectionConfig"
      :pagination="{
        total: pageState.total,
        current: pageState.pageNum,
        pageSize: pageState.pageSize,
        showSizeChanger: true,
        onChange: onPageChange,
      }"
      :scroll="{ y: '70vh' }"
    >
      <template #bodyCell="{ record, index, column }: BodyCellData<EventStationRow>">
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <template v-else-if="isEventStaffColumn(column)">
          <Select
            :value="getCellValue(record, getColumnEventType(column))"
            size="small"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="请选择事件管理员"
            class="cell-select"
            :class="{ 'cell-select--dirty': isCellDirty(record, getColumnEventType(column)) }"
            @change="(value: any) => handleCellChange(record, getColumnEventType(column), value)"
          >
            <Select.Option
              v-for="staffInfo in eventStaffList"
              :key="staffInfo.id"
              :value="staffInfo.id"
              :label="getStaffOptionLabel(staffInfo)"
            >
              {{ staffInfo.staffName }}
            </Select.Option>
          </Select>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, ref, onMounted, reactive, watch } from "vue";
  import { Button, Checkbox, message, Select } from "ant-design-vue";
  import { stationListAll } from "/@/api/station";
  import { staffListAll } from "/@/api/staff";
  import { eventStationBatchUpdate, eventStationStaffFindByLineId } from "/@/api/staff";
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
  const submitting = ref(false);
  const selectedRowKeys = ref<Array<number | string>>([]);
  const eventStaffList = ref<StaffInfo[]>([]);

  /**
   * 待提交的单元格修改，key 为 `${stationId}_${eventType}`。
   * 存在 key 即代表该单元格被改动过（包括清空绑定）。
   */
  const draftMap = ref<Record<string, number | string | null | undefined>>({});

  const changedCount = computed(() => Object.keys(draftMap.value).length);

  /** 当前分页实际显示的工位。 */
  const currentPageData = computed(() => {
    const start = (pageState.pageNum - 1) * pageState.pageSize;
    return (dataSource.value as EventStationRow[]).slice(start, start + pageState.pageSize);
  });

  const currentPageSelectedCount = computed(() => {
    const selectedSet = new Set(selectedRowKeys.value.map((key) => String(key)));
    return currentPageData.value.filter(({ id }) => id != null && selectedSet.has(String(id))).length;
  });

  function onSelectChange(rowKeys: Array<number | string>) {
    selectedRowKeys.value = rowKeys;
  }

  /** 全选或取消当前页，不影响其他分页已选择的工位。 */
  function handleCurrentPageSelectAll(checked: boolean) {
    const selectedMap = new Map(selectedRowKeys.value.map((key) => [String(key), key]));

    currentPageData.value.forEach(({ id }) => {
      if (id == null) return;
      if (checked) {
        selectedMap.set(String(id), id);
      } else {
        selectedMap.delete(String(id));
      }
    });

    selectedRowKeys.value = Array.from(selectedMap.values());
  }

  /** 反选当前页，不影响其他分页已选择的工位。 */
  function handleInvertSelect() {
    if (!currentPageData.value.length) return;

    const selectedMap = new Map(selectedRowKeys.value.map((key) => [String(key), key]));
    currentPageData.value.forEach(({ id }) => {
      if (id == null) return;
      const key = String(id);
      if (selectedMap.has(key)) {
        selectedMap.delete(key);
      } else {
        selectedMap.set(key, id);
      }
    });

    selectedRowKeys.value = Array.from(selectedMap.values());
  }

  const rowSelectionConfig = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true,
    columnWidth: 76,
    columnTitle: h("div", { class: "selection-column-title" }, [
      h(Checkbox, {
        checked:
          !!currentPageData.value.length && currentPageSelectedCount.value === currentPageData.value.length,
        indeterminate:
          currentPageSelectedCount.value > 0 && currentPageSelectedCount.value < currentPageData.value.length,
        disabled: !currentPageData.value.length,
        onClick: (event: MouseEvent) => event.stopPropagation(),
        onChange: (event: any) => handleCurrentPageSelectAll(!!event?.target?.checked),
      }),
      h(
        "span",
        {
          class: "invert-select-link",
          title: "反选当前页",
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            handleInvertSelect();
          },
        },
        "反选"
      ),
    ]),
  }));

  function unwrapRecords(result: any): any[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.records)) return result.records;
    if (Array.isArray(result?.data?.records)) return result.data.records;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  }

  function buildStationList(stationList: StationInfo[], bindList: EventStationStaffInfo[]): EventStationRow[] {
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

  function getEventStaffInfo(record: EventStationRow, eventStaffType: number) {
    return record.eventStaffMap?.[String(eventStaffType)];
  }

  function getBindStaffName(bindInfo?: EventStationStaffInfo) {
    if (!bindInfo) return "";

    const staffInfo = eventStaffList.value.find(
      (item) => String(item.id) === String(bindInfo.eventStaffId)
    );
    return bindInfo.staffName || bindInfo.staffInfo?.staffName || staffInfo?.staffName || "";
  }

  function getStaffOptionLabel(staffInfo: StaffInfo) {
    const staffName = staffInfo?.staffName || `员工${staffInfo?.id}`;
    return staffInfo?.staffNo ? `${staffName}（${staffInfo.staffNo}）` : staffName;
  }

  /* ---------------- 单元格内联编辑 ---------------- */

  function getCellKey(stationId: number | string | undefined, eventType: number | string) {
    return `${stationId}_${eventType}`;
  }

  function isEventStaffColumn(column: any) {
    return /^eventStaff(Name)?_\d+$/.test(String(column?.key ?? ""));
  }

  function getColumnEventType(column: any): number {
    const raw = String(column?.key ?? column?.dataIndex ?? "");
    const match = raw.match(/(\d+)$/);
    return match ? Number(match[1]) : NaN;
  }

  function getEventTypeLabel(eventType: number | string) {
    const target = (AddonEventTypeList as Array<{ label: string; value: number | string }>).find(
      (item) => String(item.value) === String(eventType)
    );
    return target?.label ?? "";
  }

  function getOriginStaffId(record: EventStationRow, eventType: number) {
    return getEventStaffInfo(record, eventType)?.eventStaffId;
  }

  function isCellDirty(record: EventStationRow, eventType: number) {
    if (record?.id == null || Number.isNaN(eventType)) return false;
    return Object.prototype.hasOwnProperty.call(draftMap.value, getCellKey(record.id, eventType));
  }

  function getCellValue(record: EventStationRow, eventType: number) {
    if (Number.isNaN(eventType)) return undefined;
    const key = getCellKey(record.id, eventType);
    return isCellDirty(record, eventType) ? draftMap.value[key] : getOriginStaffId(record, eventType);
  }

  /** 勾选了多个工位、且当前编辑的行在其中时，改动同步到全部已选工位。 */
  function getBatchTargets(record: EventStationRow): EventStationRow[] {
    const selectedKeySet = new Set(selectedRowKeys.value.map((key) => String(key)));

    if (
      selectedRowKeys.value.length <= 1 ||
      record.id == null ||
      !selectedKeySet.has(String(record.id))
    ) {
      return [record];
    }

    const targets = (dataSource.value as EventStationRow[]).filter(
      (item) => item.id != null && selectedKeySet.has(String(item.id))
    );

    return targets.length ? targets : [record];
  }

  function applyDraft(station: EventStationRow, eventType: number, value?: number | string | null) {
    if (station.id == null || Number.isNaN(eventType)) return;

    const key = getCellKey(station.id, eventType);
    const originStaffId = getOriginStaffId(station, eventType);
    const nextValue = value ?? undefined;

    // 改回原值时移除草稿，避免产生无意义的提交。
    if (String(nextValue ?? "") === String(originStaffId ?? "")) {
      delete draftMap.value[key];
    } else {
      draftMap.value[key] = nextValue;
    }
  }

  function handleCellChange(
    record: EventStationRow,
    eventType: number,
    value?: number | string | null
  ) {
    const targets = getBatchTargets(record);
    targets.forEach((station) => applyDraft(station, eventType, value));

    if (targets.length > 1) {
      message.success(`已同步更新 ${targets.length} 个物理工位的「${getEventTypeLabel(eventType)}」管理员`);
    }
  }

  function handleResetChanges() {
    if (!changedCount.value) return;
    draftMap.value = {};
    message.info("已重置未提交的修改");
  }

  async function handleSubmit() {
    const entries = Object.entries(draftMap.value);
    if (!entries.length) return;

    const stationMap = new Map(
      (dataSource.value as EventStationRow[]).map((item) => [String(item.id), item])
    );

    const updateList = entries
      .map(([key, value]) => {
        const [stationId, eventTypeStr] = key.split("_");
        const station = stationMap.get(stationId);
        if (!station) return null;

        const eventType = Number(eventTypeStr);
        const oldBindInfo = getEventStaffInfo(station, eventType);

        return {
          id: oldBindInfo?.id,
          eventStaffType: eventType,
          eventStaffId: value ?? null,
          eventStationId: station.id,
          eventLineId: props.lineId,
        };
      })
      .filter(Boolean);

    if (!updateList.length) {
      message.warning("未找到需要提交的修改");
      return;
    }

    submitting.value = true;
    try {
      await eventStationBatchUpdate(updateList);
      message.success("事件管理员绑定成功");
      draftMap.value = {};
      selectedRowKeys.value = [];
      await toGetList();
    } finally {
      submitting.value = false;
    }
  }

  /* ---------------- 数据加载 ---------------- */

  async function toGetList() {
    const { lineId } = props;
    if (!lineId) {
      dataSource.value = [];
      eventStaffList.value = [];
      pageState.total = 0;
      draftMap.value = {};
      return;
    }

    loading.value = true;
    try {
      const [stationResult, bindResult, staffEventResult, staffXianzhangResult] = await Promise.allSettled([
        stationListAll(lineId),
        eventStationStaffFindByLineId(lineId),
        staffListAll(StaffType.EVENT),
        staffListAll(StaffType.XIANZHANG),
      ]);

      if (stationResult.status === "rejected") throw stationResult.reason;

      const stationRecords = unwrapRecords(stationResult.value) as StationInfo[];
      const bindRecords = bindResult.status === "fulfilled" ? unwrapRecords(bindResult.value) : [];
      eventStaffList.value = staffEventResult.status === "fulfilled" ? unwrapRecords(staffEventResult.value) : [];
      eventStaffList.value.push(...staffXianzhangResult.status === "fulfilled" ? unwrapRecords(staffXianzhangResult.value) : []);
      dataSource.value = buildStationList(stationRecords, bindRecords);
      pageState.total = stationRecords.length;
      draftMap.value = {};

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

  onMounted(() => {
    toGetList();
  });

  watch(
    () => props.lineId,
    () => {
      selectedRowKeys.value = [];
      pageState.pageNum = 1;
      toGetList();
    }
  );

  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }
</script>

<style lang="less" scoped>
  .event-station-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 12px;
  }

  .selected-tip,
  .bind-tip,
  .changed-tip,
  .batch-hint {
    color: rgba(0, 0, 0, 0.45);
  }

  .batch-hint {
    font-size: 12px;
  }

  .selected-count {
    color: #1677ff;
  }

  .cell-select {
    width: 100%;
  }

  .cell-select--dirty :deep(.ant-select-selector) {
    background-color: #fffbe6;
    border-color: #faad14;
  }

  .selection-column-title {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;

    .invert-select-link {
      max-width: 0;
      margin-left: 0;
      overflow: hidden;
      color: #1677ff;
      font-weight: 400;
      white-space: nowrap;
      cursor: pointer;
      opacity: 0;
      user-select: none;
      transition: max-width 0.2s ease, margin-left 0.2s ease, opacity 0.2s ease;

      &:hover {
        text-decoration: underline;
      }
    }

    &:hover .invert-select-link {
      max-width: 32px;
      margin-left: 6px;
      opacity: 1;
    }
  }

  :deep(.ant-table-selection-column:hover) .selection-column-title .invert-select-link {
    max-width: 32px;
    margin-left: 6px;
    opacity: 1;
  }
</style>