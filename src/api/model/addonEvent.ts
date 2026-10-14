import { TableBaseInfo } from ".";
import { LineInfo } from "./line";
import { ProductInfo } from "./product";
import { RegistrationInfo } from "./registration";
import { StaffInfo } from "./staff";
import { StationInfo } from "./station";
import { UserInfo } from "./user";
import { VirtualLineInfo } from "./virtualLine";
import { VirtualStationInfo, VirtualStationDetail } from "./virtualStation";
import { AddonEventStatus, AddonEventType } from "/@/enums/model";

/** 安灯事件信息 */
export interface AddonEventInfo extends TableBaseInfo {
  id: number;
  eventNo: string;
  happenDate: string;
  receiveDate: string;
  dictEventTypeId: number;
  eventType: AddonEventType;
  eventStatus: AddonEventStatus;
  handleDate: string;
  handleMethod: string;
  eventStaffId: number;
  userId: number;
  productId: number;
  lineId: number;
  virtualLineId: number;
  stationId: number;
  virtualStationId: number;
  registrationId: number;
}

/** 安灯事件详情 */
export type AddonEventDetail = AddonEventInfo & {
  eventStaffInfo: StaffInfo;
  userInfo: UserInfo;
  productInfo: ProductInfo;
  lineInfo: LineInfo;
  virtualLineInfo: VirtualLineInfo;
  stationInfo: StationInfo;
  virtualStationInfo: VirtualStationDetail;
  registrationInfo: RegistrationInfo;
};
