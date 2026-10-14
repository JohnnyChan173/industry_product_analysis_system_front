import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 工艺编号
    craftNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 工艺名称
    craftName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 工艺适用产品
    craftProductIds: [
      {
        type: "array",
        required: true,
        message: "请选择",
      },
    ],

    // 工艺工序列表
    craftProcedureList: [
      {
        type: "array",
        required: true,
        message: "请创建至少一个工序",
      },
    ],
  };
}
