import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 检测项名称
    detectionName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 检测项权重
    detectionWeight: [
      {
        required: true,
        message: "请选择",
      },
    ],
    // 检测项类型
    detectionType: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 计量值上限
    detectionMax: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 计量值中心限
    detectionBase: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 计量值下限
    detectionMin: [
      {
        required: true,
        message: "请输入",
      },
    ],
  };
}
