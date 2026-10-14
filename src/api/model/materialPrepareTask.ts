import { TableBaseInfo } from ".";
import { LineInfo } from "./line";
import { MaterialPrepareTaskDemandDetail } from "./materialPrepareTaskDemand";
import { MaterialPrepareTaskItemDetail, MaterialPrepareTaskItemInfo } from "./materialPrepareTaskItem";
import { ProductTaskInfo } from "./productTask";
import { UserInfo } from "./user";
import { MaterialPrepareTaskStatus } from "/@/enums/model";

/** 物料备料任务单-信息 */
export interface MaterialPrepareTaskInfo extends TableBaseInfo {
  id: number;
  prepareTaskNo: string;
  startDate: string;
  completeDate: string;
  prepareTaskStatus: MaterialPrepareTaskStatus;
  productTaskId: number;
  operationUserId: number;
}

/** 物料备料任务单-详情 */
export type MaterialPrepareTaskDetail = MaterialPrepareTaskInfo & {
  productTaskInfo: ProductTaskInfo & { lineInfo: LineInfo };
  operationUserInfo: UserInfo;
  materialPrepareTaskDemandList: MaterialPrepareTaskDemandDetail[];
  materialPrepareTaskItemList: MaterialPrepareTaskItemDetail[];
};

/** 物料备料任务单-提交数据 */
export type MaterialPrepareTaskSubmitData = {
  id: number;
  materialPrepareTaskItemList: Partial<MaterialPrepareTaskItemInfo>[];
};
