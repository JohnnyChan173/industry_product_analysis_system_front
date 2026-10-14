import { TableBaseInfo } from ".";

/** 供应商-信息 */
export interface SupplierInfo extends TableBaseInfo {
  id: number;
  supplierNo: string;
  supplierName: string;
  leader: string;
  contract: string;
  memo: string;
}

/** 供应商-详情 */
export type SupplierDetail = SupplierInfo & {};
