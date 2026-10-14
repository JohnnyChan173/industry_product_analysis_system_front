import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";
import { regType } from "/@/utils/validate";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 供应商编号
    supplierNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 供应商名称
    supplierName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 联系方式
    contract: [
      {
        pattern: regType.phone.value,
        message: regType.phone.message,
      },
    ],
  };
}
