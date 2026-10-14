import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";
import { MaterialBatchInfo } from "./materialBatch";
import { MaterialSpecsInfo } from "./materialSpecs";

/** 物料采购单采购项-信息 */
export interface MaterialPurchaseItemInfo extends TableBaseInfo {
  id: number;
  uuid: string;
  itemSort: number;
  price: number;
  value: number;
  materialId: number;
  materialSpecsId: number;
  materialBatchId: number;
}

/** 物料采购单采购项-详情 */
export type MaterialPurchaseItemDetail = MaterialPurchaseItemInfo & {
  materialInfo: MaterialInfo;
  materialSpecsInfo: MaterialSpecsInfo;
  materialBatchInfo: MaterialBatchInfo;
};
