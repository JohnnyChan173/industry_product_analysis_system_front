import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 选项名称
    attrName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 选项顺序
    attrSort: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 选项值列表
    productAttrValueList: [
      {
        type: "array",
        required: true,
        message: "请创建至少一个选项值",
      },
    ],
  };
}
