import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    batchNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    recordDate: [
      {
        required: true,
        message: "请选择",
      },
    ],
    productId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    supplyValue: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
