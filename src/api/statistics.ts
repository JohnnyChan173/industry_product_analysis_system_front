import request from "../config/request";
import { StatisticsPlatformBasicData, StatisticsWorkshopData, monthlyAchievement, dailyOutPut, monthlyLineBalance, dailyLineBalance } from "./model/statistics";

enum Api {
  statisticsWorkshop = "/statistics/workshop",
  statisticsPlatformBasic = "/statistics/platformBasic",
  statisticsMonthlyAchievement = "/statistics/monthlyAchievement",
  statisticsDailyOutPut = "/statistics/dailyOutPut",
  statisticsMonthlyLineBalance = "/statistics/monthlyLineBalance",
  statisticsDailyLineBalance = "/statistics/dailyLineBalance",
}

/** 数据统计-车间 */
export function statisticsWorkshop(data: { workshopId: number; startDate: string; endDate: string }) {
  return request.get<StatisticsWorkshopData>(Api.statisticsWorkshop, {
    params: data,
  });
}

/** 数据统计-平台基础 */
export function statisticsPlatformBasic(data: { startDate: string; endDate: string }) {
  return request.get<StatisticsPlatformBasicData>(Api.statisticsPlatformBasic, {
    params: data,
  });
}
// 月度产能达成率
export function monthlyAchievement(data: { month: string;}) {
  return request.get<monthlyAchievement[]>(Api.statisticsMonthlyAchievement, {
    params: data,
  });
}
// 日产能
export function dailyOutPut(data: { month: string;virtualLineId: number }) {
  return request.get<dailyOutPut>(Api.statisticsDailyOutPut, {
    params: data,
  });
}

// 月度产线平衡
export function monthlyLineBalance(data: { month: string;}) {
  return request.get<monthlyLineBalance[]>(Api.statisticsMonthlyLineBalance, {
    params: data,
  });
}

// 日产线平衡
export function dailyLineBalance(data: { month: string;virtualLineId: number }) {
  return request.get<dailyLineBalance>(Api.statisticsDailyLineBalance, {
    params: data,
  });
}
