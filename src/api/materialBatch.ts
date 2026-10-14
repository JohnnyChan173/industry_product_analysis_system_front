import { maxPageSize } from "../config";
import request from "../config/request";
import {
  BatchDetectionStatus,
  BatchStatus,
  BatchStockLogOperationType,
  MaterialBatchStockLogOperationTypeSub,
} from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import {
  MaterialBatchDetail,
  MaterialBatchInfo,
  MaterialBatchStockData,
  MaterialBatchStockLogData,
} from "./model/materialBatch";

enum Api {
  materialBatchAdd = "/materialBatch",
  materialBatchDel = "/materialBatch",
  materialBatchEdit = "/materialBatch",
  materialBatchDetail = "/materialBatch",
  materialBatchList = "/materialBatch/list",
  materialBatchStockOut = "/materialBatch/stockOut",
  materialBatchStockIn = "/materialBatch/stockIn",
  materialBatchStockReset = "/materialBatch/stockReset",
  materialBatchStockLogList = "/materialBatch/stockLogList",

  materialBatchBatchReceive = "/materialBatch/batchReceive",
  materialBatchBatchBack = "/materialBatch/batchBack",
}

/** 物料批次-新增 */
export function materialBatchAdd(data: Partial<MaterialBatchInfo>) {
  return request.post(Api.materialBatchAdd, {
    ...data,
  });
}

/** 物料批次-删除 */
export function materialBatchDel(id: number) {
  return request.delete(Api.materialBatchDel, {
    params: {
      id,
    },
  });
}

/** 物料批次-编辑 */
export function materialBatchEdit(data: Partial<MaterialBatchInfo>) {
  return request.put(Api.materialBatchEdit, {
    ...data,
  });
}

/** 物料批次-详情 */
export function materialBatchDetail(id: number) {
  return request.get<MaterialBatchDetail>(Api.materialBatchDetail, {
    params: {
      id,
    },
  });
}

/** 物料批次-分页列表 */
export function materialBatchList(
  params: ListCommonParams & {
    productId?: number;
    productAttrValueIdsList?: string;
    detectionStatus?: BatchDetectionStatus;
    batchStatus?: BatchStatus;
  }
) {
  return request.get<ListCommonResData<MaterialBatchDetail>>(Api.materialBatchList, {
    params,
  });
}

/** 物料批次-全部 */
export async function materialBatchListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await materialBatchList(params);
  return records;
}

/** 物料批次-出库 */
export function materialBatchStockOut(data: MaterialBatchStockData) {
  return request.post(Api.materialBatchStockOut, {
    ...data,
  });
}

/** 物料批次-入库 */
export function materialBatchStockIn(data: MaterialBatchStockData) {
  return request.post(Api.materialBatchStockIn, {
    ...data,
  });
}

/** 物料批次-盘库 */
export function materialBatchStockReset(data: MaterialBatchStockData) {
  return request.post(Api.materialBatchStockReset, {
    ...data,
  });
}

/** 物料批次-库存日志分页列表 */
export function materialBatchStockLogList(
  params: ListCommonParams & {
    materialId?: number;
    materialSpecsId?: number;
    materialBatchId?: number;
    operationType?: BatchStockLogOperationType;
    operationTypeSub?: MaterialBatchStockLogOperationTypeSub;
  }
) {
  return request.get<ListCommonResData<MaterialBatchStockLogData>>(Api.materialBatchStockLogList, {
    params,
  });
}

/** 物料批次-批次接收 */
export function materialBatchBatchReceive(data: { id: number; stockValue: number }) {
  return request.post(Api.materialBatchBatchReceive, {
    ...data,
  });
}

/** 物料批次-批次退回 */
export function materialBatchBatchBack(id: number) {
  return request.post(Api.materialBatchBatchBack, {
    id,
  });
}
