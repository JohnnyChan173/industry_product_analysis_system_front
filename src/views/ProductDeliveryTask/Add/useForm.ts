import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    deliveryType: [
      {
        required: true,
        message: "请选择",
      },
    ],
    saleOrderNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    productDeliveryTaskDemandList: [
      {
        type: "array",
        required: true,
        message: "请添加出库产品",
      },
    ],
  };
}
