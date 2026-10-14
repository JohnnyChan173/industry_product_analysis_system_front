import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";
import { getAccountExistValidator } from "/@/utils/validate";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    tenantName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    tenantMainAccount: [
      {
        required: true,
        validator: getAccountExistValidator(),
      },
    ],
    validDate: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
