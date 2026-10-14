import { TableBaseInfo } from ".";
import { ProductInfo } from "./product";

/** 货位信息 */
export interface ShelfInfo extends TableBaseInfo {
  id: number;
  shelfNo: string;
  shelfSort: number;
  shelfStock: number;
  productId: number;
}

/** 货位详情 */
export type ShelfDetail = ShelfInfo & Pick<ProductInfo, "productNo" | "productName">;
