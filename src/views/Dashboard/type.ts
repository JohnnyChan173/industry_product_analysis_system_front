import { PlatformBasicDataInfo } from "/@/api/model/statistics";

export type CardInfoData = {
  key: string;
  title: string;
  list: Array<PlatformBasicDataInfo>;
};
