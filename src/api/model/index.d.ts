import { LineInfo } from "./line";
import { StaffInfo } from "./staff";
import { StationInfo } from "./station";
import { VirtualStationDetail, VirtualStationInfo } from "./virtualStation";
import { DetectionResult, DetectionType, DetectionWeight } from "/@/enums/model";

/** 响应体 常规返回格式 */
export interface ResponseCommonData<T = any> {
  code: number;
  data: T;
  message: string;
}

/** 列表 常规传参格式 */
export interface ListCommonParams {
  pageNum: number;
  pageSize?: number;
  sort?: string;
  keyword?: string;
  [key: string]: any;
}

/** 列表 常规返回格式 */
export interface ListCommonResData<T = any> {
  current: number;
  size: number;
  total: number;
  records: T[];
}

/** 数据库基础字段 */
export type TableBaseInfo = Partial<{
  tenentId: number;
  userId: number;
  // isDelete: number;
  createBy: string;
  createTime: string;
  updateBy: string;
  updateTime: string;
  remark: string;
}>;

/** 表单基础字段 */
export interface FormItemInfo {
  label: string;
  value: any;
}

/** 信号数据-虚拟工位映射 */
export type SignalVirtualStationMapData = {
  virtualStationInfo: VirtualStationDetail;
  staffInfo: StaffInfo;
  signalList: SignalBeatData[];
};

/** 检测项-信息 */
export interface DetectionInfo {
  id: number;
  detectionName: string;
  detectionWeight: DetectionWeight;
  detectionType: DetectionType;
  detectionDesc: string;
  detectionMin: number;
  detectionBase: number;
  detectionMax: number;
}

/** 检测项-信息批次检测信息扩展 */
export type DetectionInfoBatchDetectionExpand = DetectionInfo &
  Partial<{
    result: DetectionResult;
    measureValue: number;
  }>;
