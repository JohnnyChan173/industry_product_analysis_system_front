import { TableBaseInfo } from ".";
import { LineInfo } from "./line";
import { RegistrationInfo } from "./registration";
import { StaffInfo } from "./staff";
import { StationInfo } from "./station";
import { UserInfo } from "./user";
import { VirtualLineInfo } from "./virtualLine";
import { VirtualStationInfo } from "./virtualStation";
import { StaffSignStatus } from "/@/enums/model";

/** 员工考勤信息 */
export interface StaffSignInfo extends TableBaseInfo {
  id: number;
  startDate: string;
  endDate: string;
  signStatus: StaffSignStatus;
  absentMemo: string;
  productRegistrationId: number;
  lineId: number;
  virtualLineId: number;
  stationId: number;
  virtualStationId: number;
  staffId: number;
  userId: number;
}

/** 员工考勤详情 */
export type StaffSignDetail = StaffSignInfo & {
  productRegistrationInfo: RegistrationInfo;
  lineInfo: LineInfo;
  virtualLineInfo: VirtualLineInfo;
  stationInfo: StationInfo;
  virtualStationInfo: VirtualStationInfo;
  staffInfo: StaffInfo;
  userInfo: UserInfo;
};
