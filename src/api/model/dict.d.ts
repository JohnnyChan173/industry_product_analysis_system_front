import { TableBaseInfo } from ".";

/** 字典信息 */
export interface DictInfo extends TableBaseInfo {
  id: number;
  dictNo: string;
  dictName: string;
  dictDesc: string;
}

/** 字典详情 */
export type DictDetail = DictInfo & {
  dictItemList: DictItemInfo[];
};
