import { LineInfo } from "./line";
import { StaffInfo } from "./staff";
import { VirtualStationInfo, VirtualStationDetail } from "./virtualStation";
import { SignalPayloadCheck, SignalPayloadAddon } from "/@/enums/model";

/** 信号数据格式 */
export interface SignalDataInfo {
  uuid: string;
  timestamp: number;
  registrationId: number;
  lineId: number;
  stationId: number;
  staffId: number;
  deviceGround?: number;
  wristband?: number;
  generalInput?: number;
  addon?: number;
  scale?: number;
  scaleProductCount?: number;
  scaleTareWeight?: number;
}

/** 信号数据扩展格式 */
export type SignalDataExtendInfo = SignalDataInfo & {
  lineInfo?: LineInfo;
  virtualStationInfo?: VirtualStationInfo;
  staffInfo?: StaffInfo;
  scaleProductCountAdd?: number;
};

/** 信号数据-节拍 */
export type SignalBeatData = {
  messageId: number;
  virtualStationInfo: VirtualStationDetail;
  staffInfo: StaffInfo;
  firstDate: string;
  secondDate: string;
  first: SignalDataExtendInfo;
  second: SignalDataExtendInfo;
  beatTime: number;
  beatFormat: string;
  balanceDate: string;
};

/** 信号量-常规 */
type SignalSendData = {
  payload: number;
  timestamp: number;
};

type SignalSendDataCheck = {
  payload: SignalPayloadCheck;
  timestamp: number;
};

type SignalSendDataAddon = {
  payload: SignalPayloadAddon;
  timestamp: number;
};

/** 工位状态数据 */
export type StationLatestSignalData = {
  stationId: number;
  deviceGround: SignalSendDataCheck;
  wristband: SignalSendDataCheck;
  generalInput: SignalSendDataCheck;
  addon: SignalSendDataAddon;
  scale: SignalSendData;
  scaleProductCount: SignalSendData;
};
