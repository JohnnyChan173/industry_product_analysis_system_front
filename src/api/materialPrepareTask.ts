import request from "../config/request";
import { MaterialPrepareTaskStatus } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialPrepareTaskDetail, MaterialPrepareTaskSubmitData } from "./model/materialPrepareTask";

enum Api {
  materialPrepareTaskDetail = "/materialPrepareTask",
  materialPrepareTaskList = "/materialPrepareTask/list",
  materialPrepareTaskStart = "/materialPrepareTask/start",
  materialPrepareTaskSomeComplete = "/materialPrepareTask/someComplete",
  materialPrepareTaskComplete = "/materialPrepareTask/complete",
}

/** 物料备料任务单-详情 */
export function materialPrepareTaskDetail(id: number) {
  return request.get<MaterialPrepareTaskDetail>(Api.materialPrepareTaskDetail, {
    params: {
      id,
    },
  });
}

/** 物料备料任务单-分页列表 */
export function materialPrepareTaskList(
  params: ListCommonParams & {
    prepareTaskStatus?: MaterialPrepareTaskStatus;
  }
) {
  return request.get<ListCommonResData<MaterialPrepareTaskDetail>>(Api.materialPrepareTaskList, {
    params,
  });
}

/** 物料备料任务单-开始 */
export function materialPrepareTaskStart(id: number) {
  return request.post(Api.materialPrepareTaskStart, {
    id,
  });
}

/** 物料备料任务单-部分完成 */
export function materialPrepareTaskSomeComplete(data: MaterialPrepareTaskSubmitData) {
  return request.post(Api.materialPrepareTaskSomeComplete, {
    ...data,
  });
}

/** 物料备料任务单-完成 */
export function materialPrepareTaskComplete(data: MaterialPrepareTaskSubmitData) {
  return request.post(Api.materialPrepareTaskComplete, {
    ...data,
  });
}
