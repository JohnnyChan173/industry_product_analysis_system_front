import { TableBaseInfo } from ".";
import { DictItemInfo } from "./dictItem";
import { MaterialSpecsDetail, MaterialSpecsInfo } from "./materialSpecs";

/** 物料-信息 */
export interface MaterialInfo extends TableBaseInfo {
  id: number;
  materialNo: string;
  materialName: string;
  dictItemMaterialTypeId: number;
  dictItemMaterialUnitId: number;
}

/** 物料-详情 */
export type MaterialDetail = MaterialInfo & {
  dictItemMaterialTypeInfo: DictItemInfo;
  dictItemMaterialUnitInfo: DictItemInfo;
  materialSpecsList: MaterialSpecsDetail[];
};

/** 物料-创建数据 */
export type MaterialAddData = Partial<MaterialInfo> & {
  materialSpecsList: MaterialSpecsInfo[];
};
