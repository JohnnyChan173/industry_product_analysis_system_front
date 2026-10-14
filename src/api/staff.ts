import { maxPageSize } from "../config";
import request from "../config/request";
import { StaffSignStatus, StaffType } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { StaffInfo, StaffDetail } from "./model/staff";

enum Api {
  staffAdd = "/staff",
  staffDel = "/staff",
  staffEdit = "/staff",
  staffDetail = "/staff",
  staffList = "/staff/list",
  staffWorkshopList = "/staff/workshop",
  eventStationStaffFindByLineId = "/eventStationStaff/findByLineId",
  eventStationBatchUpdate = "/eventStationStaff/batchUpdate",
  staffUpdateBatch = "/staff/updateBatch",
  staffImport = "/staff/importStaff",

}

/** 员工-新增 */
export function staffAdd(data: Partial<StaffInfo>) {
  return request.post<number>(Api.staffAdd, {
    ...data,
  });
}

/** 员工-删除 */
export function staffDel(id: number) {
  return request.delete<number>(Api.staffDel, {
    params: {
      id,
    },
  });
}

/** 员工-编辑 */
export function staffEdit(data: Partial<StaffInfo>) {
  return request.put<number>(Api.staffEdit, {
    ...data,
  });
}

/** 员工-详情 */
export function staffDetail(id: number) {
  return request.get<StaffDetail>(Api.staffDetail, {
    params: {
      id,
    },
  });
}

/** 员工-分页列表 */
export function staffList(
  params: ListCommonParams & {
    staffType?: StaffType;
    staffSignStatus?: StaffSignStatus;
  }
) {
  return request.get<ListCommonResData<StaffDetail>>(Api.staffList, {
    params,
  });
}

/** 员工-列表全部 */
export async function staffListAll(staffType?: StaffType) {
  const { records } = await staffList({
    pageNum: 1,
    pageSize: maxPageSize,
    staffType,
  });

  return records;
}

/** 员工-分页列表-车间车间 */
export function staffWorkshopList(data: { id: number; workshopId: number }[]) {
  return request.put<ListCommonResData<StaffDetail>>(Api.staffWorkshopList, data);
}

export function eventStationStaffFindByLineId(lineId: number) {
  return request.get<ListCommonResData<StaffDetail>>(Api.eventStationStaffFindByLineId, {
    params: {
      lineId,
    },
  });
}

/** 员工-批量更新 */
export function eventStationBatchUpdate(
  data: { id: number; eventStaffType: number; eventStaffId: number; eventStationId: number; eventLineId: number }[]
) {
  return request.post<number>(Api.eventStationBatchUpdate, data);
}
export function staffImport(formData: FormData) {
  return request.post<number>(Api.staffImport, formData);
}

/** 员工-批量更新 */
export function staffUpdateBatch(data: Partial<StaffInfo>[]) {
  return request.put<number>(Api.staffUpdateBatch, data);
}
