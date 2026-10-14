import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";
import { MaterialBatchInfo } from "./materialBatch";
import { MaterialReturnTaskInfo } from "./materialReturnTask";
import { MaterialSpecsInfo } from "./materialSpecs";

/** 物料退料任务退料项-信息 */
export interface MaterialReturnTaskItemInfo extends TableBaseInfo {
  id: number;
  value: number;
  materialReturnTaskId: number;
  materialId: number;
  materialSpecsId: number;
  materialBatchId: number;
}

/** 物料退料任务退料项-详情 */
export type MaterialReturnTaskItemDetail = MaterialReturnTaskItemInfo & {
  materialReturnTaskInfo: MaterialReturnTaskInfo;
  materialInfo: MaterialInfo;
  materialSpecsInfo: MaterialSpecsInfo;
  materialBatchInfo: MaterialBatchInfo;
};
