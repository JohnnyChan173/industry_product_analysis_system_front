import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductDetectionDetail, ProductDetectionInfo } from "./model/productDetection";

enum Api {
  productDetectionAdd = "/productDetection",
  productDetectionDel = "/productDetection",
  productDetectionEdit = "/productDetection",
  productDetectionDetail = "/productDetection",
  productDetectionList = "/productDetection/list",
}

/** 产品检测-新增 */
export function productDetectionAdd(data: Partial<ProductDetectionInfo>) {
  return request.post(Api.productDetectionAdd, {
    ...data,
  });
}

/** 产品检测-删除 */
export function productDetectionDel(id: number) {
  return request.delete(Api.productDetectionDel, {
    params: {
      id,
    },
  });
}

/** 产品检测-编辑 */
export function productDetectionEdit(data: Partial<ProductDetectionInfo>) {
  return request.put(Api.productDetectionEdit, {
    ...data,
  });
}

/** 产品检测-详情 */
export function productDetectionDetail(id: number) {
  return request.get<ProductDetectionDetail>(Api.productDetectionDetail, {
    params: {
      id,
    },
  });
}

/** 产品检测-分页列表 */
export function productDetectionList(
  params: ListCommonParams & {
    productId?: number;
  }
) {
  return request.get<ListCommonResData<ProductDetectionDetail>>(Api.productDetectionList, {
    params,
  });
}

/** 产品检测-全部 */
export async function productDetectionListAll(productId: number) {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
    productId,
  };
  const { records } = await productDetectionList(params);
  return records;
}
