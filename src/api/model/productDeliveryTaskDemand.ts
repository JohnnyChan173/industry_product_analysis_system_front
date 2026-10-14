import { TableBaseInfo } from ".";
import { ProductInfo } from "./product";
import { ProductAttrValueInfo } from "./productAttrValue";
import { ProductBatchDetailExpand, ProductBatchInfo } from "./productBatch";
import { ProductDeliveryTaskInfo } from "./productDeliveryTask";

/** 产品出库任务单需求-信息 */
export interface ProductDeliveryTaskDemandInfo extends TableBaseInfo {
  id: number;
  uuid: string;
  demandSort: number;
  demandValue: number;
  productDeliveryTaskId: number;
  productId: number;
  productAttrValueIdsList: number[];

    /** 产品库存（组件用） */
  stockValueTotal?: number;
}

/** 产品出库任务单需求-详情 */
export type ProductDeliveryTaskDemandDetail = ProductDeliveryTaskDemandInfo & {
  productDeliveryTaskInfo: ProductDeliveryTaskInfo;
  productInfo: ProductInfo;
  productAttrValueList: ProductAttrValueInfo[];
  productBatchList: ProductBatchDetailExpand[];


};
