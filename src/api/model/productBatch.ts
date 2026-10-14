import { TableBaseInfo } from ".";
import { ProductInfo } from "./product";
import { ProductAttrValueInfo } from "./productAttrValue";
import { ProductTaskDetail, ProductTaskInfo } from "./productTask";
import { UserInfo } from "./user";
import {
  BatchDetectionStatus,
  BatchStatus,
  BatchStockLogOperationType,
  ProductBatchStockLogOperationTypeSub,
} from "/@/enums/model";

/** 产品批次信息 */
export interface ProductBatchInfo extends TableBaseInfo {
  id: number;
  batchNo: string;
  detectionStatus: BatchDetectionStatus;
  recordDate: string;
  batchStatus: BatchStatus;
  supplyValue: number;
  stockValue: number;
  memo: string;
  productBatchDetectionId: number;
  productTaskId: number;
  productId: number;
  productAttrValueIdsList: number[];
}

/** 产品批次详情 */
export type ProductBatchDetail = ProductBatchInfo & {
  productTaskInfo: ProductTaskDetail;
  productInfo: ProductInfo;
  productAttrValueList: ProductAttrValueInfo[];
};

/** 产品批次详情扩展 */
export type ProductBatchDetailExpand = ProductBatchDetail & {
  /** 产品出库需求项ID（组件用） */
  productDeliveryTaskDemandId?: number;

  /** 领量（组件用） */
  prepareValue?: number;
  /** 已领量（组件用） */
  alreadyPrepareValue?: number;

  // /** 退量（组件用） */
  // returnValue?: number;
  // /** 已退量（组件用） */
  // alreadyReturnValue?: number;
};

/** 产品批次-库存操作 */
export type ProductBatchStockData = {
  productBatchId: number;
  productId: number;
  productAttrValueIdsList: number[];
  operationType: BatchStockLogOperationType;
  operationTypeSub: ProductBatchStockLogOperationTypeSub;
  value: number;
  memo: string;
};

/** 产品批次-库存日志信息 */
export type ProductBatchStockLogData = {
  id: number;
  productBatchId: number;
  productBatchInfo: ProductBatchInfo;
  operationType: BatchStockLogOperationType;
  operationTypeSub: ProductBatchStockLogOperationTypeSub;
  operationDate: string;
  beforeValue: number;
  value: number;
  afterValue: number;
  memo: string;
  productId: number;
  productInfo: ProductInfo;
  productAttrValueIdsList: number[];
  productAttrValueList: ProductAttrValueInfo[];
  productDeliveryTaskId: number;
  operationUserId: number;
  operationUserInfo: UserInfo;
};
