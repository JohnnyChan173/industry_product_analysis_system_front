import request from "../config/request";
import { TenantStatus } from "/@/enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { TenantInfo, TenantDetail } from "./model/tenant";

enum Api {
  tenantAdd = "/tenant",
  tenantDel = "/tenant",
  tenantEdit = "/tenant",
  tenantDetail = "/tenant",
  tenantList = "/tenant/list",
  tenantFreeze = "/tenant/freeze",
  tenantFreezeCancel = "/tenant/freezeCancel",
}

/** 租户-新增 */
export function tenantAdd(data: Partial<TenantInfo>) {
  return request.post<number>(Api.tenantAdd, {
    ...data,
  });
}

/** 租户-删除 */
export function tenantDel(id: number) {
  return request.delete<number>(Api.tenantDel, {
    params: {
      id,
    },
  });
}

/** 租户-编辑 */
export function tenantEdit(data: Partial<TenantInfo>) {
  return request.put<number>(Api.tenantEdit, {
    ...data,
  });
}

/** 租户-详情 */
export function tenantDetail(id: number) {
  return request.get<TenantDetail>(Api.tenantDetail, {
    params: {
      id,
    },
  });
}

/** 租户-分页列表 */
export function tenantList(
  params: ListCommonParams & {
    tenantStatus?: TenantStatus;
  }
) {
  return request.get<ListCommonResData<TenantDetail>>(Api.tenantList, {
    params,
  });
}

/** 租户-冻结 */
export function tenantFreeze(id: number) {
  return request.post<string>(Api.tenantFreeze, {
    id,
  });
}

/** 租户-取消冻结 */
export function tenantFreezeCancel(id: number) {
  return request.post<string>(Api.tenantFreezeCancel, {
    id,
  });
}
