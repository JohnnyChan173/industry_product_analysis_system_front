import { TableBaseInfo } from ".";
import { ProductInfo } from "./product";
import { ProductAttrValueInfo } from "./productAttrValue";
import { ProductBatchInfo } from "./productBatch";
import { ProductDeliveryTaskInfo } from "./productDeliveryTask";
import { ProductDeliveryTaskDemandInfo } from "./productDeliveryTaskDemand";

/** 产品出库任务单出库项-信息 */
export interface ProductDeliveryTaskItemInfo extends TableBaseInfo {
  id: number;
  deliveryValue: number;
  productId: number;
  productAttrValueIdsList: number[];
  productBatchId: number;
  productDeliveryTaskId: number;
  productDeliveryTaskDemandId: number;
}

/** 产品出库任务单出库项-详情 */
export type ProductDeliveryTaskItemDetail = ProductDeliveryTaskItemInfo & {
  productInfo: ProductInfo;
  productAttrValueList: ProductAttrValueInfo[];
  productBatchInfo: ProductBatchInfo;
  productDeliveryTaskInfo: ProductDeliveryTaskInfo;
  productDeliveryTaskDemandInfo: ProductDeliveryTaskDemandInfo;
};
