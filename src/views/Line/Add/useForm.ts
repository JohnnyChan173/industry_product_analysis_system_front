import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    lineType: [
      {
        required: true,
        message: "请选择",
      },
    ],
    lineNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    lineName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    workshopId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    lineLeaderStaffId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    beatMax: [
      {
        required: true,
        message: "请输入",
      },
    ],
    beatBase: [
      {
        required: true,
        message: "请输入",
      },
    ],
    beatMin: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
