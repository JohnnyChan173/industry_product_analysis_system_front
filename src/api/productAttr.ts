import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductAttrAddData, ProductAttrDetail, ProductAttrInfo } from "./model/productAttr";

enum Api {
  productAttrAdd = "/productAttr",
  productAttrDel = "/productAttr",
  productAttrEdit = "/productAttr",
  productAttrDetail = "/productAttr",
  productAttrList = "/productAttr/list",
}

/** 产品选项-新增 */
export function productAttrAdd(data: Partial<ProductAttrAddData>) {
  return request.post(Api.productAttrAdd, {
    ...data,
  });
}

/** 产品选项-删除 */
export function productAttrDel(id: number) {
  return request.delete(Api.productAttrDel, {
    params: {
      id,
    },
  });
}

/** 产品选项-编辑 */
export function productAttrEdit(data: Partial<ProductAttrAddData>) {
  return request.put(Api.productAttrEdit, {
    ...data,
  });
}

/** 产品选项-详情 */
export function productAttrDetail(id: number) {
  return request.get<ProductAttrDetail>(Api.productAttrDetail, {
    params: {
      id,
    },
  });
}

/** 产品选项-分页列表 */
export function productAttrList(
  params: ListCommonParams & {
    productId?: number;
  }
) {
  return request.get<ListCommonResData<ProductAttrDetail>>(Api.productAttrList, {
    params,
  });
}

/** 产品选项-全部 */
export async function productAttrListAll(productId?: number) {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
    productId,
    sort: "attr_sort asc",
  };
  const { records } = await productAttrList(params);
  return records;
}
