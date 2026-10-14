/**
 * @description format 业务数据格式化模块
 */

import { SignalBeatData, SignalDataExtendInfo, SignalDataInfo } from "../../api/model/signal";
import { SignalVirtualStationMapData } from "../../api/model";
import { useData } from "./useData";
import { numberToFixed } from "../../utils/math";
import { formatDateByDayjs, getMillisecondByDate, getSecondByDate } from "../../utils/util";
import {
  formatRegistrationEndDate,
  formatRegistrationStartDate,
  getVirtualStationText,
  isPDXLine,
  isSignalInSection,
} from "/@/config/parse";
import { RegistrationInfo } from "/@/api/model/registration";
import { reactive, ref } from "vue";
import { useStationStore } from "/@/store";

const stationStore = useStationStore();

/** 线平衡时间 */
const BALANCE_UNIT_MINUTE = 60;
/** 范围模式（正式环境是true,调试可以为false) */
const rangeMode = true;

const signalRecords = ref<SignalDataInfo[]>([]);

/** 缓存岗位节拍公式，避免每条信号重复解析同一段表达式 */
const beatFormatterCache = new Map<string, (x: number) => number>();
/** 不参与节拍和产能统计的接口数据类型 */
const EXCLUDED_BEAT_TYPES = new Set(["error", "warn"]);

type SignalDataWithBeatType = SignalDataInfo & {
  type?: unknown;
};

/** 判断接口返回的信号是否可以参与节拍相关统计 */
export function isValidBeatRecord(record?: SignalDataInfo) {
  const type = String((record as SignalDataWithBeatType | undefined)?.type ?? "")
    .trim()
    .toLowerCase();

  return !EXCLUDED_BEAT_TYPES.has(type);
}

/** 用于数量等直接基于信号条数计算的场景 */
export function filterValidBeatRecords(records: SignalDataInfo[]) {
  return records.filter(isValidBeatRecord);
}

function formatBeatTime(beatTime: number, beatFormat: string) {
  let formatter = beatFormatterCache.get(beatFormat);
  if (!formatter) {
    formatter = new Function("x", `const value = ${beatFormat}; return value;`) as (x: number) => number;
    beatFormatterCache.set(beatFormat, formatter);
  }
  return numberToFixed(formatter(beatTime));
}

/** 检测 通用信号 是否介于重量信号中 */
function checkSignalInScale(scaleRecords: SignalDataExtendInfo[], signalData: SignalDataInfo) {
  const { virtualLineInfo } = useData();
  const vlInfo = virtualLineInfo.value!!;

  const { standardBeat } = vlInfo;
  const { timestamp: t } = signalData;

  for (let i = 0; i < scaleRecords.length; i++) {
    const item = scaleRecords[i];
    const { timestamp: startTimestamp, scaleProductCountAdd = 0, stationId } = item;

    // 向上取整
    const realProductCount = Math.ceil(scaleProductCountAdd);
    // 工位一致
    if (stationId === signalData.stationId) {
      const scaleEndTimestamp = startTimestamp + realProductCount * standardBeat * 1000;
      // 通用信号t 处于重量始末范围
      if (t >= startTimestamp && t <= scaleEndTimestamp) {
        // alert(`${realProductCount} ${startTimestamp}≤ ${t} ≤${scaleEndTimestamp}`);
        return true;
      }
    }
  }
}

/** 重量信号分析出累加量 */
function parseScaleProductCount2Add(records: SignalDataInfo[]): SignalDataExtendInfo[] {
  const list: SignalDataExtendInfo[] = [];

  const vsProductCountMap = new Map();

  // 数据塞入
  for (let i = 0; i < records.length; i++) {
    const signalData = records[i];
    const { stationId, scaleProductCount } = signalData;
    const isProductCountExist = vsProductCountMap.has(stationId);

    if (scaleProductCount === undefined || scaleProductCount === null) {
      continue;
    }

    // 1、检测工位 map中是否存在，
    // 如果不存在，进行初始化个数
    if (!isProductCountExist) {
      // 后减前，默认第一个点是0
      const preCount = 0;
      const deltaAdd = scaleProductCount - preCount;
      vsProductCountMap.set(stationId, scaleProductCount);

      const data = { ...signalData, scaleProductCountAdd: deltaAdd };
      list.push(data);
      continue;
    } else {
      // 工位存在，进入累加逻辑
      const preCount = vsProductCountMap.get(stationId);
      const deltaAdd = scaleProductCount - preCount;
      vsProductCountMap.set(stationId, scaleProductCount);

      if (deltaAdd > 0) {
        const data = { ...signalData, scaleProductCountAdd: deltaAdd };
        list.push(data);
      }
    }
  }

  // console.log({ records, list });

  return list;
}

