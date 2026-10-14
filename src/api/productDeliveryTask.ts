import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import {
  ProductDeliveryTaskAddData,
  ProductDeliveryTaskDetail,
  ProductDeliveryTaskInfo,
  ProductDeliveryTaskSubmitData,
} from "./model/productDeliveryTask";

enum Api {
  productDeliveryTaskAdd = "/productDeliveryTask",
  productDeliveryTaskDel = "/productDeliveryTask",
  productDeliveryTaskEdit = "/productDeliveryTask",
  productDeliveryTaskDetail = "/productDeliveryTask",
  productDeliveryTaskList = "/productDeliveryTask/list",
  productDeliveryTaskStart = "/productDeliveryTask/start",
  productDeliveryTaskSomeComplete = "/productDeliveryTask/someComplete",
  productDeliveryTaskComplete = "/productDeliveryTask/complete",
}

/** 产品出库任务单-新增 */
export function productDeliveryTaskAdd(data: ProductDeliveryTaskAddData) {
  return request.post(Api.productDeliveryTaskAdd, {
    ...data,
  });
}

/** 产品出库任务单-删除 */
export function productDeliveryTaskDel(id: number) {
  return request.delete(Api.productDeliveryTaskDel, {
    params: {
      id,
    },
  });
}

/** 产品出库任务单-编辑 */
export function productDeliveryTaskEdit(data: ProductDeliveryTaskAddData) {
  return request.put(Api.productDeliveryTaskEdit, {
    ...data,
  });
}

/** 产品出库任务单-详情 */
export function productDeliveryTaskDetail(id: number) {
  return request.get<ProductDeliveryTaskDetail>(Api.productDeliveryTaskDetail, {
    params: {
      id,
    },
  });
}

/** 产品出库任务单-分页列表 */
export function productDeliveryTaskList(params: ListCommonParams & {}) {
  return request.get<ListCommonResData<ProductDeliveryTaskDetail>>(Api.productDeliveryTaskList, {
    params,
  });
}

/** 产品出库任务单-开始 */
export function productDeliveryTaskStart(id: number) {
  return request.post(Api.productDeliveryTaskStart, {
    id,
  });
}

/** 产品出库任务单-部分完成 */
export function productDeliveryTaskSomeComplete(data: ProductDeliveryTaskSubmitData) {
  return request.post(Api.productDeliveryTaskSomeComplete, {
    ...data,
  });
}


/** 产品出库任务单-完成 */
export function productDeliveryTaskComplete(data: ProductDeliveryTaskSubmitData) {
  return request.post(Api.productDeliveryTaskComplete, {
    ...data,
  });
}
