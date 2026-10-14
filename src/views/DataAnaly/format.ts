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
/** 默认节拍统计排除的接口类型；产能统计不按此类型排除 */
const EXCLUDED_BEAT_TYPES = new Set(["error", "warn"]);

type SignalDataWithBeatType = SignalDataInfo & {
  type?: unknown;
};

/** 判断接口返回的信号是否可以参与节拍相关统计 */
export function isValidBeatRecord(record?: SignalDataInfo) {
  const type = String((record as SignalDataWithBeatType | undefined)?.type ?? "")
    .trim()
    .toLowerCase();
  // console.log(record);
  
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
          addon: sourceRecord.addon,
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
interface FormatSignalOptions {
  /** 仅用于趋势展示：保留超上下限及 type=error/warn 的异常节拍点 */
  includeAbnormalPoints?: boolean;
}

/** stationId + timestamp 已有序时跳过数组复制和 sort。 */
function isSignalListSorted(records: SignalDataInfo[]) {
  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1];
    const current = records[i];

    if (prev.stationId > current.stationId) return false;
    if (
      prev.stationId === current.stationId &&
      prev.timestamp > current.timestamp
    ) {
      return false;
    }
  }

  return true;
}

function _formatSignal(
  records: SignalDataInfo[],
  balanceUnitMinute = BALANCE_UNIT_MINUTE,
  options?: FormatSignalOptions
): SignalBeatData[] {
  const includeAbnormalPoints = options?.includeAbnormalPoints === true;
  const { lineInfo, lineList, virtualStationList, staffList } = useData();
  // 单岗位数据通常已经有序，避免每次小时统计都复制 + sort。
  const newList = isSignalListSorted(records)
    ? records
    : [...records].sort((a, b) => {
        if (a.stationId !== b.stationId) {
          return a.stationId - b.stationId;
        }
        return a.timestamp - b.timestamp;
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
    if (!includeAbnormalPoints && !isValidBeatRecord(second)) {
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
    if (!signalInSection && rangeMode && !includeAbnormalPoints) {
      continue;
    }

    const signalType = String((second as SignalDataWithBeatType)?.type ?? "")
      .trim()
      .toLowerCase();
    const typeAbnormal = EXCLUDED_BEAT_TYPES.has(signalType);
    const rangeAbnormal = !signalInSection;
    const isAbnormal = typeAbnormal || rangeAbnormal;

    let abnormalInfo = "";
    if (isAbnormal) {
      const beatMin = Number(lineInfo.value?.beatMin);
      const beatMax = Number(lineInfo.value?.beatMax);

      // 节拍超限优先展示具体方向；其余异常统一按漏放展示。
      if (rangeAbnormal && Number.isFinite(beatMax) && beatTime > beatMax) {
        abnormalInfo = "超出节拍上限";
      } else if (rangeAbnormal && Number.isFinite(beatMin) && beatTime < beatMin) {
        abnormalInfo = "超出节拍下限";
      } else {
        abnormalInfo = signalType=="warn"?"无效节拍(受漏放影响)":"漏放";
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
      isAbnormal,
      abnormalInfo,
    };
    // console.log(info);
    beatList.push(info);
  }

  // console.log(beatList);

  return beatList as SignalBeatData[];
}

/**
 * 数据信号量基础图表数据
 */
export function formatSignal2ChartData(records: SignalDataInfo[], options?: FormatSignalOptions) {
  const beatList = _formatSignal(records, BALANCE_UNIT_MINUTE, options);
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

/** 产能按节拍点计数：error/warn 也计入，只排除无效用时和超上下限的点。 */
function isCapacityBeat(beat: SignalBeatData) {
  const { lineInfo } = useData();
  const beatTime = Number(beat.beatTime);
  return Boolean(
    lineInfo.value &&
    Number.isFinite(beatTime) &&
    isSignalInSection(lineInfo.value, beatTime)
  );
}

export interface HourlyCapacityChartItem {
  /** 小时时段，例如登记 10:40 开始时为 10:40-11:40 */
  label: string;
  /** 该小时柱实际参与统计的开始时间 */
  startTimestamp: number;
  /** 该小时柱实际参与统计的结束时间（开区间） */
  endTimestamp: number;
  /** 当前统计窗口内的实际产量 */
  actualCount: number;
  /** 按标准节拍计算的标准小时产能：3600 / 标准节拍，仅用于 tooltip 展示 */
  standardHourlyCapacity: number;
  /** 该连续 60 分钟统计范围内的实际产量，不做整小时折算 */
  capacity: number;
  /** 当前小时实际覆盖的分钟数 */
  coveredMinutes: number;
  /** 当前时间段异常事件数量：type=error/warn 或节拍超出线体上下限；同一结束信号只计一次 */
  abnormalCount: number;
  /** 兼容旧消费端，现已统一不折算，始终为 false */
  estimated: boolean;
  /** 当前小时有效节拍数量 */
  beatCount: number;
  /** 当前小时有效节拍用时合计，用于产线级加权平均 */
  beatTimeSum: number;
  /** 当前小时最小有效节拍用时 */
  minBeatTime: number | null;
  /** 当前小时最大有效节拍用时 */
  maxBeatTime: number | null;
  /** 当前小时平均有效节拍用时 */
  averageBeatTime: number | null;
}

/**
 * 从当前统计范围的开始时间起，每 60 分钟统计一次实际产量。
 * 例如登记 10:40 开始，依次生成 10:40-11:40、11:40-12:40。
 * 手动筛选后，筛选开始时间就是新的小时锚点。
 * 最后一个时段即使不足 60 分钟，也只展示已经完成的实际数量，不做折算。
 */
export function formatHourlyCapacityChartData(
  records: SignalDataInfo[],
  options?: {
    nowTimestamp?: number;
    /** 明确指定要统计的自然日；选择某一天时使用 */
    dayTimestamp?: number;
    /** 跨天登记且未选择统计日期时，按整条登记逐小时生成 */
    multiDay?: boolean;
    registrationStartTimestamp?: number;
    registrationEndTimestamp?: number;
    /** 当前虚拟产线标准节拍，单位：秒/件 */
    standardBeat?: number;
  }
) {
  const nowTimestamp = options?.nowTimestamp ?? Date.now();
  const oneHour = 60 * 60 * 1000;

  const rawRegistrationStartTimestamp = options?.registrationStartTimestamp;
  const rawRegistrationEndTimestamp = options?.registrationEndTimestamp;

  const xData: string[] = [];
  const yData: number[] = [];
  const xyData: HourlyCapacityChartItem[] = [];

  let registrationStartTimestamp: number;
  let registrationEndTimestamp: number;
  let firstBucketStart: number;
  let bucketCount: number;
  let multiDay = options?.multiDay === true;

  if (multiDay) {
    if (!Number.isFinite(rawRegistrationStartTimestamp)) {
      return { xData, yData, abnormalYData: [], xyData };
    }

    registrationStartTimestamp = rawRegistrationStartTimestamp as number;
    registrationEndTimestamp = Math.min(
      Number.isFinite(rawRegistrationEndTimestamp)
        ? (rawRegistrationEndTimestamp as number)
        : nowTimestamp,
      nowTimestamp
    );

    if (registrationEndTimestamp <= registrationStartTimestamp) {
      return { xData, yData, abnormalYData: [], xyData };
    }

    // 跨天登记也始终以当前统计范围起点作为小时锚点。
    firstBucketStart = registrationStartTimestamp;

    bucketCount = Math.max(
      1,
      Math.ceil((registrationEndTimestamp - registrationStartTimestamp) / oneHour)
    );
  } else {
    const dayTimestamp = options?.dayTimestamp ?? nowTimestamp;
    const analysisDay = new Date(dayTimestamp);
    const dayStart = new Date(
      analysisDay.getFullYear(),
      analysisDay.getMonth(),
      analysisDay.getDate()
    ).getTime();
    const dayEnd = dayStart + 24 * oneHour;

    const validRegistrationStartTimestamp = Number.isFinite(rawRegistrationStartTimestamp)
      ? (rawRegistrationStartTimestamp as number)
      : dayStart;
    const validRegistrationEndTimestamp = Number.isFinite(rawRegistrationEndTimestamp)
      ? (rawRegistrationEndTimestamp as number)
      : nowTimestamp;

    registrationStartTimestamp = Math.max(validRegistrationStartTimestamp, dayStart);
    registrationEndTimestamp = Math.min(validRegistrationEndTimestamp, nowTimestamp, dayEnd);

    if (registrationEndTimestamp <= registrationStartTimestamp) {
      return { xData, yData, abnormalYData: [], xyData };
    }

    // 不再向下取整到自然小时；登记或筛选几点几分开始，就从几点几分结算。
    firstBucketStart = registrationStartTimestamp;

    bucketCount = Math.max(
      1,
      Math.ceil((registrationEndTimestamp - registrationStartTimestamp) / oneHour)
    );
  }

  const actualCounts = new Array<number>(bucketCount).fill(0);
  const abnormalKeys = Array.from(
    { length: bucketCount },
    () => new Set<string>()
  );

  /**
   * 每小时节拍统计直接用累计器，不保存全部 beatTime 明细，
   * 降低大数据量下的内存分配和 Math.min(...array) 开销。
   */
  const beatCountByBucket = new Array<number>(bucketCount).fill(0);
  const beatTimeSumByBucket = new Array<number>(bucketCount).fill(0);
  const minBeatTimeByBucket = new Array<number>(bucketCount).fill(
    Number.POSITIVE_INFINITY
  );
  const maxBeatTimeByBucket = new Array<number>(bucketCount).fill(
    Number.NEGATIVE_INFINITY
  );

  function getBucketIndex(timestamp: number) {
    return Math.floor((timestamp - firstBucketStart) / oneHour);
  }

  // type=error/warn
  for (const record of records) {
    const timestamp = record.timestamp;

    if (timestamp < registrationStartTimestamp || timestamp >= registrationEndTimestamp) {
      continue;
    }

    if (isValidBeatRecord(record)) {
      continue;
    }

    const index = getBucketIndex(timestamp);
    if (index >= 0 && index < bucketCount) {
      abnormalKeys[index].add(`${record.stationId}:${timestamp}`);
    }
  }

  /**
   * 异常判定 + 有效节拍 min/max/avg 共用一次 _formatSignal。
   * 原来这里会分别调用两次 _formatSignal(records)，
   * 在“所有岗位标准小时产能”场景下会被成倍放大。
   */
  const { lineInfo, virtualLineInfo } = useData();
  const standardBeat = Number(
    options?.standardBeat ?? virtualLineInfo.value?.standardBeat
  );
  const lineStandardHourlyCapacity =
    Number.isFinite(standardBeat) && standardBeat > 0
      ? (3600 / standardBeat).toFixed(1)
      : 0;
  if (lineInfo.value && records.length > 1) {
    const allBeatList = _formatSignal(
      records,
      BALANCE_UNIT_MINUTE,
      { includeAbnormalPoints: true }
    );

    for (const beat of allBeatList) {
      const timestamp = beat.second?.timestamp;
      const beatTime = Number(beat.beatTime);

      if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(beatTime) ||
        timestamp < registrationStartTimestamp ||
        timestamp >= registrationEndTimestamp
      ) {
        continue;
      }

      const index = getBucketIndex(timestamp);
      if (index < 0 || index >= bucketCount) {
        continue;
      }

      const signalInSection = isSignalInSection(
        lineInfo.value,
        beatTime
      );
      const validType = isValidBeatRecord(beat.second);

      if (!signalInSection) {
        abnormalKeys[index].add(
          `${beat.second.stationId}:${timestamp}`
        );
      }

      // 按实际节拍点计产能；首条原始信号只是起点，不额外计一件。
      // error/warn 只要未超上下限，同样计入当前结束时间所在的小时。
      if (isCapacityBeat(beat)) {
        actualCounts[index] += 1;
      }

      // tooltip 的用时统计只使用有效节拍。
      if (!validType || !signalInSection) {
        continue;
      }

      beatCountByBucket[index] += 1;
      beatTimeSumByBucket[index] += beatTime;
      minBeatTimeByBucket[index] = Math.min(
        minBeatTimeByBucket[index],
        beatTime
      );
      maxBeatTimeByBucket[index] = Math.max(
        maxBeatTimeByBucket[index],
        beatTime
      );
    }
  }

  const crossesDay =
    new Date(registrationStartTimestamp).toDateString() !==
    new Date(Math.max(registrationStartTimestamp, registrationEndTimestamp - 1)).toDateString();

  for (let index = 0; index < bucketCount; index++) {
    const bucketStart = firstBucketStart + index * oneHour;
    const bucketEnd = bucketStart + oneHour;

    const observedStart = Math.max(bucketStart, registrationStartTimestamp);
    const observedEnd = Math.min(bucketEnd, registrationEndTimestamp);

    if (observedEnd <= observedStart) {
      continue;
    }

    const coveredMinutes = Math.min(
      60,
      Math.max(0, observedEnd - observedStart) / 60 / 1000
    );

    const actualCount = actualCounts[index];
    const abnormalCount = abnormalKeys[index].size;
    // 标准小时产能只由标准节拍决定，不再根据实际数量和已生产时长折算。
    // 例如标准节拍为 60 秒/件：3600 / 60 = 60 件/小时。
    const standardHourlyCapacity = lineStandardHourlyCapacity;
    // 所有小时图统一使用实际产量，不再把不足 60 分钟的数据放大到整小时。
    const estimated = false;
    const capacity = actualCount;

    const beatCount = beatCountByBucket[index];
    const beatTimeSum = beatTimeSumByBucket[index];
    const minBeatTime = beatCount
      ? numberToFixed(minBeatTimeByBucket[index])
      : null;
    const maxBeatTime = beatCount
      ? numberToFixed(maxBeatTimeByBucket[index])
      : null;
    const averageBeatTime = beatCount
      ? numberToFixed(beatTimeSum / beatCount)
      : null;

    const showDateLabel =
      crossesDay || options?.dayTimestamp !== undefined;

    // 每个完整时段从锚点连续计算 60 分钟；最后不足一小时则显示实际截止时间。
    const label = showDateLabel
      ? `${formatDateByDayjs(observedStart, "MM-DD")}\n${formatDateByDayjs(observedStart, "HH:mm")}-${formatDateByDayjs(observedEnd, "HH:mm")}`
      : `${formatDateByDayjs(observedStart, "HH:mm")}-${formatDateByDayjs(observedEnd, "HH:mm")}`;
    if(!capacity){
      continue;
    }
    xData.push(label);
    yData.push(capacity);
    xyData.push({
      label,
      startTimestamp: observedStart,
      endTimestamp: observedEnd,
      actualCount,
      standardHourlyCapacity,
      capacity,
      coveredMinutes: numberToFixed(coveredMinutes),
      abnormalCount,
      estimated,
      beatCount,
      beatTimeSum: numberToFixed(beatTimeSum) || 0,
      minBeatTime,
      maxBeatTime,
      averageBeatTime,
    });
  }

  return {
    xData,
    yData,
    abnormalYData: xyData.map((item) => item.abnormalCount),
    xyData,
  };
}

export interface LineHourlyCapacityChartItem {
  /** 小时时段 */
  label: string;
  /** 当前小时实际统计开始时间 */
  startTimestamp: number;
  /** 当前小时实际统计结束时间 */
  endTimestamp: number;
  /** 产线标准小时产能：所有有效岗位该小时实际产量的平均数 */
  averageCapacity: number;
  /** 所有有效岗位该小时实际产量之和 */
  totalCapacity: number;
  /** 参与平均的有效岗位总数；无产量岗位也按 0 参与平均 */
  stationTotal: number;
  /** 当前小时所有岗位有效节拍数量 */
  beatCount: number;
  /** 当前小时所有岗位有效节拍用时合计 */
  beatTimeSum: number;
  /** 当前小时所有岗位最小有效节拍用时 */
  minBeatTime: number | null;
  /** 当前小时所有岗位最大有效节拍用时 */
  maxBeatTime: number | null;
  /** 当前小时所有岗位平均有效节拍用时（按节拍数量加权） */
  averageBeatTime: number | null;
}

/**
 * 生成产线标准小时产能趋势。
 *
 * 计算口径：
 * 1. 每个岗位先复用 formatHourlyCapacityChartData，按登记/筛选开始时间连续计算每 60 分钟实际产量；
 * 2. 被 isFilter 的岗位不参与；
 * 3. 每个小时：产线标准小时产能 = 所有有效岗位小时实际产量之和 / 有效岗位总数；
 * 4. 某岗位当前小时没有产量时按 0 参与平均；
 * 5. 登记边界、筛选边界、跨天及最后不足 60 分钟的展示口径全部沿用岗位小时图。
 */
export function formatLineHourlyCapacityChartData(
  records: SignalDataInfo[],
  options?: {
    nowTimestamp?: number;
    dayTimestamp?: number;
    multiDay?: boolean;
    registrationStartTimestamp?: number;
    registrationEndTimestamp?: number;
    /** 当前虚拟产线标准节拍，单位：秒/件 */
    standardBeat?: number;
  }
) {
  const { virtualStationList } = useData();

  const validStations = virtualStationList.value.filter(
    (virtualStationInfo) => !virtualStationInfo.isFilter
  );

  const stationTotal = validStations.length;
  const xData: string[] = [];
  const yData: number[] = [];
  const xyData: LineHourlyCapacityChartItem[] = [];

  if (!stationTotal) {
    return {
      xData,
      yData,
      xyData,
      markLineValue: 0,
    };
  }

  // 全量信号只分组一次。
  const stationRecordMap = new Map<
    SignalDataInfo["stationId"],
    SignalDataInfo[]
  >();

  for (const record of records) {
    let stationRecords = stationRecordMap.get(record.stationId);

    if (!stationRecords) {
      stationRecords = [];
      stationRecordMap.set(record.stationId, stationRecords);
    }

    stationRecords.push(record);
  }

  /**
   * 用实际统计区间作为 key，而不是单纯 label，
   * 避免跨天登记出现相同 08:00-09:00 被错误合并。
   */
  const bucketMap = new Map<
    string,
    {
      label: string;
      startTimestamp: number;
      endTimestamp: number;
      totalCapacity: number;
      beatCount: number;
      beatTimeSum: number;
      minBeatTime: number | null;
      maxBeatTime: number | null;
    }
  >();

  for (const virtualStationInfo of validStations) {
    const stationRecords =
      stationRecordMap.get(virtualStationInfo.stationId) || [];

    const stationHourlyData = formatHourlyCapacityChartData(
      stationRecords,
      options
    ).xyData;

    for (const item of stationHourlyData) {
      const key = `${item.startTimestamp}:${item.endTimestamp}`;
      let bucket = bucketMap.get(key);

      if (!bucket) {
        bucket = {
          label: item.label,
          startTimestamp: item.startTimestamp,
          endTimestamp: item.endTimestamp,
          totalCapacity: 0,
          beatCount: 0,
          beatTimeSum: 0,
          minBeatTime: null,
          maxBeatTime: null,
        };
        bucketMap.set(key, bucket);
      }

      bucket.totalCapacity += Number(item.capacity || 0);

      if (item.beatCount > 0) {
        bucket.beatCount += item.beatCount;
        bucket.beatTimeSum += Number(item.beatTimeSum || 0);

        if (
          item.minBeatTime !== null &&
          (bucket.minBeatTime === null ||
            item.minBeatTime < bucket.minBeatTime)
        ) {
          bucket.minBeatTime = item.minBeatTime;
        }

        if (
          item.maxBeatTime !== null &&
          (bucket.maxBeatTime === null ||
            item.maxBeatTime > bucket.maxBeatTime)
        ) {
          bucket.maxBeatTime = item.maxBeatTime;
        }
      }
    }
  }

  const list = Array.from(bucketMap.values())
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .map((item) => ({
      ...item,
      totalCapacity: numberToFixed(item.totalCapacity) || 0,
      averageCapacity:
        numberToFixed(item.totalCapacity / stationTotal) || 0,
      stationTotal,
      beatTimeSum: numberToFixed(item.beatTimeSum) || 0,
      averageBeatTime: item.beatCount
        ? numberToFixed(item.beatTimeSum / item.beatCount)
        : null,
    }));

  for (const item of list) {
    xData.push(item.label);
    yData.push(item.averageCapacity);
    xyData.push(item);
  }

  const markLineValue = yData.length
    ? numberToFixed(
        yData.reduce((total, value) => total + value, 0) / yData.length
      )
    : 0;

  return {
    xData,
    yData,
    xyData,
    markLineValue,
  };
}

export interface StationHourlyCapacityRankItem {
  virtualStationInfo: any;
  name: string;
  /** 当天有效小时的平均实际产量 */
  averageHourlyCapacity: number;
  /** 当天实际信号总数 */
  actualCount: number;
  /** 参与平均计算的小时数 */
  activeHourCount: number;
  /** 兼容旧消费端；现已统一不折算，始终为 0 */
  estimatedHourCount: number;
  hourlyData: HourlyCapacityChartItem[];
}

/**
 * 生成当天各岗位的平均标准小时产能排行。
 *
 * 计算口径：
 * 1. 每个岗位从登记/筛选开始时间起，按连续 60 分钟统计实际产量；
 * 2. 当前小时或登记边界不足 60 分钟时，仍使用实际产量，不折算；
 * 3. 只对 coveredMinutes > 0 的有效小时取平均，未进入生产时段的小时不参与。
 */
export function formatSignalAllStationHourlyCapacityRankData(
  records: SignalDataInfo[],
  options?: {
    nowTimestamp?: number;
    /** 明确指定要统计的自然日 */
    dayTimestamp?: number;
    /** 未选择统计日期时，按整条跨天登记逐小时统计 */
    multiDay?: boolean;
    registrationStartTimestamp?: number;
    registrationEndTimestamp?: number;
    /** 当前虚拟产线标准节拍，单位：秒/件 */
    standardBeat?: number;
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
        estimatedHourCount: 0,
        hourlyData,
      };
    }).sort((a, b) => b.averageHourlyCapacity - a.averageHourlyCapacity);

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


export interface StationRegistrationCapacityItem {
  virtualStationInfo: any;
  name: string;
  /** 当前生产登记范围内的有效总产能 */
  totalCapacity: number;
}

/**
 * 生成当前生产登记范围内各岗位的总产能。
 *
 * 统计口径：
 * 1. 只统计 registrationStartTimestamp ~ registrationEndTimestamp 范围；
 * 2. type=error/warn 也计入产能，但超出上下限的节拍点不计入；
 * 3. 每个符合上下限的节拍点计 1 件，按结束信号时间归属统计范围；
 * 4. 被配置为 isFilter 的岗位不参与展示；
 * 5. 保持岗位列表原有顺序。
 */
export function formatSignalAllStationRegistrationCapacityData(
  records: SignalDataInfo[],
  options?: {
    registrationStartTimestamp?: number;
    registrationEndTimestamp?: number;
  }
) {
  const { virtualStationList } = useData();

  const rawStartTimestamp = options?.registrationStartTimestamp;
  const rawEndTimestamp = options?.registrationEndTimestamp;
  const startTimestamp = Number.isFinite(rawStartTimestamp)
    ? (rawStartTimestamp as number)
    : Number.NEGATIVE_INFINITY;
  const endTimestamp = Number.isFinite(rawEndTimestamp)
    ? (rawEndTimestamp as number)
    : Number.POSITIVE_INFINITY;

  const stationCountMap = new Map<SignalDataInfo["stationId"], number>();

  // 先用完整信号生成节拍，再按结束时间筛选，保留跨入统计范围的首个节拍。
  const beatList = _formatSignal(records, BALANCE_UNIT_MINUTE, {
    includeAbnormalPoints: true,
  });
  for (const beat of beatList) {
    if (!isCapacityBeat(beat)) {
      continue;
    }

    const record = beat.second;
    if (!Number.isFinite(record?.timestamp) || record.timestamp < startTimestamp || record.timestamp >= endTimestamp) {
      continue;
    }

    stationCountMap.set(record.stationId, (stationCountMap.get(record.stationId) || 0) + 1);
  }

  const list: StationRegistrationCapacityItem[] = virtualStationList.value
    .filter((virtualStationInfo) => !virtualStationInfo.isFilter)
    .map((virtualStationInfo) => ({
      virtualStationInfo,
      name: getVirtualStationText(virtualStationInfo),
      totalCapacity: stationCountMap.get(virtualStationInfo.stationId) || 0,
    }))


  const xData = list.map((item) => item.name);
  const yData = list.map((item) => item.totalCapacity);
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

/** 实时节拍和岗位平均节拍共用工位配置顺序，同序号时按 ID 排列。 */
function compareVirtualStationOrder(
  a: [string, SignalVirtualStationMapData],
  b: [string, SignalVirtualStationMapData]
) {
  const aSort = Number(a[1].virtualStationInfo.virtualStationSort) || 0;
  const bSort = Number(b[1].virtualStationInfo.virtualStationSort) || 0;
  return aSort - bSort || Number(a[0]) - Number(b[0]);
}

/** 数据工位映射化（实时模式，只取最后一条） */
export function formatSignalStationsRealTimeChartData(records: SignalDataInfo[]) {
  const { lineInfo } = useData();
  let list = formatSignalStations(records);
  list = list.sort(compareVirtualStationOrder);
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
  })

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
  })

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
  // 与实时节拍图保持相同岗位顺序，标签、数值、点击数据一起排列。
  list = list.filter((i) => !i[1].virtualStationInfo.isFilter).sort(compareVirtualStationOrder);
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
  })

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
export function formatBalanceListChartData(
  records: SignalDataInfo[],
  balanceUnitMinute = BALANCE_UNIT_MINUTE,
  timeRange?: { startTimestamp: number; endTimestamp: number } | null
) {
  const balanceUnitMs = Math.max(1, balanceUnitMinute) * 60 * 1000;
  const beatList = _formatSignal(records, balanceUnitMinute).filter((item) => {
    if (!timeRange) return true;
    // 节拍归属于结束信号所在时段；这样既能利用筛选开始前的最后一条信号，
    // 又不会把筛选范围外的节拍带入线平衡图。
    return item.second.timestamp >= timeRange.startTimestamp && item.second.timestamp < timeRange.endTimestamp;
  });
  // console.log("beatListbeatListbeatList", beatList);
  // 经检测，后端实际返回的数据非时间结构，而是uid 顺序依次给予
  // 这里我们对数组按时间顺序 再进行一次排序
  beatList.sort((a, b) => a.second.timestamp - b.second.timestamp);

  // console.log(beatList);

  // 以 balanceDate 生成字典
  const lineBalanceMap = new Map<string, any>();

  for (let i = 0; i < beatList.length; i++) {
    const item = beatList[i];
    const { virtualStationInfo } = item;
    // 指定统计范围时，以范围开始时间作为线平衡分桶锚点。
    // 例如 10:40 开始：10:40-11:40、11:40-12:40，不再按自然整点切分。
    const bucketStartTimestamp = timeRange
      ? timeRange.startTimestamp +
        Math.floor((item.second.timestamp - timeRange.startTimestamp) / balanceUnitMs) * balanceUnitMs
      : getMillisecondByDate(item.balanceDate);
    const balanceDate = formatDateByDayjs(bucketStartTimestamp, "YYYY-MM-DD HH:mm:ss");
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
    const startTimestamp = getMillisecondByDate(balanceDate);
    const endTimestamp = timeRange
      ? Math.min(startTimestamp + balanceUnitMs, timeRange.endTimestamp)
      : startTimestamp + balanceUnitMs;
    const crossesDay = new Date(startTimestamp).toDateString() !== new Date(endTimestamp - 1).toDateString();
    const label = crossesDay
      ? `${formatDateByDayjs(startTimestamp, "MM-DD HH:mm")}-${formatDateByDayjs(endTimestamp, "MM-DD HH:mm")}`
      : `${formatDateByDayjs(startTimestamp, "HH:mm")}-${formatDateByDayjs(endTimestamp, "HH:mm")}`;

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
      label,
      startTimestamp,
      endTimestamp,
      stationTotal,
      stationBalanceMap,
      lineAvgSum,
      beatAverage: numberToFixed(beatAverage),
      maxAverageBeat: numberToFixed(maxAverageBeat),
      maxAverageItem,
      balance: numberToFixed(balance),
    };

    xData.push(label);
    yData.push(numberToFixed(balance));
    xyData.push(xyItem);
  }

  // 线体平衡全量平均值
  const markLineValue = yData.length ? yData.reduce((a, b) => a + b, 0) / yData.length : 0;

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
  const {
    virtualStationInfo,
    staffInfo,
    beatTime,
    beatFormat,
    firstDate,
    secondDate,
    first,
    second,
  } = data;

  const { isAbnormal, abnormalInfo } = data as SignalBeatData & {
    isAbnormal?: boolean;
    abnormalInfo?: string;
  };

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

  const abnormalHtml =
    isAbnormal && abnormalInfo
      ? `
        <p style="margin:0 0 6px;color:#ff4d4f;">
          <span style="font-weight:600;">异常信息: </span>
          <span>${abnormalInfo}</span>
        </p>
      `
      : "";

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
      ${abnormalHtml}

    `;

  return html;
}

/** html文本 - 线平衡数据 */
export function genLineBalanceHtml(data: any, data2: any) {
  const {
    balance,
    balanceDate,
    startTimestamp,
    endTimestamp,
    beatAverage,
    maxAverageBeat,
    maxAverageItem,
    stationTotal,
  } = data;
  const targetValue = Number(localStorage.getItem("targetLineBalance") || 0);
  let sd = Number.isFinite(startTimestamp)
    ? formatDateByDayjs(startTimestamp, "YYYY-MM-DD HH:mm")
    : balanceDate.slice(0, -3);

  // 如果是信号量属于今日，就省略年月日
  const nowDate = formatDateByDayjs();

  if (Number.isFinite(startTimestamp)) {
    if (formatDateByDayjs(startTimestamp).startsWith(nowDate)) {
      sd = formatDateByDayjs(startTimestamp, "HH:mm");
    }
  } else if (balanceDate.startsWith(nowDate)) {
    sd = balanceDate.slice(11, 16);
  }

  let ed = Number.isFinite(endTimestamp)
    ? formatDateByDayjs(endTimestamp, "HH:mm")
    : "";
  if (!ed && data2) {
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
          ${maxAverageItem[0]?.virtualStationInfo?.stationInfo?.stationNo || ""}-${maxAverageItem[0]?.virtualStationInfo?.virtualStationName || ""}
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
