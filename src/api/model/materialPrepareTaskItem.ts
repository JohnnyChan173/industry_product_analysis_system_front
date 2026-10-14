import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";
import { MaterialBatchInfo } from "./materialBatch";
import { MaterialPrepareTaskInfo } from "./materialPrepareTask";
import { MaterialSpecsInfo } from "./materialSpecs";

/** 物料备料任务备料项-信息 */
export interface MaterialPrepareTaskItemInfo extends TableBaseInfo {
  id: number;
  value: number;
  materialPrepareTaskId: number;
  materialId: number;
  materialSpecsId: number;
  materialBatchId: number;
  materialPrepareTaskDemandId: number;
}

/** 物料备料任务备料项-详情 */
export type MaterialPrepareTaskItemDetail = MaterialPrepareTaskItemInfo & {
  materialPrepareTaskInfo: MaterialPrepareTaskInfo;
  materialInfo: MaterialInfo;
  materialSpecsInfo: MaterialSpecsInfo;
  materialBatchInfo: MaterialBatchInfo;
};