/** 指定范围注入通用信号 */
function injectedSignalDataFromTimestampSection(
  scaleRecords: SignalDataExtendInfo[],
  startTimestamp: number,
  endTimestamp: number
) {
  const { registrationInfo, virtualLineInfo, virtualStationList } = useData();

  const rInfo = registrationInfo.value!!;
  const vlInfo = virtualLineInfo.value!!;
  const vsList = virtualStationList.value!!;

  const { standardBeat } = vlInfo;
  // 全量信号列表
  const sdList: SignalDataInfo[] = [];
  const groupedAndSorted: any = scaleRecords.reduce((acc, item) => {
    const key = item.stationId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  // 对每组内的项按 timestamp 排序
  for (const key in groupedAndSorted) {
    groupedAndSorted[key].sort((a, b) => a.timestamp - b.timestamp);
  }
  // console.log("groupedAndSortedgroupedAndSorted", groupedAndSorted);
  // 遍历虚拟工位
  for (let i = 0; i < vsList.length; i++) {
    const vsInfo = vsList[i];
    const stInfo = vsInfo.stationInfo;
    let scaleRecordsList = groupedAndSorted[stInfo.id];

    let time = 0;
    if (scaleRecordsList?.length > 0) {
      // console.log("scaleRecordsListscaleRecordsList", scaleRecordsList);
      for (let x = 0; x < scaleRecordsList.length; x++) {
        const sourceRecord = scaleRecordsList[x] as SignalDataExtendInfo & SignalDataWithBeatType;

        // signalRecords 内部保留全量历史用于重量累计差值计算，但本次只返回请求时间窗的数据。
        // 否则实时轮询即使只请求最近几秒，也会每次把当天全部重量信号重新转一遍并返回。
        if (sourceRecord.timestamp < startTimestamp || sourceRecord.timestamp > endTimestamp) {
          continue;
        }

        const data = {
          uuid: stInfo.moduleUuid,
          timestamp: sourceRecord.timestamp,
          registrationId: rInfo.id,
          lineId: vlInfo.lineId,
          stationId: stInfo.id,
          staffId: stInfo.staffId,
          deviceGround: undefined,
          wristband: undefined,
          generalInput: 1,
          addon: undefined,
          scale: undefined,
          scaleProductCount: undefined,
          // 重量信号转换后继续保留类型，确保 error、warn 仍可被过滤。
          type: sourceRecord.type,
        } as SignalDataInfo;
        sdList.push(data);
      }
      // let index = scaleRecordsList.findIndex((item) => item.timestamp == startTimestamp);
      // console.log("groupedAndSortedgroupedAndSorted", scaleRecordsList[0].timestamp, startTimestamp, index);
      // debugger;
      // if (scaleRecordsList[scaleRecordsList.length - 2].scale != scaleRecordsList[scaleRecordsList.length - 1]) {
      //   time =
      //     scaleRecordsList[scaleRecordsList.length - 1].timestamp -
      //     scaleRecordsList[scaleRecordsList.length - 2].timestamp;
      // }
    }
    // 每个工位注入
    // let n = 0;
    // let tempTimestamp = startTimestamp;
    // while (tempTimestamp < endTimestamp) {
    //   console.log("startTimestampstartTimestamp", tempTimestamp, endTimestamp);
    //   const data: SignalDataInfo = {
    //     uuid: stInfo.moduleUuid,
    //     timestamp: time > 0 ? time : tempTimestamp,
    //     registrationId: rInfo.id,
    //     lineId: vlInfo.lineId,
    //     stationId: stInfo.id,
    //     staffId: stInfo.staffId,
    //     deviceGround: undefined,
    //     wristband: undefined,
    //     generalInput: 1,
    //     addon: undefined,
    //     scale: undefined,
    //     scaleProductCount: undefined,
    //   };

    //   // 检测 通用信号 是否介于重量信号中
    //   if (!checkSignalInScale(scaleRecords, data)) {
    //     sdList.push(data);
    //   } else {
    //     // alert("checkSignalInScale");
    //   }

    //   // 累加
    //   n++;
    //   tempTimestamp = startTimestamp + n * standardBeat * 1000;
    // }
  }

  return sdList;
}

/** 转换重量信号为通用信号
 * @param isInit 是否为初始渲染（模拟全点）
 */
export function transformScale2General(
  startDate: string,
  endDate: string,
  records: SignalDataInfo[],
  isInit: boolean
): SignalDataInfo[] {
  const startTimestamp = getMillisecondByDate(startDate);
  const endTimestamp = getMillisecondByDate(endDate);

  // 是初次制造全点
  if (isInit) {
    // 初次信号存入
    signalRecords.value = records;

    const scaleRecords = parseScaleProductCount2Add(records);

    // 注入全点， startTimestamp 无需校准
    const dfList = injectedSignalDataFromTimestampSection(scaleRecords, startTimestamp, endTimestamp);

    return dfList;
  } else {
    // 获取初次信号列表 合并 按需信号
    const composeRecords = [...signalRecords.value, ...records];

    // 信号去重：Set 查询为 O(1)，避免数组 find 导致数据量大时退化为 O(n²)
    const formatComposeRecords = [] as SignalDataInfo[];
    const signalKeySet = new Set<string>();

    for (let i = 0; i < composeRecords.length; i++) {
      const s = composeRecords[i];
      const key = `${s.stationId}:${s.timestamp}`;
      if (signalKeySet.has(key)) {
        continue;
      }
      signalKeySet.add(key);
      formatComposeRecords.push(s);
    }
    signalRecords.value = formatComposeRecords;

    // 信号存入
    const scaleRecords = parseScaleProductCount2Add(formatComposeRecords);

    // 注入按需点，startTimestamp 需校准
    // 获取生产登记 开始时间
    const { registrationInfo, virtualLineInfo } = useData();

    const rInfo = registrationInfo.value!!;
    const vlInfo = virtualLineInfo.value!!;
    const { standardBeat } = vlInfo;
    const rsDate = formatRegistrationStartDate(rInfo);
    const rsDateTimestamp = getMillisecondByDate(rsDate);

    let standardStartTimestamp = rsDateTimestamp;
    const standardBeatMillisecond = standardBeat * 1000;
    // 直接计算 startTimestamp 的前一个标准节拍点，避免长时间登记产生大量循环
    if (standardBeatMillisecond > 0 && startTimestamp > rsDateTimestamp) {
      const beatCount = Math.max(
        0,
        Math.ceil((startTimestamp - rsDateTimestamp) / standardBeatMillisecond) - 1
      );
      standardStartTimestamp = rsDateTimestamp + beatCount * standardBeatMillisecond;
    }

    const dfList = injectedSignalDataFromTimestampSection(scaleRecords, standardStartTimestamp, endTimestamp);
    return dfList;
  }
}

/**
 * 格式化信号量数据
 *  1. 登记数据数据注入
 *  2. 基于线体上下限过滤
 *  3. 基于工位数据进行处理
 */
function _formatSignal(records: SignalDataInfo[], balanceUnitMinute = BALANCE_UNIT_MINUTE): SignalBeatData[] {
  const { lineInfo, lineList, virtualStationList, staffList } = useData();
  // 不再原地排序响应式数据，避免触发无关组件更新
  const newList = [...records].sort((a, b) => {
    if (a.stationId !== b.stationId) {
      return a.stationId - b.stationId; // 先按 stationId 升序
    }
    return a.timestamp - b.timestamp; // 再按时间升序
  });

  // 预先建立索引，将逐条 find 的 O(n*m) 降为 O(n+m)
  const lineMap = new Map(lineList.value.map((item) => [item.id, item]));
  const virtualStationMap = new Map(virtualStationList.value.map((item) => [item.stationId, item]));
  const staffMap = new Map(staffList.value.map((item) => [item.id, item]));

  // 使用新对象承载扩展字段，避免修改原始响应式信号
  const extendRecords: SignalDataExtendInfo[] = newList.map((item) => ({
    ...item,
    lineInfo: lineMap.get(item.lineId),
    virtualStationInfo: virtualStationMap.get(item.stationId),
    staffInfo: staffMap.get(item.staffId),
  }));

  // 比较每两条信号量数据的时间差
  const beatList = [];
  for (let i = 0; i < extendRecords.length - 1; i++) {
    const first = extendRecords[i];
    const second = extendRecords[i + 1];
    // 如果前后两条信号量不为同个工位,或时间戳非升序 则跳过（默认相同工位的数据是挨着的）
    if (first.stationId !== second.stationId || first.timestamp > second.timestamp) {
      continue;
    }

    // 当前节拍以 second 作为结束信号；仅跳过该节拍，不删除原始时间点，
    // 避免把前后两个正常节拍合并成一个异常的大节拍。
    if (!isValidBeatRecord(second)) {
      continue;
    }
    const messageId = extendRecords[i].messageId || 0;
    // 默许前后两条记录 物理标识一致
    const { virtualStationInfo, staffInfo } = first;

    let beatTime: number = Math.floor((second.timestamp - first.timestamp) / 1000);

    // 检测工位是否存在 节拍处理
    const { beatFormat } = virtualStationInfo || {};
    if (beatFormat) {
      beatTime = formatBeatTime(beatTime, beatFormat);
    }

    // 基于线体节拍水准数据过滤
    const signalInSection = isSignalInSection(lineInfo.value!!, beatTime);
    if (!signalInSection) {
      // 范围模式
      if (rangeMode) {
        continue;
      }
    }

    // console.log(beatTime, second, first);
    const firstDate = formatDateByDayjs(first.timestamp, "YYYY-MM-DD HH:mm:ss");
    const secondDate = formatDateByDayjs(second.timestamp, "YYYY-MM-DD HH:mm:ss");

    // 注入线平衡间隔时间（用于线平衡分析）
    const balanceDate = getBalanceDate(firstDate, balanceUnitMinute);

    const info = {
      virtualStationInfo,
      staffInfo,
      firstDate,
      secondDate,
      first,
      second,
      beatTime,
      beatFormat,
      balanceDate,
      messageId,
    };

    beatList.push(info);
  }

  // console.log(beatList);

  return beatList as SignalBeatData[];
}

/**
 * 数据信号量基础图表数据
 */
export function formatSignal2ChartData(records: SignalDataInfo[]) {
  const beatList = _formatSignal(records);
  // console.log(records);
  // 图表数值定义
  const xData = beatList.map((i) => `${i.secondDate.slice(-8)}`);
  const yData = beatList.map((i) => i.beatTime);
  const xyData: any[] = beatList;
  const markLineValue = (yData.reduce((a, b) => a + b, 0) / yData.length) | 0;

  const data = {
    xData,
    yData,
    xyData,
    markLineValue,
  };

  return data;
}

export interface HourlyCapacityChartItem {
  /** 小时时段，例如 08:00-09:00 */
  label: string;
  /** 当前统计窗口内的实际产量 */
  actualCount: number;
  /** 折算成完整一小时后的产能 */
  capacity: number;
  /** 当前小时实际覆盖的分钟数 */
  coveredMinutes: number;
  /** 是否属于不足一小时的折算值 */
  estimated: boolean;
}

/**
 * 按自然小时统计产能。
 *
 * 当某个小时只统计到部分时段时，按当前生产速率折算成完整一小时：
 * 标准标准小时产能 = 实际产量 × 60 / 已统计分钟数。
 * 例如前 30 分钟生产 20 件，则折算标准标准小时产能为 40 件/小时。
 */
export function formatHourlyCapacityChartData(
  records: SignalDataInfo[],
  options?: {
    nowTimestamp?: number;
    registrationStartTimestamp?: number;
    registrationEndTimestamp?: number;
  }
) {
  const nowTimestamp = options?.nowTimestamp ?? Date.now();
  const now = new Date(nowTimestamp);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;

  const registrationStartTimestamp = Math.max(options?.registrationStartTimestamp ?? dayStart, dayStart);
  const registrationEndTimestamp = Math.min(options?.registrationEndTimestamp ?? nowTimestamp, nowTimestamp, dayEnd);

  const xData: string[] = [];
  const yData: number[] = [];
  const xyData: HourlyCapacityChartItem[] = [];
  const hourlyActualCounts = new Array<number>(24).fill(0);

  // 信号只扫描一次，避免每个小时都重新遍历全部记录
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!isValidBeatRecord(record)) {
      continue;
    }

    const timestamp = record.timestamp;
    if (timestamp < registrationStartTimestamp || timestamp >= registrationEndTimestamp) {
      continue;
    }
    const hour = Math.floor((timestamp - dayStart) / oneHour);
    if (hour >= 0 && hour < 24) {
      hourlyActualCounts[hour]++;
    }
  }

  for (let hour = 0; hour < 24; hour++) {
    const bucketStart = dayStart + hour * oneHour;
    const bucketEnd = bucketStart + oneHour;
    const startHour = hour.toString().padStart(2, "0");
    const endHour = (hour + 1).toString().padStart(2, "0");
    const label = `${startHour}:00-${endHour}:00`;

    // 当前登记在该小时内实际覆盖的时间范围。
    const observedStart = Math.max(bucketStart, registrationStartTimestamp);
    const observedEnd = Math.min(bucketEnd, registrationEndTimestamp);
    const coveredMilliseconds = Math.max(0, observedEnd - observedStart);
    const coveredMinutes = Math.min(60, coveredMilliseconds / 60 / 1000);

    const actualCount = hourlyActualCounts[hour];

    const estimated = coveredMinutes > 0 && coveredMinutes < 60;
    // 不足 1 分钟时按 1 分钟计算，避免刚进入新小时后折算值异常放大。
    const divisorMinutes = Math.max(coveredMinutes, 1);
    const capacity = estimated ? Math.round((actualCount * 60) / divisorMinutes) : actualCount;

    xData.push(label);
    yData.push(capacity);
    xyData.push({
      label,
      actualCount,
      capacity,
      coveredMinutes: numberToFixed(coveredMinutes),
      estimated,
    });
  }

  return { xData, yData, xyData };
}

