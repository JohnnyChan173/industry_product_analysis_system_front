import type { Rule, RuleObject } from "ant-design-vue/lib/form/interface";
import { computed, ref, unref } from "vue";
import { Recordable } from "/#/global";
import { createFormRule, regType } from "/@/utils/validate";

export enum LoginStateEnum {
  LOGIN,
  PHONE_LOGIN,
  FORGET_PASSWORD,
}

export type FormRuleData = { [k: string]: RuleObject | RuleObject[] };

const currentState = ref(LoginStateEnum.LOGIN);

/** 使用用户数据 */
export function useLoginState() {
  function setLoginState(state: LoginStateEnum) {
    currentState.value = state;
  }

  const getLoginState = computed(() => {
    return currentState.value;
  });

  return {
    setLoginState,
    getLoginState,
  };
}

export function useFormRules(formData?: Recordable) {
  const usernameRule = createFormRule("请输入用户名");
  const passwordRule = createFormRule("请输入密码");
  const phoneRule = createFormRule([{ pattern: regType.phone.value, message: regType.phone.message }]);
  const verifyCodeRule = createFormRule("请输入验证码");

  const cpFormRules = computed((): FormRuleData => {
    switch (unref(currentState)) {
      // 登录阶段 校验
      case LoginStateEnum.LOGIN:
        return {
          username: usernameRule,
          password: passwordRule,
        };
      case LoginStateEnum.PHONE_LOGIN:
        return {
          phone: phoneRule,
          verifyCode: verifyCodeRule,
        };
      case LoginStateEnum.FORGET_PASSWORD:
        return {
          phone: phoneRule,
          verifyCode: verifyCodeRule,
          password: passwordRule,
        };
      default:
        return {};
    }
  });

  return { cpFormRules };
}
