import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    operationType: [
      {
        required: true,
        message: "请选择",
      },
    ],
    operationTypeSub: [
      {
        required: true,
        message: "请选择",
      },
    ],
    value: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