export interface StationHourlyCapacityRankItem {
  virtualStationInfo: any;
  name: string;
  /** 当天有效小时的平均标准标准小时产能 */
  averageHourlyCapacity: number;
  /** 当天实际信号总数 */
  actualCount: number;
  /** 参与平均计算的小时数 */
  activeHourCount: number;
  /** 其中经过整小时折算的小时数 */
  estimatedHourCount: number;
  hourlyData: HourlyCapacityChartItem[];
}

/**
 * 生成当天各岗位的平均标准标准小时产能排行。
 *
 * 计算口径：
 * 1. 每个岗位先按自然小时计算标准标准小时产能；
 * 2. 当前小时或登记边界不足 60 分钟时，先折算为完整标准标准小时产能；
 * 3. 只对 coveredMinutes > 0 的有效小时取平均，未进入生产时段的小时不参与。
 */
export function formatSignalAllStationHourlyCapacityRankData(
  records: SignalDataInfo[],
  options?: {
    nowTimestamp?: number;
    registrationStartTimestamp?: number;
    registrationEndTimestamp?: number;
  }
) {
  const { virtualStationList } = useData();
  const stationRecordMap = new Map<SignalDataInfo["stationId"], SignalDataInfo[]>();

  // 所有岗位信号只分组一次，避免每个岗位重复 filter 全量数据
  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    let stationRecords = stationRecordMap.get(item.stationId);
    if (!stationRecords) {
      stationRecords = [];
      stationRecordMap.set(item.stationId, stationRecords);
    }
    stationRecords.push(item);
  }

  const list: StationHourlyCapacityRankItem[] = virtualStationList.value
    .filter((virtualStationInfo) => !virtualStationInfo.isFilter)
    .map((virtualStationInfo) => {
      const stationId = virtualStationInfo.stationId;
      const stationRecords = stationRecordMap.get(stationId) || [];
      const hourlyData = formatHourlyCapacityChartData(stationRecords, options).xyData.filter(
        (item) => item.coveredMinutes > 0
      );

      const averageHourlyCapacity = hourlyData.length
        ? hourlyData.reduce((total, item) => total + item.capacity, 0) / hourlyData.length
        : 0;

      return {
        virtualStationInfo,
        name: getVirtualStationText(virtualStationInfo),
        averageHourlyCapacity: numberToFixed(averageHourlyCapacity) || 0,
        actualCount: hourlyData.reduce((total, item) => total + item.actualCount, 0),
        activeHourCount: hourlyData.length,
        estimatedHourCount: hourlyData.filter((item) => item.estimated).length,
        hourlyData,
      };
    });

  const xData = list.map((item) => item.name);
  const yData = list.map((item) => item.averageHourlyCapacity);
  const markLineValue = yData.length
    ? numberToFixed(yData.reduce((total, value) => total + value, 0) / yData.length)
    : 0;

  return {
    xData,
    yData,
    xyData: list,
    markLineValue,
  };
}

