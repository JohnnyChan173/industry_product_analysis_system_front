import { withInstall } from "/@/utils";

import appLogo from "./AppLogo.vue";
import appCopyright from "./AppCopyright.vue";

// 需要注释掉，会造成循环引用问题（后面解决）
// export { useAppProviderContext } from "./useAppContext";

export const AppLogo = withInstall(appLogo);
export const AppCopyright = withInstall(appCopyright);
