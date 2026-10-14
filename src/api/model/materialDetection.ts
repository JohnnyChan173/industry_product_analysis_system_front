import { DetectionInfo, TableBaseInfo } from ".";
import { MaterialInfo } from "./material";

/** 物料检测项-信息 */
export type MaterialDetectionInfo = DetectionInfo &
  TableBaseInfo & {
    id: number;
    materialId: number;
  };

/** 物料检测项-详情 */
export type MaterialDetectionDetail = MaterialDetectionInfo & {
  materialInfo: MaterialInfo;
};