/** 数据工位映射化 */
export function formatSignalStations(records: SignalDataInfo[]) {
  const beatList = _formatSignal(records);

  // 基于beatList 输出工位映射表
  const { virtualStationList } = useData();
  const vl = virtualStationList.value;

  // 生成工位映射表
  const virtualStationMaps = {} as any;
  vl.forEach((i) => {
    const key = i.id;
    virtualStationMaps[key] = {
      virtualStationInfo: i,
      signalList: [],
    };
  });

  for (let i = 0; i < beatList.length; i++) {
    const item = beatList[i];
    const { virtualStationInfo } = item;
    const { id } = virtualStationInfo || {};
    if (!id) {
      continue;
    }
    virtualStationMaps[id].signalList.push(item);
  }

  // 数组化
  const list = Object.entries(virtualStationMaps).map(([k, v]) => [k, v]) as Array<
    [string, SignalVirtualStationMapData]
  >;

  // 基于 工位id 排序
  list.sort((a: any, b: any) => a[0] - b[0]);

  return list;
}

/** 数据工位映射化（实时模式，只取最后一条） */
export function formatSignalStationsRealTimeChartData(records: SignalDataInfo[]) {
  const { lineInfo } = useData();
  let list = formatSignalStations(records);
  list = list.sort((a: any, b: any) => a[1].virtualStationInfo.virtualStationSort - b[1].virtualStationInfo.virtualStationSort);
  // 每个工位取最后的1条数据
  let list2 = list.map(([id, v]) => {
    const { virtualStationInfo, signalList } = v;
    const last = signalList[signalList.length - 1] || {};
    const lastPrev = signalList[signalList.length - 2] || {};

    let lastItem = last;

    // 最新的节拍可能存在超出上下限，导致实时信号量无柱状图，但趋势图有点
    //（趋势图的话是前端做的过滤，所以合法）
    // 这里目前 实时节拍取点由2改成3，并且判断2和3的节拍情况 临时方案
    if (last && lastPrev) {
      const lastSignalInSection = isSignalInSection(lineInfo.value!!, last.beatTime);
      const lastPrevSignalInSection = isSignalInSection(lineInfo.value!!, last.beatTime);
      // 若最近一个信号超限，则默认取倒数第二个点【可能存在纰漏】
      if (!lastSignalInSection) {
        lastItem = lastPrev;
      }
    }

    return {
      ...lastItem,
      virtualStationInfo,
    };
  }).filter((i) => {
    // console.log(i);
    return !i.virtualStationInfo.isFilter;
    // return true;
    // return !stationStore.stationList.includes(i.virtualStationInfo.id);
  });

  const xData = list2.map((i) => {
    // console.log(i);
    const { virtualStationInfo } = i;
    const { stationInfo, virtualStationName } = virtualStationInfo;
    const { stationNo, stationName } = stationInfo;

    const line1 = `${stationNo}\n`;
    let line2 = "";

    const str = virtualStationName;

    for (let i = 0; i < str.length; i += 3) {
      const s0 = str[i] || "";
      const s1 = str[i + 1] || "";
      const s2 = str[i + 2] || "";
      line2 = line2 + s0 + s1 + s2 + "\n";
    }
    return line1 + line2;
  });

  // 兼容 工位数据处理
  const yData = list2.map((i) => i.beatTime);
  const xyData: any[] = list2;
  const markLineValue = (yData.reduce((a, b) => a + (b || 0), 0) / yData.length) | 0;
  const data = {
    xData,
    yData,
    xyData,
    markLineValue,
  };

  // console.log(data);

  return data;
}

