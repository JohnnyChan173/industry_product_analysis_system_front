import { TableBaseInfo } from ".";
import { CraftDetail } from "./craft";
import { LineInfo } from "./line";
import { UserInfo } from "./user";
import { VirtualStationDetail } from "./virtualStation";
import { WorkshopInfo } from "./workshop";

/** 虚拟产线信息 */
export interface VirtualLineInfo extends TableBaseInfo {
  id: number;
  virtualLineName: string;
  workshopId: number;
  lineId: number;
  lineName: string;
  virtualStationTotal: number;
  standardBeat: number;
  craftId: number;
  userId: number;
}

/** 虚拟产线详情 */
export type VirtualLineDetail = VirtualLineInfo & {
  workshopInfo: WorkshopInfo;
  lineInfo: LineInfo;
  craftInfo: CraftDetail;
  userInfo: UserInfo;
  virtualStationList: VirtualStationDetail[];
};
