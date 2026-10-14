import { DetectionInfo, TableBaseInfo } from ".";
import { ProductInfo } from "./product";

/** 产品检测项-信息 */
export type ProductDetectionInfo = DetectionInfo &
  TableBaseInfo & {
    id: number;
    productId: number;
  };

/** 产品检测项-详情 */
export type ProductDetectionDetail = ProductDetectionInfo & {
};