/** 数据全部工位映射化-排名模式
 */
export function formatSignalAllStationRankData(records: SignalDataInfo[]) {
  let list = formatSignalStations(records);
  // console.log(list);
  list = list.filter((i) => !i[1].virtualStationInfo.isFilter);
  // 工位注入必要数据
  const newList = list.map(([id, v]) => {
    const { virtualStationInfo, signalList } = v;
    const name = getVirtualStationText(virtualStationInfo);

    const count = signalList.length;

    const average = signalList.reduce((total: number, item: any) => total + item.beatTime, 0) / count;

    return {
      virtualStationInfo,
      name,
      count,
      average: numberToFixed(average) || 0,
    };
  });

  const xData = newList.map((v) => {
    const { virtualStationInfo } = v;
    const name = getVirtualStationText(virtualStationInfo);
    return name;
  });

  // 兼容 工位数据处理
  const yData = newList.map((i) => i.average);
  const xyData = newList;
  const markLineValue = (yData.reduce((a, b) => a + (b || 0), 0) / yData.length) | 0;
  const data = {
    xData,
    yData,
    xyData,
    markLineValue,
  };

  return data;
}

/** 数据-线平衡数据结构化 */
export function formatBalanceListChartData(records: SignalDataInfo[], balanceUnitMinute = BALANCE_UNIT_MINUTE) {
  const beatList = _formatSignal(records, balanceUnitMinute);
  // console.log("beatListbeatListbeatList", beatList);
  // 经检测，后端实际返回的数据非时间结构，而是uid 顺序依次给予
  // 这里我们对数组按时间顺序 再进行一次排序
  beatList.sort((a, b) => a.second.timestamp - b.second.timestamp);

  // console.log(beatList);

  // 以 balanceDate 生成字典
  const lineBalanceMap = new Map<string, any>();

  for (let i = 0; i < beatList.length; i++) {
    const item = beatList[i];
    const { balanceDate, virtualStationInfo } = item;
    const id = virtualStationInfo?.id!!;

    // 字典初始化
    if (!lineBalanceMap.get(balanceDate)) {
      lineBalanceMap.set(balanceDate, {});
    }

    const mapItem = lineBalanceMap.get(balanceDate);

    // 工位初始化
    if (!mapItem[id]) {
      mapItem[id] = [];
    }

    mapItem[id].push(item);
  }

  const xData = [] as any[];
  const yData = [] as any[];
  const xyData = [] as any[];

  const balanceMapKeys = Array.from(lineBalanceMap.keys());

  // 遍历平衡时间
  for (let i = 0; i < balanceMapKeys.length; i++) {
    const balanceDate = balanceMapKeys[i];

    const itemMap = lineBalanceMap.get(balanceDate);
    // console.log(balanceDate, itemMap);

    // 最长节拍信号
    let maxAverageBeat = 0;
    // 最长节拍数据
    let maxAverageItem = null;
    // 线体平均节拍和
    let lineAvgSum = 0;

    // 工位平衡映射表
    const stationBalanceMap = {} as any;

    const virtualStationMaps = Object.keys(itemMap);

    // 遍历平衡时间工位
    virtualStationMaps.forEach((id) => {
      // 判断工位平台信息 字段是否存在
      if (!stationBalanceMap[id]) {
        stationBalanceMap[id] = [];
      }

      const data = itemMap[id];

      // 当前工位的平均耗时
      const stationAvg = data.reduce((total: any, item: any) => total + item.beatTime, 0) / data.length;

      // 过滤beatTime <0的数据看看
      // const flist = data.filter((i) => i.beatTime < 0);
      // console.log({ data, stationAvg,flist });

      if (stationAvg > maxAverageBeat) {
        maxAverageBeat = stationAvg;
        maxAverageItem = data;
      }

      // 线体节拍和 加入该工位平均节拍
      lineAvgSum += stationAvg;

      // 该工位平均节拍注入
      stationBalanceMap[id].average = numberToFixed(stationAvg);
    });

    // 工位总数
    const stationTotal = virtualStationMaps.length;
    // 平均节拍
    const beatAverage = lineAvgSum / stationTotal;
    // 线平衡计算
    const balance = (lineAvgSum / (maxAverageBeat * stationTotal)) * 100;

    const xyItem = {
      balanceDate,
      stationTotal,
      stationBalanceMap,
      lineAvgSum,
      beatAverage: numberToFixed(beatAverage),
      maxAverageBeat: numberToFixed(maxAverageBeat),
      maxAverageItem,
      balance: numberToFixed(balance),
    };

    xData.push(balanceDate.slice(11, 16));
    yData.push(numberToFixed(balance));
    xyData.push(xyItem);
  }

  // 线体平衡全量平均值
  const markLineValue = yData.reduce((a, b) => a + b, 0) / yData.length;

  const data = {
    xData,
    yData,
    xyData,
    markLineValue: numberToFixed(markLineValue),
  };

  // console.log(data);

  return data;
}

