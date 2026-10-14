import request from "../config/request";
import { ListCommonParams, ListCommonResData } from "./model";
import { IndustryconfgInfo } from "./model/Industryconfg";

enum Api {
  IndustryconfgList = "/Industryconfg/pageList",
  IndustryconfgEdit = "/Industryconfg",
  IndustryconfgDel = "/Industryconfg",
  IndustryconfgDetail = "/Industryconfg",
  IndustryconfgAdd = "/Industryconfg",
 }

 export function IndustryconfgList(params: ListCommonParams) {
  return request.get<ListCommonResData<IndustryconfgInfo>>(Api.IndustryconfgList, {
    params,
  });
 }

 export function IndustryconfgEdit(data: IndustryconfgInfo) {
  return request.put(Api.IndustryconfgEdit, data);
 }

 export function IndustryconfgDel(id: number) {
  return request.delete(Api.IndustryconfgDel, {
    params: {
      id,
    },
  });
}
export function IndustryconfgAdd(data: IndustryconfgInfo) {
  return request.post(Api.IndustryconfgAdd, data);
}
export function IndustryconfgDetail(id: number) {
  return request.get<IndustryconfgInfo>(Api.IndustryconfgDetail, {
    params: {
      id,
    },
  });
}