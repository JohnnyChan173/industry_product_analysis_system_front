import { generateApiKeyParams } from "../config/auth";
import request from "../config/request";
import { SignalDataInfo, StationLatestSignalData } from "./model/signal";
import dayjs from "dayjs";
enum Api {
  signalSpecifyDateData = "/signal/specifyDateData",
  signalStationListLatestSignal = "/signal/stationListLatestSignal",
}

/** 信号量-获取指定时段信号量 */
export function signalSpecifyDateData(params: {
  lineId?: number;
  stationId?: number;
  staffId?: number;
  startDate: string;
  endDate: string;
  type?: string;
  count?: number;
  
}) {
  const apiKeyParams = generateApiKeyParams();
  // console.log(params.endDate);
  if (params.endDate == "Invalid Date") {
    params.endDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
  }
  if(new Date(params.startDate).getTime() > new Date(params.endDate).getTime()){
    const temp = params.startDate;
    [params.startDate, params.endDate] = [params.endDate, temp];
  }
  return request.get<SignalDataInfo[]>(Api.signalSpecifyDateData, {
    params: {
      ...apiKeyParams,
      ...params,
    },
  });
}

/** 信号量-获取全部工位最新信号量 */
export function signalStationListLatestSignal(lineId: number) {
  return request.get<StationLatestSignalData[]>(Api.signalStationListLatestSignal, {
    params: {
      lineId,
    },
  });
}
