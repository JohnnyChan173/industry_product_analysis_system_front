import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 工序名称
    procedureName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 工序类型
    procedureType: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
