import { Ref } from "vue";
import { createContext, useContext } from "/@/hooks/core/useContext";

export interface AppProviderContextProps {
  prefixCls: Ref<string>;
  isMobile: Ref<boolean>;
}

const key = Symbol();

/** 应用级属性 注入 */
export function createAppProviderContext(context: AppProviderContextProps) {
  return createContext<AppProviderContextProps>(context, key);
}

/** 应用级别属性 获取 */
export function useAppProviderContext() {
  return useContext<AppProviderContextProps>(key);
}
