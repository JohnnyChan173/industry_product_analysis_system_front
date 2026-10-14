import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";
import { getAccountExistValidator, regType } from "/@/utils/validate";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    staffNo: [
      {
        required: true,
        message: "请输入",
      },
    ],
    staffName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    staffType: [
      {
        required: true,
        message: "请选择",
      },
    ],
    username: [
      {
        required: true,
        validator: getAccountExistValidator(),
      },
    ],
    // 手机号
    phoneNumber: [
      {
        pattern: regType.phone.value,
        message: regType.phone.message,
      },
    ],
    roleIds: [
      {
        type: "array",
        required: true,
      },
    ],
    password: [
      {
        required: true,
        message: "请输入",
      },
    ],
    validDate: [
      {
        required: true,
        message: "请选择",
      },
    ],
  };
}
