import { maxPageSize } from "../config";
import request from "../config/request";
import { BatchDetectionConclusion } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialBatchDetectionDetail, MaterialBatchDetectionInfo } from "./model/materialBatchDetection";

enum Api {
  materialBatchDetectionAdd = "/materialBatchDetection",
  materialBatchDetectionDel = "/materialBatchDetection",
  materialBatchDetectionEdit = "/materialBatchDetection",
  materialBatchDetectionDetail = "/materialBatchDetection",
  materialBatchDetectionList = "/materialBatchDetection/list",
}

/** 物料批次检测-新增 */
export function materialBatchDetectionAdd(data: Partial<MaterialBatchDetectionInfo>) {
  return request.post(Api.materialBatchDetectionAdd, {
    ...data,
  });
}

/** 物料批次检测-删除 */
export function materialBatchDetectionDel(id: number) {
  return request.delete(Api.materialBatchDetectionDel, {
    params: {
      id,
    },
  });
}

/** 物料批次检测-编辑 */
export function materialBatchDetectionEdit(data: Partial<MaterialBatchDetectionInfo>) {
  return request.put(Api.materialBatchDetectionEdit, {
    ...data,
  });
}

/** 物料批次检测-详情 */
export function materialBatchDetectionDetail(id: number) {
  return request.get<MaterialBatchDetectionDetail>(Api.materialBatchDetectionDetail, {
    params: {
      id,
    },
  });
}

/** 物料批次检测-分页列表 */
export function materialBatchDetectionList(
  params: ListCommonParams & {
    detectionConclusion?: BatchDetectionConclusion;
  }
) {
  return request.get<ListCommonResData<MaterialBatchDetectionDetail>>(Api.materialBatchDetectionList, {
    params,
  });
}

/** 物料批次检测-全部 */
export async function materialBatchDetectionListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await materialBatchDetectionList(params);
  return records;
}
