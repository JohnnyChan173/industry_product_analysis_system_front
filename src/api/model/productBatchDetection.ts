import { TableBaseInfo } from ".";
import { ProductBatchInfo } from "./productBatch";
import { BatchDetectionConclusion, DetectionMode } from "/@/enums/model";

/** 产品批次检测信息 */
export interface ProductBatchDetectionInfo extends TableBaseInfo {
  id: number;
  detectionMode: DetectionMode;
  detectionDate: string;
  detectionJson: string;
  spotcheckValue: number;
  allcheckQualifiedValue: number;
  allcheckUnqualifiedValue: number;
  detectionConclusion: BatchDetectionConclusion;
  memo: string;
  productBatchId: number;
}

/** 产品批次检测详情 */
export type ProductBatchDetectionDetail = ProductBatchDetectionInfo & {
  productBatchInfo: ProductBatchInfo;
};
