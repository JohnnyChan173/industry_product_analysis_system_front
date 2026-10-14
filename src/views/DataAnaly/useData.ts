import { computed, ref } from "vue";
import { LineInfo } from "/@/api/model/line";
import { StaffInfo } from "/@/api/model/staff";
import { StationInfo } from "/@/api/model/station";
import { RegistrationDetail } from "/@/api/model/registration";
import { VirtualLineDetail } from "/@/api/model/virtualLine";
import { VirtualStationDetail } from "/@/api/model/virtualStation";
import { formatDateByDayjs } from "/@/utils/util";
import { isPDXLine } from "/@/config/parse";

export enum AnalyMode {
  Signal = 1,
  Status = 2,
}

const lineId = ref<number>();
const lineInfo = computed(() => lineList.value?.find((i) => i.id === lineId.value));
const lineList = ref<LineInfo[]>([]);
const staffList = ref<StaffInfo[]>([]);

const registrationId = ref<number>();
const registrationInfo = ref<RegistrationDetail>();
const registrationStartDate = computed(() => formatDateByDayjs(registrationInfo.value?.startDate));
const registrationStaffSignList = computed(() => registrationInfo.value?.staffSignList);

const registrationSelectList = ref<RegistrationDetail[]>([]);

const virtualLineInfo = ref<VirtualLineDetail>();
const virtualStationList = ref<VirtualStationDetail[]>([]);

const selectVirtualStationId = ref<number>();
const selectVirtualStationInfo = ref<VirtualStationDetail>();

const dataPolling = ref(true);

// 面板尺寸
const panelWholeWidth = ref(0);

/** 获取共享数据 */
function useData() {
  // 清除数据
  function clearData() {
    lineId.value = undefined;
    lineList.value = [];
    staffList.value = [];

    registrationId.value = undefined;
    registrationInfo.value = undefined;
    registrationSelectList.value = [];

    virtualLineInfo.value = undefined;
    virtualStationList.value = [];

    selectVirtualStationId.value = undefined;
    selectVirtualStationInfo.value = undefined;
  }

  return {
    lineId,
    lineInfo,
    lineList,
    staffList,

    registrationId,
    registrationInfo,
    registrationStartDate,
    registrationStaffSignList,
    registrationSelectList,

    virtualLineInfo,
    virtualStationList,

    selectVirtualStationId,
    selectVirtualStationInfo,

    dataPolling,

    clearData,
  };
}

export { useData, panelWholeWidth };
