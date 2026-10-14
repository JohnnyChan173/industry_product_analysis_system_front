import request from "/@/config/request";
import { parseStrEmpty } from "/@/ruoyi/utils/ruoyi";

// 修改密码
export function userChangePassword({ password, newPassword }) {
  return request({
    url: "/user/changePassword",
    method: "post",
    data: {
      password,
      newPassword,
    },
  });
}

// 查询用户列表
export function listUser(query) {
  return request({
    url: "/user/list",
    method: "get",
    params: query,
  });
}

// 查询用户详细
export function getUser(userId) {
  return request({
    url: "/user/" + parseStrEmpty(userId),
    method: "get",
  });
}

// 新增用户
export function addUser(data) {
  return request({
    url: "/user",
    method: "post",
    data: data,
  });
}

// 修改用户
export function updateUser(data) {
  return request({
    url: "/user",
    method: "put",
    data: data,
  });
}

// 删除用户
export function delUser(userId) {
  return request({
    // url: "/user/" + userId,
    url: "/user",
    method: "delete",
    params: { userIds: userId },
  });
}

// 用户密码重置
export function resetUserPwd(userId, password) {
  const data = {
    userId,
    password,
  };
  return request({
    url: "/user/resetPwd",
    method: "put",
    data: data,
  });
}

// 用户状态修改
export function changeUserStatus(userId, status) {
  const data = {
    userId,
    status,
  };
  return request({
    url: "/user/changeStatus",
    method: "put",
    data: data,
  });
}

// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: "/user/profile",
    method: "get",
  });
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: "/user/profile",
    method: "put",
    data: data,
  });
}

// 用户密码重置
export function updateUserPwd(oldPassword, newPassword) {
  const data = {
    oldPassword,
    newPassword,
  };
  return request({
    url: "/user/profile/updatePwd",
    method: "put",
    params: data,
  });
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: "/user/profile/avatar",
    method: "post",
    data: data,
  });
}

// 查询授权角色
export function getAuthRole(userId) {
  return request({
    url: "/user/authRole/" + userId,
    method: "get",
  });
}

// 保存授权角色
export function updateAuthRole(data) {
  return request({
    url: "/user/authRole",
    method: "put",
    params: data,
  });
}

// 查询部门下拉树结构
export function deptTreeSelect() {
  return request({
    url: "/user/deptTree",
    method: "get",
  });
}

// 根据用户名检测用户是否存在
export function userCheckUserNameUnique(username) {
  return request({
    url: "/user/checkUserNameUnique",
    method: "get",
    params: {
      username,
    },
  });
}
