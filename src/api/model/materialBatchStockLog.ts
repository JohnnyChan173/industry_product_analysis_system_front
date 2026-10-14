import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";
import { MaterialBatchInfo } from "./materialBatch";
import { MaterialPrepareTaskInfo } from "./materialPrepareTask";
import { MaterialReturnTaskInfo } from "./materialReturnTask";
import { MaterialSpecsInfo } from "./materialSpecs";
import { UserInfo } from "./user";
import { BatchStockLogOperationType, MaterialBatchStockLogOperationTypeSub } from "/@/enums/model";

/**物料批次库存日志-信息 */
export interface MaterialBatchStockLogInfo extends TableBaseInfo {
  id: number;
  operationType: BatchStockLogOperationType;
  operationTypeSub: MaterialBatchStockLogOperationTypeSub;
  operationDate: string;
  beforeValue: number;
  value: number;
  afterValue: number;
  memo: string;
  materialId: number;
  materialSpecsId: number[];
  materialBatchId: number;
  materialPrepareTaskId: number;
  materialReturnTaskId: number;
  operationUserId: number;
}

/**物料批次库存日志-详情 */
export type MaterialBatchStockLogDetail = MaterialBatchStockLogInfo & {
  materialInfo: MaterialInfo;
  materialSpecsInfo: MaterialSpecsInfo;
  materialBatchInfo: MaterialBatchInfo;
  materialPrepareTaskInfo: MaterialPrepareTaskInfo;
  materialReturnTaskInfo: MaterialReturnTaskInfo;
  operationUserId: UserInfo;
};
