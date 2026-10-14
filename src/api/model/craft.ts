import { TableBaseInfo } from ".";
import { CraftProcedureInfo } from "./craftProcedure";
import { ProductInfo } from "./product";
import { UserInfo } from "./user";

/** 工艺信息 */
export interface CraftInfo extends TableBaseInfo {
  id: number;
  craftNo: string;
  craftName: string;
  userId: number;
  craftProductIds: number[];
  craftProcedureIds: number[];
}

/** 工艺详情 */
export type CraftDetail = CraftInfo & {
  userInfo: UserInfo;
  craftProductList: ProductInfo[];
  craftProcedureList: CraftProcedureInfo[];
};
