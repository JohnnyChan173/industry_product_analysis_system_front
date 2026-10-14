import request from "../config/request";
import { AddonEventStatus } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { AddonEventDetail, AddonEventInfo } from "./model/addonEvent";

enum Api {
  addonEventHandle = "/addonEvent/handle",
  addonEventInvalid = "/addonEvent/Invalid",
  addonEventDel = "/addonEvent",
  addonEventDetail = "/addonEvent",
  addonEventList = "/addonEvent/list",
  addonEventListByRegistrationId = "/addonEvent/listByRegistrationId",
}

/** 安灯事件-处理 */
export function addonEventAdd(data: { id: number; handleMethod: string }) {
  return request.post(Api.addonEventHandle, {
    ...data,
  });
}

/** 安灯事件-无效事件 */
export function addonEventInvalid(id: number) {
  return request.post(Api.addonEventDel, {
    id,
  });
}

/** 安灯事件-删除 */
export function addonEventDel(id: number) {
  return request.delete(Api.addonEventDel, {
    params: {
      id,
    },
  });
}

/** 安灯事件-详情 */
export function addonEventDetail(id: number) {
  return request.get<AddonEventDetail>(Api.addonEventDetail, {
    params: {
      id,
    },
  });
}

/** 安灯事件-分页列表 */
export function addonEventList(
  params: ListCommonParams & {
    dictEventTypeId?: number;
    eventStatus: AddonEventStatus;
  }
) {
  return request.get<ListCommonResData<AddonEventDetail>>(Api.addonEventList, {
    params,
  });
}

/** 安灯事件-列表通过登记id */
export function addonEventListByRegistrationId(registrationId: number) {
  return request.get<AddonEventDetail[]>(Api.addonEventListByRegistrationId, {
    params: {
      registrationId,
    },
  });
}
