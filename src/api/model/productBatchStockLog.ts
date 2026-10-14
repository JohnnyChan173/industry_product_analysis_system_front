import { TableBaseInfo } from ".";
import { ProductInfo } from "./product";
import { ProductAttrValueInfo } from "./productAttrValue";
import { ProductBatchInfo } from "./productBatch";
import { ProductDeliveryTaskInfo } from "./productDeliveryTask";
import { ProductTaskInfo } from "./productTask";
import { UserInfo } from "./user";
import {
  BatchDetectionConclusion,
  BatchStockLogOperationType,
  ProductBatchStockLogOperationTypeSub,
} from "/@/enums/model";

// /**产品批次库存日志-信息 */
// export interface ProductBatchStockLogInfo extends TableBaseInfo {
//   id: number;
//   operationType: BatchStockLogOperationType;
//   operationTypeSub: ProductBatchStockLogOperationTypeSub;
//   operationDate: string;
//   beforeValue: number;
//   value: number;
//   afterValue: number;
//   memo: string;
//   productId: number;
//   productAttrValueIdsList: number[];
//   productBatchId: number;
//   productDeliveryTaskId: number;
//   operationUserId: number;
// }

// /**产品批次库存日志-详情 */
// export type ProductBatchStockLogDetail = ProductBatchStockLogInfo & {
//   productInfo: ProductInfo;
//   productAttrValueList: ProductAttrValueInfo[];
//   productBatchInfo: ProductBatchInfo;
//   productDeliveryTaskInfo: ProductDeliveryTaskInfo;
//   operationUserInfo: UserInfo;
// };
