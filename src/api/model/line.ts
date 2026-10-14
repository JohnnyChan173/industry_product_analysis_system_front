import { TableBaseInfo } from ".";
import { ProductDetail } from "./product";
import { RegistrationDetail, RegistrationInfo } from "./registration";
import { StaffInfo } from "./staff";
import { UserInfo } from "./user";
import { WorkshopInfo } from "./workshop";
import { CommonCheck, LineType } from "/@/enums/model";

/** 产线信息 */
export interface LineInfo extends TableBaseInfo {
  id: number;
  lineType: LineType;
  lineNo: string;
  lineName: string;
  lineUuid: string;
  imagePaths: string[];
  beatMin: number;
  beatBase: number;
  beatMax: number;
  lineLeaderStaffId: number;
  latestRegistrationId: number;
  latestRegistrationProductId: number;
  latestRegistrationProductAttrValueIdsList: number[];
  materialEventStaffId: number;
  deviceEventStaffId: number;
  qualityEventStaffId: number;
  otherEventStaffId: number;
  workshopId: number;
  userId: number;
  multipleEventStaffId: number;
}

/** 产线详情 */
export type LineDetail = LineInfo & {
  lineLeaderStaffInfo: StaffInfo;
  latestRegistrationInfo: RegistrationDetail;
  // latestRegistrationProductInfo: ProductDetail;
  materialEventStaffInfo: StaffInfo;
  deviceEventStaffInfo: StaffInfo;
  qualityEventStaffInfo: StaffInfo;
  otherEventStaffInfo: StaffInfo;
  workshopInfo: WorkshopInfo;
  userInfo: UserInfo;

  // 服务端扩展参数
  // todayProcessCharacterSpotcheck: CommonCheck;
  // todayProductCharacterSpotcheck: CommonCheck;
  // unableComplete: CommonCheck;
  // unableCompleteFilePaths: string[];
  // unableCompleteMemo: string;

  // 前端注入参数
  lineQrcodeUrl: string;
};
