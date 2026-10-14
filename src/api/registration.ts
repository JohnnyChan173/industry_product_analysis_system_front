import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { RegistrationDetail, RegistrationInfo, RegistrationStaffSignData } from "./model/registration";

enum Api {
  registrationAdd = "/registration",
  registrationDel = "/registration",
  registrationEdit = "/registration",
  registrationEnd = "/registration/end",
  registrationDetail = "/registration",
  registrationDetailGetByLatest = "/registration/getByLatest",
  registrationList = "/registration/list",
  registrationListByProductTaskNo = "/registration/listByProductTaskNo",
  registrationStaffSign = "/registration/staffSign",
  registrationLatestBeatProductNumber = "/registration/latestBeatProductNumber",
  registrationStart = "/registration/start",
}

/** 生产登记-新增 */
export function registrationAdd(data: Partial<RegistrationInfo>) {
  return request.post(Api.registrationAdd, {
    ...data,
  });
}

/** 生产登记-删除 */
export function registrationDel(id: number) {
  return request.delete(Api.registrationDel, {
    params: {
      id,
    },
  });
}

/** 生产登记-编辑 */
export function registrationEdit(data: Partial<RegistrationInfo>) {
  return request.put(Api.registrationEdit, {
    ...data,
  });
}

/** 生产登记-生产结束 */
export function registrationEnd(id: number,actualProductNumber:number) {
  return request.post(Api.registrationEnd, {
    id,
    actualProductNumber,
  });
}

/** 生产登记-详情 */
export function registrationDetail(id: number) {
  return request.get<RegistrationDetail>(Api.registrationDetail, {
    params: {
      id,
    },
  });
}

/** 生产登记-详情-最新 */
export function registrationDetailGetByLatest(lineId: number) {
  return request.get<RegistrationDetail>(Api.registrationDetailGetByLatest, {
    params: {
      lineId,
    },
  });
}

/** 生产登记-分页列表 */
export function registrationList(
  params: ListCommonParams & {
    enterpriseId?: number;
    lineId?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  return request.get<ListCommonResData<RegistrationDetail>>(Api.registrationList, {
    params,
  });
}

/** 生产登记-分页列表全部 */
export async function registrationListAll(data: {
  lineId?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  pageSize?: number;
}) {
  const { records } = await registrationList({
    pageNum: 1,
    pageSize: maxPageSize,
    ...data,
  });

  return records;
}

/** 生产登记-列表-通过生产任务单号 */
export function registrationListByProductTaskNo(productTaskNo: string) {
  return request.get<RegistrationDetail[]>(Api.registrationListByProductTaskNo, {
    params: { productTaskNo },
  });
}

/** 生产登记-员工考勤 */
export function registrationStaffSign(data: RegistrationStaffSignData) {
  return request.post(Api.registrationStaffSign, data);
}

/** 生产登记-最新节拍生产数量 */
export function registrationLatestBeatProductNumber(id: number) {
  return request.get<number>(Api.registrationLatestBeatProductNumber, {
    params: { id },
  });
}

/** 生产登记-最新节拍生产数量 */
export function registrationStart(id: number) {
  return request.post<number>(Api.registrationStart, {
    id,
  });
}
