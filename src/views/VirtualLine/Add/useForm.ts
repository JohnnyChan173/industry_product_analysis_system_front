import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    virtualLineName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    lineId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    craftId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    standardBeat: [
      {
        required: true,
        message: "请输入",
      },
    ],
    targetLineBalance: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 虚拟工位列表
    virtualStationList: [
      {
        type: "array",
        required: true,
        message: "请创建至少一个虚拟工位",
      },
    ],
  };
}
