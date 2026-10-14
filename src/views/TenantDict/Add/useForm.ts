import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    staffNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    staffName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    staffType: [
      {
        required: true,
        message: "请选择",
      },
    ],
    staffEntryDate: [
      {
        required: true,
        message: "请选择",
      },
    ],
    password: [
      {
        required: true,
        message: "请输入",
      },
    ],
    account: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
