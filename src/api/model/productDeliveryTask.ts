import { TableBaseInfo } from ".";
import { ProductDeliveryTaskDemandDetail, ProductDeliveryTaskDemandInfo } from "./productDeliveryTaskDemand";
import { ProductDeliveryTaskItemDetail, ProductDeliveryTaskItemInfo } from "./productDeliveryTaskItem";
import { UserInfo } from "./user";
import { ProductDeliveryTaskStatus, ProductDeliveryTaskType } from "/@/enums/model";

/** 产品出库任务单-信息 */
export interface ProductDeliveryTaskInfo extends TableBaseInfo {
  id: number;
  deliveryTaskNo: string;
  deliveryType: ProductDeliveryTaskType;
  saleOrderNo: string;
  memo: string;
  startDate: string;
  completeDate: string;
  deliveryTaskStatus: ProductDeliveryTaskStatus;
  operationUserId: number;
}

/** 产品出库任务单-详情 */
export type ProductDeliveryTaskDetail = ProductDeliveryTaskInfo & {
  operationUserInfo: UserInfo;
  productDeliveryTaskDemandList: ProductDeliveryTaskDemandDetail[];
  productDeliveryTaskItemList: ProductDeliveryTaskItemDetail[];
};

/** 产品出库任务单-创建数据 */
export type ProductDeliveryTaskAddData = Partial<ProductDeliveryTaskInfo> & {
  productDeliveryTaskDemandList: ProductDeliveryTaskDemandInfo[];
};

/** 产品出库任务单-提交数据 */
export type ProductDeliveryTaskSubmitData = {
  id: number;
  productDeliveryTaskItemList: Partial<ProductDeliveryTaskItemInfo>[];
};
