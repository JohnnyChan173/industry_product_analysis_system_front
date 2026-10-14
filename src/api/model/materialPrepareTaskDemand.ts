import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";
import { MaterialBatchDetailExpand, MaterialBatchInfo } from "./materialBatch";
import { MaterialPrepareTaskInfo } from "./materialPrepareTask";
import { MaterialSpecsInfo } from "./materialSpecs";

/** 物料备料任务需求项-信息 */
export interface MaterialPrepareTaskDemandInfo extends TableBaseInfo {
  id: number;
  demandValue: number;
  materialPrepareTaskId: number;
  materialId: number;
  materialSpecsId: number;
}

/** 物料备料任务需求项-详情 */
export type MaterialPrepareTaskDemandDetail = MaterialPrepareTaskDemandInfo & {
  materialPrepareTaskInfo: MaterialPrepareTaskInfo;
  materialInfo: MaterialInfo;
  materialSpecsInfo: MaterialSpecsInfo;
  materialBatchList: MaterialBatchDetailExpand[];
};