/** 获取间隔单位时间
 * 时间：2023-03-29 08:00:20
 * 单位时间 => 2023-03-29 08:00:00
 */
function getBalanceDate(date: string, unitMinute: number) {
  // 获取分钟即可
  const d = new Date(date);

  // 获取分钟即可
  const dm = d.getMinutes();

  // 按照设定的单位分钟取余再减
  const curMinute = dm - (dm % unitMinute);

  // 年月日
  const ymd = date.slice(0, 10);
  const hour = d.getHours().toString().padStart(2, "0");
  const minute = curMinute.toString().padStart(2, "0");
  const second = "00";

  return `${ymd} ${hour}:${minute}:${second}`;
}

/** html文本 - 生成信号数据 */
export function genSignalChartDataHtml(data: SignalBeatData) {
  const { virtualStationInfo, staffInfo, beatTime, beatFormat, firstDate, secondDate, first, second } = data;

  const name = getVirtualStationText(virtualStationInfo);
  const staffName = staffInfo?.staffName || "";

  let firstTime = formatDateByDayjs(first.timestamp, "YYYY-MM-DD HH:mm:ss");
  let secondTime = formatDateByDayjs(second.timestamp, "YYYY-MM-DD HH:mm:ss");

  // 如果是信号量属于今日，就省略年月日
  const nowDate = formatDateByDayjs();

  if (firstTime.startsWith(nowDate)) {
    firstTime = firstTime.slice(-8);
  }

  if (secondTime.startsWith(nowDate)) {
    secondTime = secondTime.slice(-8);
  }

  const html = `
      </p>
        <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">工位信息: </span>
        <span style="color: #1890ff">${name}</span>
      </p>
      </p>
        <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">员工信息: </span>
        <span style="color: #1890ff">${staffName}</span>
      </p>
      </p>
        <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">当前信号: </span>
        <span style="color: #1890ff">${secondTime}</span>
      </p>
      </p>
        <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">上次信号: </span>
        <span style="color: #1890ff">${firstTime}</span>
      </p>
      ${
        beatFormat &&
        `
        </p>
          <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">数值处理: </span>
          <span style="color: #aaa">${beatFormat}</span>
        </p>
      `
      }
      </p>
        <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">时间消耗: </span>
        <span style="color: #1890ff">${beatTime}秒</span>
      </p>
    `;

  return html;
}

