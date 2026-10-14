import { maxPageSize } from "../config";
import request from "../config/request";
import { ListCommonResData, ListCommonParams } from "./model";
import { ProductAttrValueDetail, ProductAttrValueInfo } from "./model/productAttrValue";

enum Api {
  productAttrValueAdd = "/productAttrValue",
  productAttrValueDel = "/productAttrValue",
  productAttrValueEdit = "/productAttrValue",
  productAttrValueDetail = "/productAttrValue",
  productAttrValueList = "/productAttrValue/list",
}

/** 产品选项值-新增 */
export function productAttrValueAdd(data: Partial<ProductAttrValueInfo>) {
  return request.post(Api.productAttrValueAdd, {
    ...data,
  });
}

/** 产品选项值-删除 */
export function productAttrValueDel(id: number) {
  return request.delete(Api.productAttrValueDel, {
    params: {
      id,
    },
  });
}

/** 产品选项值-编辑 */
export function productAttrValueEdit(data: Partial<ProductAttrValueInfo>) {
  return request.put(Api.productAttrValueEdit, {
    ...data,
  });
}

/** 产品选项值-详情 */
export function productAttrValueDetail(id: number) {
  return request.get<ProductAttrValueDetail>(Api.productAttrValueDetail, {
    params: {
      id,
    },
  });
}

/** 产品选项值-分页列表 */
export function productAttrValueList(
  params: ListCommonParams & {
    productAttrId?: number;
  }
) {
  return request.get<ListCommonResData<ProductAttrValueDetail>>(Api.productAttrValueList, {
    params,
  });
}

/** 产品选项值-全部 */
export async function productAttrValueListAll() {
  const params = {
    pageNum: 1,
    pageSize: maxPageSize,
  };
  const { records } = await productAttrValueList(params);
  return records;
}
