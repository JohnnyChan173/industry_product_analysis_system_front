import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";
import { userCheckPhoneRegister } from "/@/api/user";
import { debounce } from "/@/utils/util";
import { regType } from "/@/utils/validate";

const debounceToCheckPhoneRegister = debounce(userCheckPhoneRegister, 200);

export function getFormRules(formData?: any): Recordable<RuleObject[]> {
  return {
    password: [
      {
        required: true,
        message: "请填写原密码",
      },
      { pattern: regType.password.value, message: regType.password.message },
    ],
    newPassword: [
      {
        required: true,
        message: "请填写新密码",
      },
      { pattern: regType.password.value, message: regType.password.message },
    ],
    rePassword: [
      {
        required: true,
        message: "请填写确认密码",
      },
      {
        required: true,
        validator(rule, value, callback) {
          const { newPassword } = formData;
          if (value && newPassword !== value) {
            return Promise.reject("二次密码不一致");
          }
          return Promise.resolve();
        },
      },
    ],
  };
}
