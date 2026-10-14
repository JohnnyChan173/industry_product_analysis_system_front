import { StaffInfo } from "./staff";
import { TenantInfo } from "./tenant";
import { UserStatus, UserType } from "/@/enums/model";

/** 用户登录信息 */
export interface UserLoginInfo {
  username?: string;
  password?: string;
}

/** 用户修改密码 */
export interface UserChangePasswordData {
  password: number;
  newPassword: number;
  rePassword?: number;
}

/** 用户信息 */
export interface UserInfo {
  userId: number;
  userType: UserType;
  username: string;
  phoneNumber: string;
  nickname: string;
  status: UserStatus;
}

/** 用户详情 */
export type UserDetail = UserInfo & {
  tenantId: number;
  tenantInfo: TenantInfo;
};

/** 用户修改密码 */
export type UserChangePassword = {
  password: string;
  newPassword: string;
};

/** 验证码 */
export type VerifyData = {
  verifyCode: number;
};

/** 重复密码 */
export type RepasswordData = {
  rePassword: string;
};

/** 用户手机号登录 */
export type UserPhoneLogin = {
  phone: string;
  password: string;
} & VerifyData;

/** 用户名登录 */
export type UserAccountLogin = {
  username: string;
  password: string;
};

/** 用户登录数据 */
export type UserLoginData = Partial<UserAccountLogin & UserPhoneLogin>;
