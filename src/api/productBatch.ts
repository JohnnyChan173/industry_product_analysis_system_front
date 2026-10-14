import { maxPageSize } from "../config";
import request from "../config/request";
import {
  BatchDetectionStatus,
  BatchStatus,
  BatchStockLogOperationType,
  ProductBatchStockLogOperationTypeSub,
} from "../enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import {
  ProductBatchDetail,
  ProductBatchInfo,
  ProductBatchStockData,
  ProductBatchStockLogData,
} from "./model/productBatch";

enum Api {
  productBatchAdd = "/productBatch",
  productBatchDel = "/productBatch",
  productBatchEdit = "/productBatch",
  productBatchDetail = "/productBatch",
  productBatchList = "/productBatch/list",
  productBatchStockOut = "/productBatch/stockOut",
  productBatchStockIn = "/productBatch/stockIn",
  productBatchStockReset = "/productBatch/stockReset",
  productBatchStockLogList = "/productBatch/stockLogList",

  productBatchBatchReceive = "/productBatch/batchReceive",
  productBatchBatchBack = "/productBatch/batchBack",
  productBatchImport = "/productBatch/import",
}

/** 产品批次-新增 */
export function productBatchAdd(data: Partial<ProductBatchInfo>) {
  return request.post(Api.productBatchAdd, {
    ...data,
  });
}

/** 产品批次-删除 */
export function productBatchDel(id: number) {
  return request.delete(Api.productBatchDel, {
    params: {
      id,
    },
  });
}

/** 产品批次-编辑 */
export function productBatchEdit(data: Partial<ProductBatchInfo>) {
  return request.put(Api.productBatchEdit, {
    ...data,
  });
}

/** 产品批次-详情 */
export function productBatchDetail(id: number) {
  return request.get<ProductBatchDetail>(Api.productBatchDetail, {
    params: {
      id,
    },
  });
}

/** 产品批次-分页列表 */
export function productBatchList(
  params: ListCommonParams & {
    productId?: number;
    productAttrValueIdsList?: string;
    detectionStatus?: BatchDetectionStatus;
    batchStatus?: BatchStatus;
  }
) {

  return request.get<ListCommonResData<ProductBatchDetail>>(Api.productBatchList, {
    params,
  });
}

/** 产品批次-全部 */
export async function productBatchListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await productBatchList(params);
  return records;
}

/** 产品批次-出库 */
export function productBatchStockOut(data: ProductBatchStockData) {
  return request.post(Api.productBatchStockOut, {
    ...data,
  });
}

/** 产品批次-入库 */
export function productBatchStockIn(data: ProductBatchStockData) {
  return request.post(Api.productBatchStockIn, {
    ...data,
  });
}

/** 产品批次-盘库 */
export function productBatchStockReset(data: ProductBatchStockData) {
  return request.post(Api.productBatchStockReset, {
    ...data,
  });
}

/** 产品批次-库存日志分页列表 */
export function productBatchStockLogList(
  params: ListCommonParams & {
    productId?: number;
    productAttrValueIdsList?: string;
    productBatchId?: number;
    operationType?: BatchStockLogOperationType;
    operationTypeSub?: ProductBatchStockLogOperationTypeSub;
  }
) {
  return request.get<ListCommonResData<ProductBatchStockLogData>>(Api.productBatchStockLogList, {
    params,
  });
}

/** 产品批次-批次接收 */
export function productBatchBatchReceive(data: { id: number; stockValue: number }) {
  return request.post(Api.productBatchBatchReceive, {
    ...data,
  });
}

/** 产品批次-批次退回 */
export function productBatchBatchBack(id: number) {
  return request.post(Api.productBatchBatchBack, {
    id,
  });
}


/** 产品批次-导入 */
export function productBatchImport(data: FormData) {
  return request.post(Api.productBatchImport, {
    ...data,
  });
}
