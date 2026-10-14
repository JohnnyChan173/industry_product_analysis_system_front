import { Router } from "vue-router";
import { LineInfo } from "/@/api/model/line";
import { StaffInfo } from "/@/api/model/staff";
import { StationInfo } from "/@/api/model/station";
import { UserInfo } from "/@/api/model/user";
import { Recordable } from "/#/global";
import { FormItemInfo } from "/@/api/model";
import { OrderDetail } from "/@/api/model/order";
import { DictItemInfo } from "/@/api/model/dictItem";
import { TenantInfo } from "/@/api/model/tenant";
import { ProductDetail } from "/@/api/model/product";
import { MaterialDetail, MaterialInfo } from "/@/api/model/material";

/** 用户信息仓库 */
export type UserInfoStateData = Partial<UserInfo> & {
  permissions: string[];
  roles: string[];
  staffInfo?: StaffInfo;
  tenantId?: number;
  tenantInfo?: TenantInfo;
  manageLineId?: number;
};

/** 应用仓库 */
export interface AppStateData {
  siderCollapsed: boolean;
  defaultMenuSpreadAll: boolean;
  loading: boolean;
  router?: Router;
  cachedRoutes: string[];
  globalMessageAllowed: boolean;
  fullscreen: boolean;
}

/** 数据仓库 */
export interface DataStateData {
  /** 字典数据集合 */
  dictItemMap: Recordable<DictItemInfo[]>;
  /** 产品列表 */
  productListAll: ProductDetail[];
  /** 物料列表 */
  materialListAll: MaterialDetail[];
}

/** 打印信息仓库 */
export interface PrintStateData {
  printMode: string;
  printShow: boolean;
  printId: number;
}
