import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { CraftProcedureDetail, CraftProcedureInfo } from "./model/craftProcedure";

enum Api {
  craftProcedureAdd = "/craftProcedure",
  craftProcedureDel = "/craftProcedure",
  craftProcedureEdit = "/craftProcedure",
  craftProcedureDetail = "/craftProcedure",
  craftProcedureList = "/craftProcedure/list",
  craftProcedureSort = "/craftProcedure/sort",
}

/** 工艺工序-新增 */
export function craftProcedureAdd(data: Partial<CraftProcedureInfo>[]) {
  return request.post(Api.craftProcedureAdd, data);
}

/** 工艺工序-删除 */
export function craftProcedureDel(ids: string) {
  return request.delete(Api.craftProcedureDel, {
    params: {
      ids,
    },
  });
}

/** 工艺工序-编辑 */
export function craftProcedureEdit(data: Partial<CraftProcedureInfo>[]) {
  return request.put(Api.craftProcedureEdit, data);
}

/** 工艺工序-详情 */
export function craftProcedureDetail(id: number) {
  return request.get<CraftProcedureDetail>(Api.craftProcedureDetail, {
    params: {
      id,
    },
  });
}

/** 工艺工序-分页列表 */
export function craftProcedureList(
  params: ListCommonParams & {
    craftId?: number;
  }
) {
  return request.get<ListCommonResData<CraftProcedureDetail>>(Api.craftProcedureList, {
    params,
  });
}

/** 工艺工序-排序 */
export function craftProcedureSort(data: { id: number; procedureSort: number }[]) {
  return request.post(Api.craftProcedureSort, data);
}

/** 工艺工序-列表全部 */
export async function craftProcedureListAll(craftId?: number) {
  const { records } = await craftProcedureList({
    pageNum: 1,
    pageSize: maxPageSize,
    sort: "procedure_sort asc",
    craftId,
  });

  return records;
}
