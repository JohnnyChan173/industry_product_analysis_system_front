import { TableBaseInfo } from ".";
import { DictItemDetail } from "./dictItem";
import { ProductAttrDetail } from "./productAttr";

/** 产品信息 */
export interface ProductInfo extends TableBaseInfo {
  id: number;
  productNo: string;
  productModel: string;
  productName: string;
  productWeight: number;
  dictItemProductTypeId: number;
}

/** 产品详情 */
export type ProductDetail = ProductInfo & {
  dictItemProductTypeInfo: DictItemDetail;
  productAttrList: ProductAttrDetail[];
};
