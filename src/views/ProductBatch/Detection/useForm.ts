import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    detectionMode: [
      {
        required: true,
        message: "请选择",
      },
    ],
    detectionDate: [
      {
        required: true,
        message: "请选择",
      },
    ],
    spotcheckValue: [
      {
        required: true,
        message: "请输入",
      },
    ],
    allcheckQualifiedValue: [
      {
        required: true,
        message: "请输入",
      },
    ],
    allcheckUnqualifiedValue: [
      {
        required: true,
        message: "请输入",
      },
    ],
    detectionConclusion: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
