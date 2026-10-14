import request from "../config/request";
import { ListCommonParams, ListCommonResData } from "./model";
import { ESOPInfo } from "./model/esop";

enum Api {
  esopAdd = "/stationSopMapping",
  esopDel = "/stationSopMapping",
  esopEdit = "/stationSopMapping",
  esopList = "/stationSopMapping/pageList",
  esopDetail = "/stationSopMapping/findByStationUuid",
}

export function esopAdd(data: ESOPInfo[]) {
  return request.post<ESOPInfo[]>(Api.esopAdd, data);
}

export function esopDel(id: number) {
  return request.delete(Api.esopDel, {
    params: {
      id,
    },
  });
}

export function esopEdit(data: ESOPInfo[]) {
  return request.put(Api.esopEdit, data);
}

export function esopList(params: ListCommonParams) {
  return request.get<ListCommonResData<ESOPInfo>>(Api.esopList, {
    params,
  });
}

export function esopDetail(stationUuid: string) {
  const params = new URLSearchParams();
  params.append("stationUuid", stationUuid);
  return request.post(Api.esopDetail, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}
