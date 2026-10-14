import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { SupplierDetail, SupplierInfo } from "./model/supplier";

enum Api {
  supplierAdd = "/supplier",
  supplierDel = "/supplier",
  supplierEdit = "/supplier",
  supplierDetail = "/supplier",
  supplierList = "/supplier/list",
}

/**  供应商-新增 */
export function supplierAdd(data: Partial<SupplierInfo>) {
  return request.post(Api.supplierAdd, {
    ...data,
  });
}

/**  供应商-删除 */
export function supplierDel(id: number) {
  return request.delete(Api.supplierDel, {
    params: {
      id,
    },
  });
}

/**  供应商-编辑 */
export function supplierEdit(data: Partial<SupplierInfo>) {
  return request.put(Api.supplierEdit, {
    ...data,
  });
}

/**  供应商-详情 */
export function supplierDetail(id: number) {
  return request.get<SupplierDetail>(Api.supplierDetail, {
    params: {
      id,
    },
  });
}

/**  供应商-分页列表 */
export function supplierList(params: ListCommonParams & {}) {
  return request.get<ListCommonResData<SupplierDetail>>(Api.supplierList, {
    params,
  });
}

/**  供应商-全部 */
export async function supplierListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await supplierList(params);
  return records;
}
