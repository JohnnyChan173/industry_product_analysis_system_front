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
    sopSchemeName: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
