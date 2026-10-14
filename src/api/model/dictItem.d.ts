import { TableBaseInfo } from ".";

/** 字典数据信息 */
export interface DictItemInfo extends TableBaseInfo {
  id: number;
  itemValue: string;
  itemSort: number;
  dictId: number;
}

/** 字典数据详情 */
export type DictItemDetail = DictItemInfo & {
  dictInfo: DictInfo;
};
