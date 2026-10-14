import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { VirtualLineDetail, VirtualLineInfo } from "./model/virtualLine";

enum Api {
  virtualLineAdd = "/virtualLine",
  virtualLineDel = "/virtualLine",
  virtualLineEdit = "/virtualLine",
  virtualLineDetail = "/virtualLine",
  virtualLineList = "/virtualLine/list",
  virtualLineListByLineId = "/virtualLine/listByLineId",

  virtualLineGetByProductParam = "/virtualLine/getByProductParam",
}

/** 虚拟产线-新增 */
export function virtualLineAdd(data: Partial<VirtualLineInfo>) {
  return request.post(Api.virtualLineAdd, {
    ...data,
  });
}

/** 虚拟产线-删除 */
export function virtualLineDel(id: number) {
  return request.delete(Api.virtualLineDel, {
    params: {
      id,
    },
  });
}

/** 虚拟产线-编辑 */
export function virtualLineEdit(data: Partial<VirtualLineInfo>) {
  return request.put(Api.virtualLineEdit, {
    ...data,
  });
}

/** 虚拟产线-详情 */
export function virtualLineDetail(id: number) {
  return request.get<VirtualLineDetail>(Api.virtualLineDetail, {
    params: {
      id,
    },
  });
}

/** 虚拟产线-分页列表 */
export function virtualLineList(
  params: ListCommonParams & {
    lineId?: number;
  }
) {
  return request.get<ListCommonResData<VirtualLineDetail>>(Api.virtualLineList, {
    params,
  });
}

/* 虚拟产线-列表全部 */
// export async function virtualLineListAll(lineId?: number) {
//   const { records } = await virtualLineList({
//     pageNum: 1,
//     pageSize: maxPageSize,
//     lineId,
//   });

//   return records;
// }

// 虚拟产线-列表-通过线体id
export function virtualLineListByLineId(lineId: number) {
  return request.get<VirtualLineDetail[]>(Api.virtualLineListByLineId, {
    params: {
      lineId,
    },
  });
}

/** 虚拟产线-详情 */
export function virtualLineGetByProductParam(productId: number, lineId: number) {
  return request.get<VirtualLineDetail>(Api.virtualLineGetByProductParam, {
    params: {
      productId,
      lineId,
    },
  });
}
