import { AntUniversalSize } from "/@/enums/antEnum";

export interface LoadingProps {
  /** 加载提示文字，默认“数据记载中” */
  tip: string;
  size: AntUniversalSize.large;
  absolute: boolean;
  loading: boolean;
}
