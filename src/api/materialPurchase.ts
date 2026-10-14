import request from "../config/request";
import { MaterialPurchaseStatus } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialPurchaseDetail, MaterialPurchaseInfo, MaterialPurchaseAddData } from "./model/materialPurchase";

enum Api {
  materialPurchaseAdd = "/materialPurchase",
  materialPurchaseDel = "/materialPurchase",
  materialPurchaseEdit = "/materialPurchase",
  materialPurchaseDetail = "/materialPurchase",
  materialPurchaseList = "/materialPurchase/list",
  // materialPurchaseStart = "/materialPurchase/start",
  materialPurchaseComplete = "/materialPurchase/complete",
}

/** 物料采购单-新增 */
export function materialPurchaseAdd(data: MaterialPurchaseAddData) {
  return request.post(Api.materialPurchaseAdd, {
    ...data,
  });
}

/** 物料采购单-删除 */
export function materialPurchaseDel(id: number) {
  return request.delete(Api.materialPurchaseDel, {
    params: {
      id,
    },
  });
}

/** 物料采购单-编辑 */
export function materialPurchaseEdit(data: MaterialPurchaseAddData) {
  return request.put(Api.materialPurchaseEdit, {
    ...data,
  });
}

/** 物料采购单-详情 */
export function materialPurchaseDetail(id: number) {
  return request.get<MaterialPurchaseDetail>(Api.materialPurchaseDetail, {
    params: {
      id,
    },
  });
}

/** 物料采购单-分页列表 */
export function materialPurchaseList(
  params: ListCommonParams & {
    purchaseStatus?: MaterialPurchaseStatus;
  }
) {
  return request.get<ListCommonResData<MaterialPurchaseDetail>>(Api.materialPurchaseList, {
    params,
  });
}

// /** 物料采购单-开始 */
// export function materialPurchaseStart(id: number) {
//   return request.post(Api.materialPurchaseStart, {
//     id,
//   });
// }

/** 物料采购单-完成 */
export function materialPurchaseComplete(id: number) {
  return request.post(Api.materialPurchaseComplete, {
    id,
  });
}
