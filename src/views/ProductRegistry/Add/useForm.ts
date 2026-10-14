import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

/** 生产登记创建表单校验 */
export function getFormRules(): Recordable<RuleObject[]> {
  return {
    lineId: [
      {
        required: true,
        message: "请选择登记产线",
        trigger: "change",
      },
    ],
    virtualLineKey: [
      {
        required: true,
        message: "请选择产品&工艺",
        trigger: "change",
      },
    ],
  };
}
