import { TableBaseInfo } from ".";
import { MaterialDetail, MaterialInfo } from "./material";
import { MaterialSpecsInfo } from "./materialSpecs";
import { ProductInfo } from "./product";
import { ProductAttrInfo } from "./productAttr";
import { ProductAttrValueInfo } from "./productAttrValue";

/** 产品BOM-信息 */
export interface ProductBomInfo extends TableBaseInfo {
  id: number;
  bomSort: number;
  productAttrId: number;
  productAttrValueId: number;
  materialId: number;
  materialSpecsId: number;
  productId: number;
  value: number;
  batchStockTotal: number;
}

/** 产品BOM-详情 */
export type ProductBomDetail = ProductBomInfo & {
  productAttrInfo: ProductAttrInfo;
  productAttrValueInfo: ProductAttrValueInfo;
  materialInfo: MaterialDetail;
  materialSpecsInfo: MaterialSpecsInfo;
  productInfo: ProductInfo;
};

/** 产品BOM-库存检测参数 */
export type ProductBomStockCheckParam = {
  productId: number;
  productAttrValueIdsList?: string;
  number: number;
};

/** 产品BOM-详情扩展（注入样式、库存底色） */
export type ProductBomDetailExpand = ProductBomDetail &
  Partial<{
    batchStockTotalValid?: boolean;
  }>;
