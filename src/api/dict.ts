import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { DictDetail, DictInfo } from "./model/dict";

enum Api {
  dictAdd = "/dict",
  dictDel = "/dict",
  dictEdit = "/dict",
  dictDetail = "/dict",
  dictList = "/dict/list",
}

/** 字典-新增 */
export function dictAdd(data: Partial<DictInfo>) {
  return request.post<number>(Api.dictAdd, {
    ...data,
  });
}

/** 字典-删除 */
export function dictDel(id: number) {
  return request.delete<number>(Api.dictDel, {
    params: {
      id,
    },
  });
}

/** 字典-编辑 */
export function dictEdit(data: Partial<DictInfo>) {
  return request.put<number>(Api.dictEdit, {
    ...data,
  });
}

/** 字典-详情 */
export function dictDetail(id: number) {
  return request.get<DictDetail>(Api.dictDetail, {
    params: {
      id,
    },
  });
}

/** 字典-分页列表 */
export function dictList(params: ListCommonParams) {
  return request.get<ListCommonResData<DictInfo>>(Api.dictList, {
    params,
  });
}
