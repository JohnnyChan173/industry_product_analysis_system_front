import { App, Directive, reactive } from "vue";
import { useUserInfoStore } from "../store";

const superPermission = "*:*:*";

const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    // console.log(el, binding);
    let isAllowed = true;

    const { value } = binding;
    const { type, permissions } = useUserInfoStore();

    // if (value !== undefined) {
    //   // 如果是值
    //   if (Array.isArray(value)) {
    //     isAllowed = value.includes(type);
    //   } else {
    //     isAllowed = value === type;
    //   }
    // }

    // if (!isAllowed) {
    //   el.parentElement?.removeChild(el);
    // }

    // console.log("鉴权", value, permissions);
    console.log("权限", type, permissions);
    // 超级管理员直接跳出
    if (permissions.includes(superPermission)) {
      return;
    }

    // 非超级管理员，检测实际权限
    if (!permissions.includes(value)) {
      el.parentElement?.removeChild(el);
      return;
    }
  },
};

export function setupPermissionDirective(app: App) {
  app.directive("permission", permissionDirective);
}
