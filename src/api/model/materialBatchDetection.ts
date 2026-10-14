import { TableBaseInfo } from ".";
import { MaterialBatchInfo } from "./materialBatch";
import { BatchDetectionConclusion, DetectionMode } from "/@/enums/model";

/** 物料批次检测信息 */
export interface MaterialBatchDetectionInfo extends TableBaseInfo {
  id: number;
  detectionMode: DetectionMode;
  detectionDate: string;
  detectionJson: string;
  spotcheckValue: number;
  allcheckQualifiedValue: number;
  allcheckUnqualifiedValue: number;
  detectionConclusion: BatchDetectionConclusion;
  memo: string;
  materialBatchId: number;
}

/** 物料批次检测详情 */
export type MaterialBatchDetectionDetail = MaterialBatchDetectionInfo & {
  materialBatchInfo: MaterialBatchInfo;
};
