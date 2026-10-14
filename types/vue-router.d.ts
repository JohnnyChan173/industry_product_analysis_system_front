import router from "vue-router";
import { UserRole } from "/@/enums2/model";
import { FunctionalComponent } from "vue";
import { AntdIconProps } from "@ant-design/icons-vue/lib/components/AntdIcon";

declare module "vue-router" {
  export interface RouteMeta {
    title: string;
    icon?: FunctionalComponent<AntdIconProps> & {
      displayName: string;
    };
    hideMenu?: boolean;
    hideBreadcrumb?: boolean;
    activeMenu?: string;
    /** 有roles 仅部分允许 */
    roles?: UserRole[];
    /** router.push 到指定路由清除全部缓存 */
    clearCached?: boolean;
  }
}
