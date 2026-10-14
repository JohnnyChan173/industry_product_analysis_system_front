import { TableBaseInfo } from ".";
import { LineInfo } from "./line";
import { StaffInfo } from "./staff";
import { UserInfo } from "./user";
import { CommonCheck } from "/@/enums/model";


/** 工位信息 */
export interface StationInfo extends TableBaseInfo {
  id: number;
  stationNo: string;
  stationUuid: string;
  stationName: string;
  stationSort: number;
  memo: string;
  gatewayUuid: string;
  moduleUuid: string;
  isUsedAddon: CommonCheck;
  isUsedWristband: CommonCheck;
  isUsedGround: CommonCheck;
  isUsedGeneral: CommonCheck;
  isUsedScale: CommonCheck;
  lineId: number;
  staffIdList: number[];
  userId: number;
  staffList: StaffInfo[];
}

/** 工位详情 */
export type StationDetail = StationInfo & {
  lineInfo: LineInfo;
  staffInfo: StaffInfo;
  userInfo: UserInfo;

  // 前端注入
  qrcodeUrl: string;
};
