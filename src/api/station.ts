import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams, StationRealtimeStatus } from "./model";
import { StationInfo, StationDetail } from "./model/station";

enum Api {
  stationAdd = "/station",
  stationDel = "/station",
  stationEdit = "/station",
  stationDetail = "/station",
  stationDetailGetByStationUuid = "/station/getByStationUuid",
  stationList = "/station/list",

  stationSort = "/station/sort",
  stationBindModuleUuid = "/station/bindModuleUuid",
  stationUnbindModuleUuid = "/station/unbindModuleUuid",
  stationSetEnablePart = "/station/setEnablePart",
  stationBindStaff = "/station/bindStaff",
  stationUnbindStaff = "/station/unbindStaff",
}

/** 工位-新增 */
export function stationAdd(data: Partial<StationInfo>) {
  return request.post<number>(Api.stationAdd, {
    ...data,
  });
}

/** 工位-删除 */
export function stationDel(id: number) {
  return request.delete<number>(Api.stationDel, {
    params: {
      id,
    },
  });
}

/** 工位-编辑 */
export function stationEdit(data: Partial<StationInfo>) {
  return request.put<number>(Api.stationEdit, {
    ...data,
  });
}

/** 工位-详情-通过uuid */
export function stationDetailGetByStationUuid(stationUuid: string) {
  return request.get<StationDetail>(Api.stationDetailGetByStationUuid, {
    params: {
      stationUuid,
    },
  });
}

/** 工位-详情 */
export function stationDetail(id: number) {
  return request.get<StationDetail>(Api.stationDetail, {
    params: {
      id,
    },
  });
}

/** 工位-分页列表 */
export function stationList(
  params: ListCommonParams & {
    lineId?: number;
  }
) {
  return request.get<ListCommonResData<StationDetail>>(Api.stationList, {
    params,
  });
}

/** 工位-排序 */
export function stationSort(data: Array<{ id: number; stationSort: number }>) {
  return request.post<number>(Api.stationSort, data);
}

/** 工位-绑定模组UID */
export function stationBindModuleUuid(data: { id: number; moduleUuid: string }) {
  return request.post<number>(Api.stationBindModuleUuid, {
    ...data,
  });
}

/** 工位-解绑模组UUID */
export function stationUnbindModuleUuid(id: number) {
  return request.post<number>(Api.stationUnbindModuleUuid, {
    id,
  });
}

/** 工位-设置启用模块 */
export function stationSetEnablePart(data: {
  id: number;
  isUsedAddon: number;
  isUsedWristband: number;
  isUsedGround: number;
  isUsedGeneral: number;
}) {
  return request.post<number>(Api.stationSetEnablePart, {
    ...data,
  });
}

/** 工位-绑定员工 */
export function stationBindStaff(data: { id: number; staffIdList: number[], lineId?: number }) {
  return request.post<number>(Api.stationBindStaff, {
    ...data,
  });
}

/** 工位-解绑员工 */
export function stationUnbindStaff(id: number) {
  return request.post<number>(Api.stationUnbindStaff, {
    id,
  });
}

/** 工位-列表全部 */
export async function stationListAll(lineId?: number) {
  const { records } = await stationList({
    pageNum: 1,
    pageSize: maxPageSize,
    sort: "station_sort asc",
    lineId,
  });

  return records;
}
