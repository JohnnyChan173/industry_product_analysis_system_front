import { TableBaseInfo } from ".";
import { UserInfo } from "./user";
import { TenantStatus } from "/@/enums/model";

/** 租户信息 */
export interface TenantInfo extends TableBaseInfo {
  id: number;
  tenantName: string;
  memo: string;
  validDate: string;
  tenantStatus: TenantStatus;
  mainUserId: number;
}

/** 租户详情 */
export type TenantDetail = TenantInfo & {
  mainUserInfo: UserInfo;
  validDate: string;
  checkDateValid: boolean;
  tenantUserTotal: number;
};
