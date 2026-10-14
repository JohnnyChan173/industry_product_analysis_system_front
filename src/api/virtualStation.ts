import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { VirtualStationDetail, VirtualStationInfo } from "./model/virtualStation";

enum Api {
  virtualStationAdd = "/virtualStation",
  virtualStationDel = "/virtualStation",
  virtualStationEdit = "/virtualStation",
  virtualStationDetail = "/virtualStation",
  virtualStationList = "/virtualStation/list",
  updateIsFilter = "/virtualStation/updateIsFilter",
  removerVirtualStation = "/virtualStation/removerVirtualStation",
}

/** 产线-新增 */
export function virtualStationAdd(data: Partial<VirtualStationInfo[]>) {
  return request.post(Api.virtualStationAdd, data);
}

/** 产线-删除 */
export function virtualStationDel(ids: string) {
  return request.delete(Api.virtualStationDel, {
    params: {
      ids,
    },
  });
}

/** 产线-编辑 */
export function virtualStationEdit(data: Partial<VirtualStationInfo[]>) {
  return request.put(Api.virtualStationEdit, data);
}

/** 产线-详情 */
export function virtualStationDetail(id: number) {
  return request.get<VirtualStationDetail>(Api.virtualStationDetail, {
    params: {
      id,
    },
  });
}

/** 产线-分页列表 */
export function virtualStationList(
  params: ListCommonParams & {
    virtualLineId: number;
  }
) {
  return request.get<ListCommonResData<VirtualStationDetail>>(Api.virtualStationList, {
    params,
  });
}

/** 产线-更新是否过滤 */
export async function updateIsFilter(data: {id: number, isFilter: number}[]) {
  await request.post(Api.updateIsFilter, data);

}

export async function removerVirtualStation(data: {ids: number[]}) {
  await request.delete(Api.removerVirtualStation, {
    params: data,
  });
}
