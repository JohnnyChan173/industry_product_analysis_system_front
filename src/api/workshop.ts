import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { WorkshopDetail, WorkshopInfo } from "./model/workshop";

enum Api {
  workshopAdd = "/workshop",
  workshopDel = "/workshop",
  workshopEdit = "/workshop",
  workshopDetail = "/workshop",
  workshopList = "/workshop/list",
}

/** 车间-新增 */
export function workshopAdd(data: Partial<WorkshopInfo>) {
  return request.post(Api.workshopAdd, {
    ...data,
  });
}

/** 车间-删除 */
export function workshopDel(id: number) {
  return request.delete(Api.workshopDel, {
    params: {
      id,
    },
  });
}

/** 车间-编辑 */
export function workshopEdit(data: Partial<WorkshopInfo>) {
  return request.put(Api.workshopEdit, {
    ...data,
  });
}

/** 车间-详情 */
export function workshopDetail(id: number) {
  return request.get<WorkshopDetail>(Api.workshopDetail, {
    params: {
      id,
    },
  });
}

/** 车间-分页列表 */
export function workshopList(params: ListCommonParams & {}) {
  return request.get<ListCommonResData<WorkshopDetail>>(Api.workshopList, {
    params,
  });
}

/** 车间-列表全部 */
export async function workshopListAll() {
  const { records } = await workshopList({
    pageNum: 1,
    pageSize: maxPageSize,
  });

  return records;
}
