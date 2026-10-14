import * as Echarts from "echarts";
import { waldenTheme } from "./walden";

export function registerTheme() {
  Echarts.registerTheme("walden", waldenTheme);
}
