import { TableBaseInfo } from ".";
import { MaterialInfo } from "./material";

/** 物料规格-信息 */
export interface MaterialSpecsInfo extends TableBaseInfo {
  id: number;
  uuid: string;
  specsSort: number;
  specsName: string;
  specsNo: string;
  drawNo: string;
  memo: string;
  materialId: number;
}

/** 物料规格-详情 */
export type MaterialSpecsDetail = MaterialSpecsInfo & {
  materialInfo: MaterialInfo;
};
