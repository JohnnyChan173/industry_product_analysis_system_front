import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";
import { MaterialPurchaseInfo } from "./materialPurchase";
import { MaterialSpecsInfo } from "./materialSpecs";
import { SupplierInfo } from "./supplier";
import { UserInfo } from "./user";
import {
  BatchDetectionStatus,
  BatchStatus,
  BatchStockLogOperationType,
  MaterialBatchStockLogOperationTypeSub,
} from "/@/enums/model";

/** 物料批次信息 */
export interface MaterialBatchInfo extends TableBaseInfo {
  id: number;
  batchNo: string;
  detectionStatus: BatchDetectionStatus;
  batchStatus: BatchStatus;
  recordDate: string;
  supplyValue: number;
  stockValue: number;
  memo: string;
  supplierId: number;
  materialBatchDetectionId: number;
  materialPurchaseId: number;
  materialId: number;
  materialSpecsId: number;
}

/** 物料批次详情 */
export type MaterialBatchDetail = MaterialBatchInfo & {
  supplierInfo: SupplierInfo;
  materialPurchaseInfo: MaterialPurchaseInfo;
  materialInfo: MaterialInfo;
  materialSpecsInfo: MaterialSpecsInfo;
};

/** 物料批次详情扩展 */
export type MaterialBatchDetailExpand = MaterialBatchDetail & {
  /** 物料需求项id（组件用） */
  materialPrepareTaskDemandId?: number;

  /** 领量（组件用） */
  prepareValue?: number;
  /** 已领量（组件用） */
  alreadyPrepareValue?: number;

  /** 退量（组件用） */
  returnValue?: number;
  /** 已退量（组件用） */
  alreadyReturnValue?: number;
};

/** 物料批次-库存操作 */
export type MaterialBatchStockData = {
  materialBatchId: number;
  materialId: number;
  materialSpecsId: number;
  operationType: BatchStockLogOperationType;
  operationTypeSub: MaterialBatchStockLogOperationTypeSub;
  value: number;
  memo: string;
};

/** 物料批次-库存日志信息 */
export type MaterialBatchStockLogData = {
  materialBatchId: number;
  materialBatchInfo: MaterialBatchInfo;
  operationType: BatchStockLogOperationType;
  operationTypeSub: MaterialBatchStockLogOperationTypeSub;
  operationDate: string;
  beforeValue: number;
  value: number;
  afterValue: number;
  memo: string;
  materialId: number;
  materialInfo: MaterialInfo;
  materialSpecsId: number;
  materialSpecsInfo: MaterialSpecsInfo;
  materialPrepareTaskId: number;
  materialReturnTaskId: number;
  operationUserId: number;
  operationUserInfo: UserInfo;
};
