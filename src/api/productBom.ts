import { maxPageSize } from "../config";
import request from "../config/request";
import { CommonCheck } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductBomDetail, ProductBomInfo, ProductBomStockCheckParam } from "./model/productBom";

enum Api {
  productBomAdd = "/productBom",
  productBomDel = "/productBom",
  productBomEdit = "/productBom",
  productBomDetail = "/productBom",
  productBomListAll = "/productBom/listAll",

  productBomStockCheck = "/productBom/stockCheck",
}

/** 产品BOM-新增 */
export function productBomAdd(data: Partial<ProductBomInfo>) {
  return request.post(Api.productBomAdd, {
    ...data,
  });
}

/** 产品BOM-删除 */
export function productBomDel(id: number) {
  return request.delete(Api.productBomDel, {
    params: {
      id,
    },
  });
}

/** 产品BOM-编辑 */
export function productBomEdit(data: Partial<ProductBomInfo>) {
  return request.put(Api.productBomEdit, {
    ...data,
  });
}

/** 产品BOM-详情 */
export function productBomDetail(id: number) {
  return request.get<ProductBomDetail>(Api.productBomDetail, {
    params: {
      id,
    },
  });
}

/** 产品BOM-全部列表 */
export function productBomListAll(productId: number) {
  return request.get<ProductBomDetail[]>(Api.productBomListAll, {
    params: { productId },
  });
}

/** 产品BOM-库存检测 */
export function productBomStockCheck(params: ProductBomStockCheckParam) {
  return request.get<CommonCheck>(Api.productBomStockCheck, {
    params,
  });
}
