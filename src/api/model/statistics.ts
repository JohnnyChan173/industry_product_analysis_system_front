/** 数据统计-车间数据 */
export type StatisticsWorkshopData = {
  capacity: Array<{
    lineId: number;
    lineName: string;
    registrationPlanProductNumberTotal: number;
    registrationBeatProductNumberTotal: number;
  }>;
  lineBalance: Array<{
    lineId: number;
    lineName: string;
    dates: string[];
    balanceRatios: number[];
  }>;
  addonEvents: Array<{
    lineId: number;
    lineName: string;
    types: string[];
    happenCounts: number[];
  }>;
};

export type PlatformBasicDataInfo = {
  key: string;
  value1: number;
  value2: number;
  result: number;

  // 组件注入
  text?: string;
  oneValue?: boolean;
  parseResult?: string | number;
};

/** 数据统计-平台基础数据 */
export type StatisticsPlatformBasicData = {
  lineOpen: PlatformBasicDataInfo[];
  addonResolve: PlatformBasicDataInfo[];
  materialBatchStock: PlatformBasicDataInfo[];
  productBatchStock: PlatformBasicDataInfo[];
  regStat: PlatformBasicDataInfo[];
  materialBatchStat: PlatformBasicDataInfo[];
  productBatchStat: PlatformBasicDataInfo[];
};

export type monthlyAchievement = {
  virtualLineId: number;
  virtualLineName: string;
  totalActualOutput: number;
  totalPlanOutput: number;
  achievementRate: number;
};

export type dailyOutPut = {
  virtualLineId: number;
  virtualLineName: string;
  dailyList: Array<{
    day: string;
    dateStr: number;
    dailyOutput: number;
  }>;
};

export type monthlyLineBalance = {
  virtualLineId: number;
  virtualLineName: string;
  lineId: number;
  lineName: string;
  monthAvgRate: number;
};

export type dailyLineBalance = {
  virtualLineId: number;
  virtualLineName: string;
  monthlyAvgLineRate: number;
  dailyPointList: Array<{
    "day": string;
    "dateStr": string;
    "dailyAvgRate": number;
    "dailyHourlyMaxRate": number;
    "dailyHourlyMinRate": number;
  }>;
};
