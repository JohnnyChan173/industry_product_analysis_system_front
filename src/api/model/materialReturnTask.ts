import { TableBaseInfo } from ".";
import { LineInfo } from "./line";
import { MaterialReturnTaskItemInfo } from "./materialReturnTaskItem";
import { ProductTaskInfo } from "./productTask";
import { UserInfo } from "./user";
import { MaterialReturnTaskStatus } from "/@/enums/model";

/** 物料退料任务单-信息 */
export interface MaterialReturnTaskInfo extends TableBaseInfo {
  id: number;
  returnTaskNo: string;
  startDate: string;
  completeDate: string;
  returnTaskStatus: MaterialReturnTaskStatus;
  productTaskId: number;
  operationUserId: number;
}

/** 物料退料任务单-详情 */
export type MaterialReturnTaskDetail = MaterialReturnTaskInfo & {
  productTaskInfo: ProductTaskInfo & { lineInfo: LineInfo };
  operationUserInfo: UserInfo;
  materialReturnTaskItemList: MaterialReturnTaskItemInfo[];
};

/** 物料退料任务单-提交数据 */
export type MaterialReturnTaskSubmitData = {
  id: number;
  materialReturnTaskItemList: Partial<MaterialReturnTaskItemInfo>[];
};
