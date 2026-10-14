import { TableBaseInfo } from ".";

export interface IndustryconfgInfo extends TableBaseInfo {
  id?: number ;
  configName: string; //配置名称
  configValue: string; //配置值
  configType: number; //配置类型 0：字符串 1：数字
}