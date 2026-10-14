import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { DictItemInfo } from "./model/dictItem";

enum Api {
  dictItemAdd = "/dictItem",
  dictItemDel = "/dictItem",
  dictItemEdit = "/dictItem",
  dictItemDetail = "/dictItem",
  dictItemList = "/dictItem/list",
  dictItemListByDictNo = "/dictItem/listByDictNo",
  dictItemImport = "/dictItem/import",
}

/** 字典数据-新增 */
export function dictItemAdd(data: Partial<DictItemInfo>) {
  return request.post<number>(Api.dictItemAdd, {
    ...data,
  });
}

/** 字典数据-删除 */
export function dictItemDel(id: number) {
  return request.delete<number>(Api.dictItemDel, {
    params: {
      id,
    },
  });
}

/** 字典数据-编辑 */
export function dictItemEdit(data: Partial<DictItemInfo>) {
  return request.put<number>(Api.dictItemEdit, {
    ...data,
  });
}

/** 字典数据-详情 */
export function dictItemDetail(id: number) {
  return request.get<DictItemInfo>(Api.dictItemDetail, {
    params: {
      id,
    },
  });
}

/** 字典数据-分页列表 */
export function dictItemList(
  params: ListCommonParams & {
    dictId?: number;
  }
) {
  return request.get<ListCommonResData<DictItemInfo>>(Api.dictItemList, {
    params: {
      sort: "item_sort asc",
      ...params,
    },
  });
}

/** 字典数据-列表-根据字典编号 */
export function dictItemListByDictNo(dictNo: string) {
  return request.get<DictItemInfo[]>(Api.dictItemListByDictNo, {
    params: {
      dictNo,
    },
  });
}

/** 字典数据-列表全部 */
// export async function dictItemListAll(keyword?: string) {
//   const { records } = await dictItemList({
//     pageNum: 1,
//     pageSize: maxPageSize,
//     keyword,
//   });

//   return records;
// }

/** 字典数据-导入 */
export function dictItemImport(formData: FormData) {
  return request.post<number>(Api.dictItemImport, formData);
}
