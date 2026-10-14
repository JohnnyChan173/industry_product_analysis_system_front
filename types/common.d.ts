import { CommonComponentMode } from "../src/enums/commonEnum";

/** 通用路由query */
export interface CommonRouteQuery {
  id?: string | number;
  mode?: CommonComponentMode;
  [key: string]: any;
}
