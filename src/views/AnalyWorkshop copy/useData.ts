import { computed, ref } from "vue";
import { WorkshopInfo } from "/@/api/model/workshop";
import { StatisticsWorkshopData } from "/@/api/model/statistics";
import dayjs, { Dayjs } from "dayjs";
import { formatDateByDayjs } from "/@/utils/util";

const mockData = {
  "capacity": [
    {
      "lineId": 1,
      "lineName": "一线",
      "registrationPlanProductNumberTotal": 800,
      "registrationBeatProductNumberTotal": 820,
    },
    {
      "lineId": 2,
      "lineName": "二线",
      "registrationPlanProductNumberTotal": 400,
      "registrationBeatProductNumberTotal": 500,
    },
  ],
  "lineBalance": [
    {
      "lineId": 1,
      "lineName": "一线",
      "dates": ["2024-04-02 08:00", "2024-04-02 09:00", "2024-04-02 10:00"],
      "balanceRatios": [0.75, 0.72, 0.82],
    },
    {
      "lineId": 2,
      "lineName": "二线",
      "dates": ["2024-04-02 09:00", "2024-04-02 10:00", "2024-04-02 11:00", "2024-04-02 14:00", "2024-04-02 15:00"],
      "balanceRatios": [0.65, 0.69, 0.72, 0.8, 0.78],
    },
  ],
  "addonEvents": [
    {
      "lineId": 1,
      "lineName": "一线",
      "types": ["物料", "设备", "品质", "其他"],
      "happenCounts": [5, 8, 20, 8],
    },
    {
      "lineId": 2,
      "lineName": "二线",
      "types": ["物料", "设备", "品质", "其他"],
      "happenCounts": [9, 10, 15, 6],
    },
  ],
};

enum DateRangeEnums {
  DAY = "今日",
  WEEK = "7天",
}

// 面板尺寸
const panelWholeWidth = ref(0);

const selectDate = ref<Dayjs>(dayjs());
const selectDateText = computed(() => {
  const nowYmd = formatDateByDayjs();
  const ymd = formatDateByDayjs(selectDate.value);
  if (nowYmd === ymd) {
    return "今日";
  } else {
    return ymd;
  }
});

const isSelectDateNow = computed(() => selectDateText.value === "今日");

const dateRange = ref<DateRangeEnums>();
const workshopId = ref(0);
const workshopList = ref<WorkshopInfo[]>([]);
const workshopInfo = computed(() => workshopList.value?.find((i) => i.id === workshopId.value));
const staticsData = ref<StatisticsWorkshopData>();

/** 获取共享数据 */
function useData() {
  function clearData() {
    selectDate.value = dayjs();
    workshopId.value = 0;
    workshopList.value = [];
    staticsData.value = undefined;
  }

  return {
    clearData,
    mockData,

    selectDate,
    selectDateText,
    isSelectDateNow,
    dateRange,
    workshopId,
    workshopList,
    workshopInfo,
    staticsData,
  };
}

export { DateRangeEnums, panelWholeWidth, useData };
