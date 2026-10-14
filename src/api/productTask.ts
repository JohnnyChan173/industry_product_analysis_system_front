import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductTaskAddData, ProductTaskDetail, ProductTaskInfo } from "./model/productTask";

enum Api {
  productTaskAdd = "/productTask",
  productTaskDel = "/productTask",
  productTaskEdit = "/productTask",
  productTaskDetail = "/productTask",
  productTaskList = "/productTask/list",
  productTaskStart = "/productTask/start",
  productTaskComplete = "/productTask/complete",
}

/** 生产任务单-新增 */
export function productTaskAdd(data: ProductTaskAddData) {
  return request.post(Api.productTaskAdd, {
    ...data,
  });
}

/** 生产任务单-删除 */
export function productTaskDel(id: number) {
  return request.delete(Api.productTaskDel, {
    params: {
      id,
    },
  });
}

/** 生产任务单-编辑 */
export function productTaskEdit(data: ProductTaskAddData) {
  return request.put(Api.productTaskEdit, {
    ...data,
  });
}

/** 生产任务单-详情 */
export function productTaskDetail(id: number) {
  return request.get<ProductTaskDetail>(Api.productTaskDetail, {
    params: {
      id,
    },
  });
}

/** 生产任务单-分页列表 */
export function productTaskList(params: ListCommonParams & {}) {
  return request.get<ListCommonResData<ProductTaskDetail>>(Api.productTaskList, {
    params,
  });
}

/** 生产任务单-开始 */
export function productTaskStart(id: number) {
  return request.post(Api.productTaskStart, {
    id,
  });
}

/** 生产任务单-完成 */
export function productTaskComplete(id: number) {
  return request.post(Api.productTaskComplete, {
    id,
  });
}
