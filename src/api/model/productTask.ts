import { TableBaseInfo } from ".";
import { LineDetail, LineInfo } from "./line";
import { MaterialPrepareTaskInfo } from "./materialPrepareTask";
import { MaterialPrepareTaskDemandInfo } from "./materialPrepareTaskDemand";
import { MaterialReturnTaskInfo } from "./materialReturnTask";
import { ProductInfo } from "./product";
import { ProductAttrValueInfo } from "./productAttrValue";
import { ProductTaskStatus, ProductTaskType } from "/@/enums/model";

/** 生产任务单信息 */
export interface ProductTaskInfo extends TableBaseInfo {
  id: number;
  taskNo: string;
  customName: string;
  taskType: ProductTaskType;
  saleOrderNo: string;
  productNumber: number;
  deliverDate: string;
  startDate: string;
  planCompleteDate: string;
  completeDate: string;
  memo: string;
  taskStatus: ProductTaskStatus;
  productId: number;
  productAttrValueIdsList: number[];
  materialPrepareTaskId: number;
  materialReturnTaskId: number;
  lineId: number;
}

/** 生产任务单详情 */
export type ProductTaskDetail = ProductTaskInfo & {
  registrationActualProductNumber: number;
  registrationTotal: number;
  productInfo: ProductInfo;
  productAttrValueList: ProductAttrValueInfo[];
  materialPrepareTaskInfo: MaterialPrepareTaskInfo;
  materialReturnTaskInfo: MaterialReturnTaskInfo;
  lineInfo: LineDetail;
  productBatchIdList: number[];
};

/** 生产任务单创建 */
export type ProductTaskAddData = Partial<ProductTaskInfo> & {
  materialPrepareTaskDemandList: MaterialPrepareTaskDemandInfo[];
};
