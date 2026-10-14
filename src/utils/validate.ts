import { RuleObject } from "ant-design-vue/lib/form";
import { AntFormTrigger } from "../enums/antEnum";
import { debounce } from "./util";
import { userCheckUserNameUnique } from "../ruoyi/api/system/user";

/** 正则类型 */
export const regType = {
  phone: {
    value: /^1[3|4|5|7|8]\d{9}$/,
    message: "请输入正确格式的手机号",
  },
  email: {
    value: /^[A-Za-z0-9._%-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,4}$/,
    message: "请输入正确格式的邮箱",
  },
  password: {
    value: /.{4}/,
    message: "密码长度需大于4",
  },
  /** 是 number string */
  numberString: {
    value: /^-?\d+$/,
    message: "请输入数字",
  },
  http: {
    value: /^([hH][tT]{2}[pP]:\/\/)|([hH][tT]{2}[pP][sS]?:\/\/)/,
    message: "请输入正确格式的网址",
  },
};

/** 创建基础规则 required */
export function createFormRule(data: string | RuleObject[]): RuleObject[] {
  if (typeof data === "string") {
    return [
      {
        required: true,
        message: data,
        trigger: AntFormTrigger.change,
      },
    ];
  } else {
    // 默认必选，可以通过传入覆盖
    return data.map((r) => ({ required: true, ...r }));
  }
}

/** 正则判断是否为网址 */
export function regTestHttp(url: string) {
  return regType.http.value.test(url);
}

/** 检测用户是否存在 */
async function checkUserExist(username: string) {
  const isExist = await userCheckUserNameUnique(username);
  return isExist;
}

/** 获取校验器-用户名是否存在 */
export function getAccountExistValidator(delay = 200) {
  const debounceCheckUserExist = debounce(checkUserExist, delay);

  return async function (rule: any, value: string, callback: any) {
    if (value) {
      const exist = await debounceCheckUserExist(value);
      if (exist) {
        return Promise.reject("用户名已存在");
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.reject("请输入");
    }
  };
}

/** 获取校验器-密码是否一致 */
export function getPasswordSameValidator(rule: any, value: string, callback: any) {
  // if (value) {
  //   const exist = await debounceCheckUserExist(value);
  //   if (exist) {
  //     return Promise.reject("用户名已存在");
  //   } else {
  //     return Promise.resolve();
  //   }
  // } else {
  //   return Promise.reject("请输入");
  // }
}