/** html文本 - 线平衡数据 */
export function genLineBalanceHtml(data: any, data2: any) {
  const { balance, balanceDate, beatAverage, maxAverageBeat, maxAverageItem, stationTotal } = data;
  const targetValue = Number(localStorage.getItem("targetLineBalance") || 0);
  let sd = balanceDate.slice(0, -3);

  // 如果是信号量属于今日，就省略年月日
  const nowDate = formatDateByDayjs();

  if (balanceDate.startsWith(nowDate)) {
    sd = balanceDate.slice(11, 16);
  }

  let ed = "";
  if (data2) {
    ed = data2.balanceDate.slice(11, 16);
  }

  // const firstTime = formatDateByDayjs(first.timestamp, "YYYY-MM-DD HH:mm:ss").slice(-8);
  const labelWidth = "100px";
  const html = `
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">分析时段: </span>
        <span style="color: #1890ff">${sd}~${ed}</span>
      </p>
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">时段工位总数: </span>
        <span style="color: #1890ff">${stationTotal}</span>
      </p>
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">线平均节拍: </span>
        <span style="color: #1890ff">${beatAverage}秒</span>
      </p>
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">线平衡率: </span>
        <span style="color: #1890ff">${balance}%</span>
      </p>
      <hr>
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">最高节拍工位: </span>
        <span style="color: #1890ff">
          ${maxAverageItem[0]?.virtualStationInfo?.stationInfo?.stationNo || ""}${maxAverageItem[0]?.virtualStationInfo?.virtualStationName || ""}
        </span>
      </p>
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">最高节拍值: </span>
        <span style="color: #f00">${maxAverageBeat}秒</span>
      </p>
      <p>
        <span style="width: ${labelWidth};text-align:right;padding-right:5px; display:inline-block;color: #aaa;">目标线平衡率: </span>
        <span style="color: #f00">${targetValue}%</span>
      </p>
    `;

  return html;
}

export function getVirtualStationText(virtualStationInfo: any) {
  return `${virtualStationInfo.stationInfo.stationNo}-${virtualStationInfo.virtualStationName}`;
}

export function genDifferenceChartDataHtml(data: any) {
  const { virtualStationInfo, staffInfo, beatTime, beatFormat, firstDate, secondDate, first, second } = data;

  const name = getVirtualStationText(virtualStationInfo);
  const staffName = staffInfo?.staffName || "";

  let firstTime = formatDateByDayjs(first.timestamp, "YYYY-MM-DD HH:mm:ss");
  let secondTime = formatDateByDayjs(second.timestamp, "YYYY-MM-DD HH:mm:ss");

  // 如果是信号量属于今日，就省略年月日
  const nowDate = formatDateByDayjs();

  if (firstTime.startsWith(nowDate)) {
    firstTime = firstTime.slice(-8);
  }

  if (secondTime.startsWith(nowDate)) {
    secondTime = secondTime.slice(-8);
  }

  const html = `
      </p>
        <span style="width: 70px;text-align:right;padding-right:5px; display:inline-block;color: #aaa;">单次时间: </span>
        <span style="color: #1890ff">${beatTime}秒</span>
      </p>
    `;

  return html;
}
