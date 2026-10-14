import { TableBaseInfo } from ".";

/** 产品选项值信息 */
export interface ProductAttrValueInfo extends TableBaseInfo {
  id: number;
  uuid: string;
  attrValue: string;
  attrValueSort: number;
  productAttrId: number;
}

/** 产品选项值详情 */
export type ProductAttrValueDetail = ProductAttrValueInfo & {};
