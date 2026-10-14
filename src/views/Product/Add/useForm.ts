import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 产品编码
    productNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 产品名称
    productName: [
      {
        required: true,
        message: "请输入",
      },
    ],

    // 产品类型
    dictItemProductTypeId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    // 产品重量
    productWeight: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
