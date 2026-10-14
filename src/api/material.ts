import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialAddData, MaterialDetail, MaterialInfo } from "./model/material";

enum Api {
  materialAdd = "/material",
  materialDel = "/material",
  materialEdit = "/material",
  materialDetail = "/material",
  materialList = "/material/list",
}

/** 物料-新增 */
export function materialAdd(data: MaterialAddData) {
  return request.post(Api.materialAdd, {
    ...data,
  });
}

/** 物料-删除 */
export function materialDel(id: number) {
  return request.delete(Api.materialDel, {
    params: {
      id,
    },
  });
}

/** 物料-编辑 */
export function materialEdit(data: MaterialAddData) {
  return request.put(Api.materialEdit, {
    ...data,
  });
}

/** 物料-详情 */
export function materialDetail(id: number) {
  return request.get<MaterialDetail>(Api.materialDetail, {
    params: {
      id,
    },
  });
}

/** 物料-分页列表 */
export function materialList(
  params: ListCommonParams & {
    dictItemMaterialTypeId?: number;
  }
) {
  return request.get<ListCommonResData<MaterialDetail>>(Api.materialList, {
    params,
  });
}

/** 物料-全部 */
export async function materialListAll(data?: { dictItemMaterialTypeId?: number; keyword?: string }) {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
    ...data
  };
  const { records } = await materialList(params);
  return records;
}
