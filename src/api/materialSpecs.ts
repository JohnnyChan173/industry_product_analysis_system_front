import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialSpecsDetail, MaterialSpecsInfo } from "./model/materialSpecs";

enum Api {
  materialSpecsAdd = "/materialSpecs",
  materialSpecsDel = "/materialSpecs",
  materialSpecsEdit = "/materialSpecs",
  materialSpecsDetail = "/materialSpecs",
  materialSpecsList = "/materialSpecs/list",
}

/** 物料规格-新增 */
export function materialSpecsAdd(data: Partial<MaterialSpecsInfo>) {
  return request.post(Api.materialSpecsAdd, {
    ...data,
  });
}

/** 物料规格-删除 */
export function materialSpecsDel(id: number) {
  return request.delete(Api.materialSpecsDel, {
    params: {
      id,
    },
  });
}

/** 物料规格-编辑 */
export function materialSpecsEdit(data: Partial<MaterialSpecsInfo>) {
  return request.put(Api.materialSpecsEdit, {
    ...data,
  });
}

/** 物料规格-详情 */
export function materialSpecsDetail(id: number) {
  return request.get<MaterialSpecsDetail>(Api.materialSpecsDetail, {
    params: {
      id,
    },
  });
}

/** 物料规格-分页列表 */
export function materialSpecsList(
  params: ListCommonParams & {
    mateialId?: number;
  }
) {
  return request.get<ListCommonResData<MaterialSpecsDetail>>(Api.materialSpecsList, {
    params,
  });
}

/** 物料规格-全部 */
export async function materialSpecsListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await materialSpecsList(params);
  return records;
}
