import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    purchaseNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    supplierId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    materialPurchaseItemList: [
      {
        type: "array",
        required: true,
        message: "请添加采购物料",
      },
    ],
  };
}
