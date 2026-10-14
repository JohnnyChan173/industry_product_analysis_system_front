import request from "../config/request";
import { UserType } from "/@/enums/model";
import { ListCommonResData, ListCommonParams } from "./model";
import { UserChangePassword, UserDetail, UserInfo, UserPhoneLogin } from "./model/user";
import { SECURE_KEY } from "../config";

enum Api {
  userLogin = "/sys/login",
  userGetSecureSsoLogin = "/sys/getSecureSsoLogin",
  userPhoneLogin = "/user/phoneLogin",
  userChangePassword = "/user/changePassword",
  userChangePasswordByPhone = "/user/changePasswordByPhone",
  userDetail = "/user",
  userCurrentInfo = "/sys/currentInfo",
  userResetPassword = "/user/resetPassword",
  userLogout = "/sys/logout",
  userDel = "/user",
  userCheckPhoneRegister = "/user/checkPhoneRegister",
  userCheckAccountRegister = "/user/checkAccountRegister",
  userList = "/user/list",
}

/** 用户名登录 */
export function userLogin(account: string, password: string) {
  return request.post<string>(Api.userLogin, {
    username: account,
    password,
  });
}

/** 内部免密登录（内部用）*/
export function userGetSecureSsoLogin(username: string) {
  return request.post<string>(Api.userGetSecureSsoLogin, {
    username,
    password: SECURE_KEY,
  });
}

/** 手机号登录 */
export function userPhoneLogin(phone: string, verifyCode: number) {
  return request.post<string>(Api.userPhoneLogin, {
    phone,
    verifyCode,
  });
}

/** 修改密码 */
export function userChangePassword({ password, newPassword }: UserChangePassword) {
  return request.post<number>(Api.userChangePassword, {
    password,
    newPassword,
  });
}

/** 修改密码-通过手机号 */
export function userChangePasswordByPhone({ phone, verifyCode, password }: UserPhoneLogin) {
  return request.post<number>(Api.userChangePasswordByPhone, {
    phone,
    verifyCode,
    password,
  });
}

/** 获取用户详情 */
export function userDetail(id: number) {
  return request.get<UserInfo>(Api.userDetail, {
    params: {
      id,
    },
  });
}

/** 获取当前用户信息 */
export function userCurrentInfo() {
  return request.get<UserDetail>(Api.userCurrentInfo);
}

/** 重置密码 */
export function userResetPassword(userId: number, password: string) {
  return request.put<number>(Api.userResetPassword, {
    userId,
    password,
  });
}

/** 账号退出 */
export function userLogout() {
  return request.post<number>(Api.userLogout);
}

/** 删除用户 */
export function userDel(id: number) {
  return request.delete<number>(Api.userDel, {
    params: { id },
  });
}

/** 查询手机号可否注册 */
export function userCheckPhoneRegister(phone: string) {
  return request.get<number>(Api.userCheckPhoneRegister, {
    params: {
      phone,
    },
  });
}

/** 查询账号可否注册 */
export function userCheckAccountRegister(account: string) {
  return request.get<number>(Api.userCheckAccountRegister, {
    params: {
      account,
    },
  });
}

/** 获取用户分页列表 */
export function userList(
  params: ListCommonParams & {
    type?: UserType;
  }
) {
  return request.get<ListCommonResData<UserInfo>>(Api.userList, {
    params,
  });
}

// /** 供应商注册 */
// export function userSupplierRegister(data: SupplierRegisterInfo) {
//   return request.post(Api.userSupplierRegister, {
//     ...data,
//   });
// }

// /** 供应商子账号注册 */
// export function userSubSupplierRegister(data: Pick<UserInfo, "account" | "phone" | "username" | "password" | "type">) {
//   return request.post(Api.userSubSupplierRegister, {
//     ...data,
//   });
// }

// /** 手机号绑定 */
// export function userPhoneBind(phone: string, verifyCode: number) {
//   return request.post<string>(Api.userPhoneBind, {
//     phone,
//     verifyCode,
//   });
// }

// /** 查询供应商编号可否注册 */
// export function userCheckSupplierRegister(supplierNo: string) {
//   return request.get<number>(Api.userCheckSupplierRegister, {
//     params: {
//       supplierNo,
//     },
//   });
// }

// /** 获取用户未读消息条目 */
// export function userUnreadMessageCount() {
//   return request.get<number>(Api.userUnreadMessageCount);
// }
