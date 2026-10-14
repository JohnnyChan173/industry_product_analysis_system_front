import { TableBaseInfo } from ".";
import { StaffSignDetail, StaffSignInfo } from "./staffSign";
import { SysDictDataInfo } from "./sysDict";
import { UserInfo } from "./user";
import { StaffType } from "/@/enums/model";

/** 员工信息 */
export interface StaffInfo extends TableBaseInfo {
  id: number;
  staffNo: string;
  staffName: string;
  staffType: StaffType;
  memo: string;
  userId: number;
  latestSignId: number;
  roleKeys: string[];
}

/** 员工详情 */
export type StaffDetail = StaffInfo & {
  userInfo: UserInfo;
  latestSignInfo: StaffSignDetail;
};
