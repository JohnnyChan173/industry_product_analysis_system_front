import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { LineDetail, LineInfo } from "./model/line";

enum Api {
  lineAdd = "/line",
  lineDel = "/line",
  lineEdit = "/line",
  lineDetail = "/line",
  lineDetailGetByUuid = "/line/getByUuid",
  lineList = "/line/list",

  lineGetManageLineId = "/line/getManageLineId",
}

/** 产线-新增 */
export function lineAdd(data: Partial<LineInfo>) {
  return request.post<number>(Api.lineAdd, {
    ...data,
  });
}

/** 产线-删除 */
export function lineDel(id: number) {
  return request.delete(Api.lineDel, {
    params: {
      id,
    },
  });
}

/** 产线-编辑 */
export function lineEdit(data: Partial<LineInfo>) {
  return request.put(Api.lineEdit, {
    ...data,
  });
}

/** 产线-详情 */
export function lineDetail(id: number) {
  return request.get<LineDetail>(Api.lineDetail, {
    params: {
      id,
    },
  });
}

/** 产线-详情-通过uuid */
export function lineDetailGetByUuid(uuid: string) {
  return request.get<LineDetail>(Api.lineDetailGetByUuid, {
    params: {
      uuid,
    },
  });
}

/** 产线-分页列表 */
export function lineList(params: ListCommonParams & {}) {
  return request.get<ListCommonResData<LineDetail>>(Api.lineList, {
    params,
  });
}

/** 产线-列表全部 */
export async function lineListAll() {
  const { records } = await lineList({
    pageNum: 1,
    pageSize: maxPageSize,
    sort: "id asc",
  });

  return records;
}

/** 产线-获取管理线体id */
export function lineGetManageLineId() {
  return request.get<number>(Api.lineGetManageLineId, {});
}
