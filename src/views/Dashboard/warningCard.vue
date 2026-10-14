<template>
  <div class="warning-card">
    <div v-if="otherState.loading" class="warning-card__empty">加载中...</div>

    <div v-else-if="!visibleData.length" class="warning-card__empty">暂无异常数据</div>

    <div v-else class="warning-card__table-wrap">
      <table class="warning-card__table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.prop"
              :style="column.width ? { width: `${column.width}px` } : undefined"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, rowIndex) in visibleData" :key="getRowKey(row, rowIndex)">
            <td
              v-for="column in columns"
              :key="column.prop"
              :title="formatCell(row[column.prop])"
            >
              {{ formatCell(row[column.prop]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pageCount > 1" class="warning-card__page">
      {{ currentPage + 1 }} / {{ pageCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
  import { beatExceptionList } from "/@/api/beatException";

  interface WarningColumn {
    prop: string;
    label: string;
    width?: number;
  }

  const PAGE_SIZE = 2;
  const TOGGLE_DURATION = 3000;

  const columns: WarningColumn[] = [
    { prop: "startDate", label: "上报时间", width: 220 },
    { prop: "registrationNo", label: "登记编号" },
    { prop: "sumAvg", label: "节拍累计时间平均值" },
    { prop: "singleConSum", label: "节拍单次耗时" },
    { prop: "standardBeat", label: "标准节拍" },
    { prop: "exDesc", label: "节拍异常信息" },
  ];

  const pageState = reactive<any>({
    sort: "id desc",
    startDate: "",
    endDate: "",
    dateRange: [],
  });

  const otherState = reactive({
    loading: true,
    total: 0,
  });

  const records = ref<any[]>([]);
  const currentPage = ref(0);
  let pageTimer: ReturnType<typeof setInterval> | null = null;

  const pageCount = computed(() => {
    return Math.max(1, Math.ceil(records.value.length / PAGE_SIZE));
  });

  const visibleData = computed(() => {
    const start = currentPage.value * PAGE_SIZE;
    return records.value.slice(start, start + PAGE_SIZE);
  });

  function stopAutoPage() {
    if (pageTimer) {
      clearInterval(pageTimer);
      pageTimer = null;
    }
  }

  function startAutoPage() {
    stopAutoPage();

    if (pageCount.value <= 1) {
      currentPage.value = 0;
      return;
    }

    pageTimer = setInterval(() => {
      currentPage.value = (currentPage.value + 1) % pageCount.value;
    }, TOGGLE_DURATION);
  }

  function formatCell(value: unknown) {
    if (value === undefined || value === null || value === "") {
      return "-";
    }

    return String(value);
  }

  function getRowKey(row: any, index: number) {
    return row?.id ?? row?.uuid ?? `${currentPage.value}-${index}`;
  }

  async function toGetList() {
    otherState.loading = true;

    try {
      let startDate = "";
      let endDate = "";

      if (Array.isArray(pageState.dateRange) && pageState.dateRange.length >= 2) {
        startDate = pageState.dateRange[0]?.format?.("YYYY-MM-DD 00:00:00") || "";
        endDate = pageState.dateRange[1]?.format?.("YYYY-MM-DD 23:59:59") || "";
      }

      const params = {
        ...pageState,
        startDate,
        endDate,
      };

      delete params.dateRange;

      const { records: list = [], total = 0 } = await beatExceptionList(params);

      records.value = Array.isArray(list) ? list : [];
      otherState.total = total;
      currentPage.value = 0;
      startAutoPage();
    } catch (error) {
      records.value = [];
      otherState.total = 0;
      console.error("[Dashboard WarningCard] 获取异常事件失败：", error);
    } finally {
      otherState.loading = false;
    }
  }

  onMounted(() => {
    void toGetList();
  });

  onUnmounted(() => {
    stopAutoPage();
  });
</script>

<style lang="less" scoped>
  .warning-card {
    position: relative;
    width: 100%;
    height: 175px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 4px;

    &__empty {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }

    &__table-wrap {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    &__table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      color: #333;
      font-size: 14px;

      th,
      td {
        height: 48px;
        padding: 0 12px;
        border-bottom: 1px solid #eee;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      th {
        height: 44px;
        font-weight: 500;
        background: #fafafa;
      }

      tbody tr:last-child td {
        border-bottom: 0;
      }
    }

    &__page {
      position: absolute;
      right: 8px;
      bottom: 4px;
      padding: 1px 6px;
      font-size: 12px;
      color: #999;
      background: rgba(255, 255, 255, 0.88);
      border-radius: 8px;
    }
  }
</style>
