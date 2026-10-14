import { TableBaseInfo } from ".";
import { CraftInfo } from "./craft";
import { CommonCheck, ProcedureType } from "/@/enums/model";

/** 工艺工序信息 */
export interface CraftProcedureInfo extends TableBaseInfo {
  id: number;
  /** 前端生成，自用 */
  procedureUuid: string;
  procedureName: string;
  procedureType: ProcedureType;
  procedureProcess: CommonCheck;
  procedureSort: number;
  procedureDesc: string;
  memo: string;
  /** 工序编号 */
  procedureNo: string;
  craftId: number;
}

/** 工艺工序详情 */
export type CraftProcedureDetail = CraftProcedureInfo & {
  craftInfo: CraftInfo;
  procedureProcessInfo: any;
};
