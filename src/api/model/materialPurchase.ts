import { TableBaseInfo } from ".";
import { MaterialBatchInfo } from "./materialBatch";
import { MaterialPurchaseItemDetail, MaterialPurchaseItemInfo } from "./materialPurchaseItem";
import { SupplierInfo } from "./supplier";
import { MaterialPurchaseStatus } from "/@/enums/model";

/** 物料采购单-信息 */
export interface MaterialPurchaseInfo extends TableBaseInfo {
  id: number;
  purchaseNo: string;
  completeDate: string;
  purchaseStatus: MaterialPurchaseStatus;
  memo: string;
  supplierId: number;
}

/** 物料采购单-详情 */
export type MaterialPurchaseDetail = MaterialPurchaseInfo & {
  supplierInfo: SupplierInfo;
  materialPurchaseItemList: MaterialPurchaseItemDetail[];
  materialBatchIdList: number[];
  materialBatchList: MaterialBatchInfo[];
};

/** 物料采购单-创建数据 */
export type MaterialPurchaseAddData = Partial<MaterialPurchaseInfo> & {
  materialPurchaseItemList: MaterialPurchaseItemInfo[];
};
