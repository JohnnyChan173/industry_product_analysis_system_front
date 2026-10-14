import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    // 种类名称
    materialNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 种类名称
    materialName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    // 物料类型
    dictItemMaterialTypeId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    // 用量单位
    dictItemMaterialUnitId: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
