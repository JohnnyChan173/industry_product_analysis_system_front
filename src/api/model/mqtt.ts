import { CommonCheck } from "/@/enums/model";

/** 绑定模组数据 */
export interface BindModuleData {
  gatewayUuid?: string;
  data: Array<{
    uuid: string;
    isUsedAddon: CommonCheck;
    isUsedWristband: CommonCheck;
    isUsedGround: CommonCheck;
    isUsedGeneral: CommonCheck;
    isUsedScale: CommonCheck;
  }>;
}
