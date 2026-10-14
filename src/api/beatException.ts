import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
export type BeatExceptionInfo = {
  id?: number;
  exceedAvgCount: number;
  exceedAvgBeatMax: number;
  standardBeat: number;
  virtualStationId: number;
  sumAvg: number;
  singleConSum: number;
  registrationId: number;
  exDesc: string;
};

enum Api {
  beatException = "/beatException",
  beatExceptionList = "/beatException/list",
  beatExceptionAdd = "/beatException/add",
  beatExceptionUpdate = "/beatException/update",
  beatExceptionFindByRegIdAndVsId = "/beatException/findByRegIdAndVsId",
  addOutOfAverage = "/beatException/addOutOfAverage",
  getOutOfAverage = "/beatException/getOutOfAverage",
}

export function beatExceptionList(params: ListCommonParams) {
  return request.get<ListCommonResData<BeatExceptionInfo>>(Api.beatExceptionList, {
    params,
  });
}

export function addOutOfAverage(data: {
  registrationId: number; //登记id
  virtualStationId: number; //虚拟工位id
  currentBeatCount: number; //当前次数
}) {
  return request.post<number>(Api.addOutOfAverage, {
    ...data,
  });
}

export function beatExceptionUpdate(data: BeatExceptionInfo) {
  return request.put<number>(Api.beatExceptionUpdate, {
    ...data,
  });
}

export function getOutOfAverage(data: {
  "registrationId": number; //登记id
  "virtualStationId": number; //虚拟工位id
}) {
  return request.get<BeatExceptionInfo>(Api.getOutOfAverage, {
    params: {
      ...data,
    },
  });
}

export function beatExceptionAdd(data: {
  exceedAvgCount: number;
  standardBeat: number;
  virtualStationId: number;
  sumAvg: number;
  singleConSum: number;
  registrationId: number;
  exDesc: string;
}) {
  return request.post<number>(Api.beatExceptionAdd, {
    ...data,
  });
}
