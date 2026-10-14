import { TableBaseInfo } from ".";
import { ProductAttrValueInfo } from "./productAttrValue";

/** 产品选项信息 */
export interface ProductAttrInfo extends TableBaseInfo {
  id: number;
  attrName: string;
  attrSort: number;
  productId: number;
}

/** 产品选项详情 */
export type ProductAttrDetail = ProductAttrInfo & {
  productAttrValueList: ProductAttrValueInfo[];
};

/** 产品选项-创建数据 */
export type ProductAttrAddData = Partial<ProductAttrInfo> & {
  productAttrValueList: Partial<ProductAttrValueInfo>[];
};

/** 产品选项详情扩展（value 产品添加组件用） */
export type ProductAttrDetailExpand = ProductAttrDetail & Partial<{
  selectAttrValueId: number;
}>;
