import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    taskType: [
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
    taskNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // customName: [
    //   {
    //     required: true,
    //     message: "请输入",
    //   },
    // ],
    productId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    lineId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    productNumber: [
      {
        required: true,
        message: "请输入",
      },
    ],
    planCompleteDate: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
