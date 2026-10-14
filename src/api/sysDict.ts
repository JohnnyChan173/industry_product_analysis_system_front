import request from "../config/request";
import { SysDictDataDetail } from "./model/sysDict";

enum Api {
  sysDictDataByDictType = "/dict/data/type",
}

/** 字典数据-根据字典类型查询 */
export function sysDictDataByDictType(dictType: string) {
  return request.get<SysDictDataDetail[]>(Api.sysDictDataByDictType + "/" + dictType);
}
