import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";
import { WorkshopInfo } from "/@/api/model/workshop";
import { regType } from "/@/utils/validate";

export function getFormRules(formData: Partial<WorkshopInfo>): Recordable<RuleObject[]> {
  return {
    workshopNo: [
      {
        required: true,
        message: "请填写车间编号",
      },
    ],
    workshopName: [
      {
        required: true,
        message: "请填写车间名称",
      },
    ],
    // staffId: [
    //   {
    //     required: true,
    //     message: "请选择车间主任",
    //   },
    // ],
  };
}
