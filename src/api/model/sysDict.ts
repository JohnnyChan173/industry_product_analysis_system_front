import { TableBaseInfo } from ".";
import { RyStatus } from "/@/enums/model";

/** 系统字典类型信息 */
export interface SysDictTypeInfo extends TableBaseInfo {
  dictId: number;
  dictName: string;
  dictType: number;
  status: RyStatus;
}

/** 系统字典类型详情 */
export type SysDictTypeDetail = SysDictTypeInfo & {};

/** 系统字典数据信息 */
export interface SysDictDataInfo extends TableBaseInfo {
  dictCode: number;
  dictSort: number;
  dictLabel: string;
  dictValue: string;
  dictType: string;
  status: RyStatus;
}

/** 系统字典数据详情 */
export type SysDictDataDetail = SysDictDataInfo & {};
