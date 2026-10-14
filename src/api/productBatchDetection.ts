import { maxPageSize } from "../config";
import request from "../config/request";
import { BatchDetectionConclusion } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductBatchDetectionDetail, ProductBatchDetectionInfo } from "./model/productBatchDetection";

enum Api {
  productBatchDetectionAdd = "/productBatchDetection",
  productBatchDetectionDel = "/productBatchDetection",
  productBatchDetectionEdit = "/productBatchDetection",
  productBatchDetectionDetail = "/productBatchDetection",
  productBatchDetectionList = "/productBatchDetection/list",
}

/** 产品批次检测-新增 */
export function productBatchDetectionAdd(data: Partial<ProductBatchDetectionInfo>) {
  return request.post(Api.productBatchDetectionAdd, {
    ...data,
  });
}

/** 产品批次检测-删除 */
export function productBatchDetectionDel(id: number) {
  return request.delete(Api.productBatchDetectionDel, {
    params: {
      id,
    },
  });
}

/** 产品批次检测-编辑 */
export function productBatchDetectionEdit(data: Partial<ProductBatchDetectionInfo>) {
  return request.put(Api.productBatchDetectionEdit, {
    ...data,
  });
}

/** 产品批次检测-详情 */
export function productBatchDetectionDetail(id: number) {
  return request.get<ProductBatchDetectionDetail>(Api.productBatchDetectionDetail, {
    params: {
      id,
    },
  });
}

/** 产品批次检测-分页列表 */
export function productBatchDetectionList(
  params: ListCommonParams & {
    detectionConclusion?: BatchDetectionConclusion;
  }
) {
  return request.get<ListCommonResData<ProductBatchDetectionDetail>>(Api.productBatchDetectionList, {
    params,
  });
}

/** 产品批次检测-全部 */
export async function productBatchDetectionListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await productBatchDetectionList(params);
  return records;
}
