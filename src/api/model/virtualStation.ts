import { TableBaseInfo } from ".";
import { CraftProcedureDetail, CraftProcedureInfo } from "./craftProcedure";
import { StationInfo } from "./station";
import { UserInfo } from "./user";
import { VirtualLineInfo } from "./virtualLine";
import { CommonCheck } from "/@/enums/model";

/** 虚拟工位信息 */
export interface VirtualStationInfo extends TableBaseInfo {
  id: number;
  virtualStationName: string;
  virtualStationUuid: string;
  virtualStationSort: number;
  virtualStationProductWeight: number;
  beatFormat: string;
  needAddon: CommonCheck;
  needWristband: CommonCheck;
  needGround: CommonCheck;
  needGeneral: CommonCheck;
  needScale: CommonCheck;
  outputStation: CommonCheck;
  virtualLineId: number;
  stationId: number;
  userId: number;
  craftProcedureIds: number[];
  isFilter: boolean;
}

/** 虚拟工位详情 */
export type VirtualStationDetail = VirtualStationInfo & {
  virtualLineInfo: VirtualLineInfo;
  stationInfo: StationInfo;
  userInfo: UserInfo;
  craftProcedureList: CraftProcedureDetail[];
  exceedAvgBeatMax: number;
  staffId: number;
  staffNo: string;
  staffName: string;
};
