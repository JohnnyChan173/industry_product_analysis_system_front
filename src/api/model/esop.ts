import { TableBaseInfo } from ".";

export interface ESOPInfo extends TableBaseInfo {
  id?: number;
  stationUuid: string; //物理工位下绑定的模组UUID
  virtualStationId: number; //虚拟工位ID
  virtualStationName: string; //虚拟工位名称
  virtualLineId: number; //虚拟产线ID
  virtualLineName: string; //虚拟产线名称
  sopSchemeName: string; //ESOP 方案名称
  sopFileUrl: string; //ESOP 文件存储地址
  fileModified: number; //文件是否修改 0：未修改 1：已修改
}
