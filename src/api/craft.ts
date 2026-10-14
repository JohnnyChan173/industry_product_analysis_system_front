import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { CraftDetail, CraftInfo } from "./model/craft";

enum Api {
  craftAdd = "/craft",
  craftDel = "/craft",
  craftEdit = "/craft",
  craftDetail = "/craft",
  craftList = "/craft/list",
}

/** 工艺-新增 */
export function craftAdd(data: Partial<CraftInfo>) {
  return request.post<number>(Api.craftAdd, {
    ...data,
  });
}

/** 工艺-删除 */
export function craftDel(id: number) {
  return request.delete(Api.craftDel, {
    params: {
      id,
    },
  });
}

/** 工艺-编辑 */
export function craftEdit(data: Partial<CraftInfo>) {
  return request.put(Api.craftEdit, {
    ...data,
  });
}

/** 工艺-详情 */
export function craftDetail(id: number) {
  return request.get<CraftDetail>(Api.craftDetail, {
    params: {
      id,
    },
  });
}

/** 工艺-分页列表 */
export function craftList(
  params: ListCommonParams & {
    dictItemProductTypeId?: number;
  }
) {
  return request.get<ListCommonResData<CraftDetail>>(Api.craftList, {
    params,
  });
}

/** 工艺-列表全部 */
export async function craftListAll() {
  const { records } = await craftList({
    pageNum: 1,
    pageSize: maxPageSize,
    sort: "id asc",
  });

  return records;
}
