import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialDetectionDetail, MaterialDetectionInfo } from "./model/materialDetection";

enum Api {
  materialDetectionAdd = "/materialDetection",
  materialDetectionDel = "/materialDetection",
  materialDetectionEdit = "/materialDetection",
  materialDetectionDetail = "/materialDetection",
  materialDetectionList = "/materialDetection/list",
}

/** 物料检测-新增 */
export function materialDetectionAdd(data: Partial<MaterialDetectionInfo>) {
  return request.post(Api.materialDetectionAdd, {
    ...data,
  });
}

/** 物料检测-删除 */
export function materialDetectionDel(id: number) {
  return request.delete(Api.materialDetectionDel, {
    params: {
      id,
    },
  });
}

/** 物料检测-编辑 */
export function materialDetectionEdit(data: Partial<MaterialDetectionInfo>) {
  return request.put(Api.materialDetectionEdit, {
    ...data,
  });
}

/** 物料检测-详情 */
export function materialDetectionDetail(id: number) {
  return request.get<MaterialDetectionDetail>(Api.materialDetectionDetail, {
    params: {
      id,
    },
  });
}

/** 物料检测-分页列表 */
export function materialDetectionList(
  params: ListCommonParams & {
    materialId?: number;
  }
) {
  return request.get<ListCommonResData<MaterialDetectionDetail>>(Api.materialDetectionList, {
    params,
  });
}

/** 物料检测-全部 */
export async function materialDetectionListAll(materialId: number) {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
    materialId,
  };
  const { records } = await materialDetectionList(params);
  return records;
}
