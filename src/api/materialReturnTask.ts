import request from "../config/request";
import { MaterialReturnTaskStatus } from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { MaterialReturnTaskDetail, MaterialReturnTaskSubmitData } from "./model/materialReturnTask";

enum Api {
  materialReturnTaskDetail = "/materialReturnTask",
  materialReturnTaskList = "/materialReturnTask/list",
  materialReturnTaskStart = "/materialReturnTask/start",
  materialReturnTaskSomeComplete = "/materialReturnTask/someComplete",
  materialReturnTaskComplete = "/materialReturnTask/complete",
}

/** 物料退料任务单-详情 */
export function materialReturnTaskDetail(id: number) {
  return request.get<MaterialReturnTaskDetail>(Api.materialReturnTaskDetail, {
    params: {
      id,
    },
  });
}

/** 物料退料任务单-分页列表 */
export function materialReturnTaskList(
  params: ListCommonParams & {
    prepareTaskStatus?: MaterialReturnTaskStatus;
  }
) {
  return request.get<ListCommonResData<MaterialReturnTaskDetail>>(Api.materialReturnTaskList, {
    params,
  });
}

/** 物料备料任务单-开始 */
export function materialReturnTaskStart(id: number) {
  return request.post(Api.materialReturnTaskStart, {
    id,
  });
}

/** 物料退料任务单-部分完成 */
export function materialReturnTaskSomeComplete(data: MaterialReturnTaskSubmitData) {
  return request.post(Api.materialReturnTaskSomeComplete, {
    ...data,
  });
}

/** 物料退料任务单-完成 */
export function materialReturnTaskComplete(data: MaterialReturnTaskSubmitData) {
  return request.post(Api.materialReturnTaskComplete, {
    ...data,
  });
}
