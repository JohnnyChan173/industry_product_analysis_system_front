import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductDetail, ProductInfo } from "./model/product";

enum Api {
  productAdd = "/product",
  productDel = "/product",
  productEdit = "/product",
  productDetail = "/product",
  productList = "/product/list",

  productGetProductStock = "/product/getProductStock",
  productUpdateBatch = "/product/updateBatch",
}

/** 产品-新增 */
export function productAdd(data: Partial<ProductInfo>) {
  return request.post(Api.productAdd, {
    ...data,
  });
}

/** 产品-删除 */
export function productDel(id: number) {
  return request.delete(Api.productDel, {
    params: {
      id,
    },
  });
}

/** 产品-编辑 */
export function productEdit(data: Partial<ProductInfo>) {
  return request.put(Api.productEdit, {
    ...data,
  });
}

/** 产品-详情 */
export function productDetail(id: number) {
  return request.get<ProductDetail>(Api.productDetail, {
    params: {
      id,
    },
  });
}

/** 产品-分页列表 */
export function productList(params: ListCommonParams & {}) {
  return request.get<ListCommonResData<ProductDetail>>(Api.productList, {
    params,
  });
}

/** 产品-全部 */
export async function productListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await productList(params);
  return records;
}

/** 产品-获取产品库存 */
export function productGetProductStock(productId: number, productAttrValueIdsList: string) {
  return request.get<number>(Api.productGetProductStock, {
    params: {
      productId,
      productAttrValueIdsList,
    },
  });
}

/** 产品-批量更新 */
export function productUpdateBatch(data: ProductInfo[]) {
  return request.put(Api.productUpdateBatch, data);
}
