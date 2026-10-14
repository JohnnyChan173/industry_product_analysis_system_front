import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 工艺编号
    configName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 工艺名称
    configValue: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 工艺工序列表
    configType: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
