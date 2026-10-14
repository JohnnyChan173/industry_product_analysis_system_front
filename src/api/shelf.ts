import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { ShelfDetail, ShelfInfo } from "./model/shelf";

enum Api {
  shelfAdd = "/shelf",
  shelfDel = "/shelf",
  shelfEdit = "/shelf",
  shelfDetail = "/shelf",
  shelfList = "/shelf/list",
}

/** 货位-新增 */
export function shelfAdd(data: Partial<ShelfInfo>) {
  return request.post(Api.shelfAdd, {
    ...data,
  });
}

/** 货位-删除 */
export function shelfDel(id: number) {
  return request.delete(Api.shelfDel, {
    params: {
      id,
    },
  });
}

/** 货位-编辑 */
export function shelfEdit(data: Partial<ShelfInfo>) {
  return request.put(Api.shelfEdit, {
    ...data,
  });
}

/** 货位-详情 */
export function shelfDetail(id: number) {
  return request.get<ShelfDetail>(Api.shelfDetail, {
    params: {
      id,
    },
  });
}

/** 货位-分页列表 */
export function shelfList(
  params: ListCommonParams & {
    shelfNo?: string;
    productId?: number;
    productNo?: string;
    productName?: string;
  }
) {
  return request.get<ListCommonResData<ShelfDetail>>(Api.shelfList, {
    params,
  });
}
