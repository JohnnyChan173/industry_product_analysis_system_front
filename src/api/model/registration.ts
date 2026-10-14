import { TableBaseInfo } from ".";
import { CraftInfo } from "./craft";
import { LineInfo } from "./line";
import { ProductInfo } from "./product";
import { ProductAttrValueInfo } from "./productAttrValue";
import { ProductTaskInfo } from "./productTask";
import { StaffSignDetail, StaffSignInfo } from "./staffSign";
import { UserInfo } from "./user";
import { VirtualLineInfo } from "./virtualLine";
import { RegistrationStatus, StaffSignStatus } from "/@/enums/model";

/** 生产登记信息 */
export interface RegistrationInfo extends TableBaseInfo {
  id: number;
  registrationNo: string;
  planProductNumber: number;
  beatProductNumber: number;
  actualProductNumber: number;
  memo: string;
  filePathList: string[];
  startDate: string;
  endDate: string;
  registrationStatus: RegistrationStatus;
  taskId: number;
  lineId: number;
  productId: number;
  productAttrValueIdsList: number[];
  craftId: number;
  virtualLineId: number;
  userId: number;
}

/** 生产登记详情 */
export type RegistrationDetail = RegistrationInfo & {
  taskInfo: ProductTaskInfo;
  lineInfo: LineInfo;
  productInfo: ProductInfo;
  productAttrValueList: ProductAttrValueInfo[];
  craftInfo: CraftInfo;
  virtualLineInfo: VirtualLineInfo;
  userInfo: UserInfo;
  staffSignList: StaffSignDetail[];
};

/** 生产登记-员工考勤数据 */
export type RegistrationStaffSignData = {
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
};
