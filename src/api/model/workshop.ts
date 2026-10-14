import { TableBaseInfo } from ".";
import { UserInfo } from "./user";
import { CommonCheck } from "/@/enums/model";

/** 车间信息 */
export interface WorkshopInfo extends TableBaseInfo {
  id: number;
  workshopNo: string;
  workshopName: string;
  workshopDesc: string;
  userId: CommonCheck;
  staffId: number;
  staffName: string;
  staffNo: string;
}

/** 车间详情 */
export type WorkshopDetail = WorkshopInfo & {
  userInfo: UserInfo;
};
