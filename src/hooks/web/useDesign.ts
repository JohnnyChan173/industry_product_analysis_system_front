import { useAppProviderContext } from "/@/components/Application/useAppContext";

/** 项目样式命名空间 */
export function useDesign(scope: string) {
  const values = useAppProviderContext();

  return {
    prefixCls: `${values.prefixCls}-${scope}`,
    prefixVar: values.prefixCls,
  };
}
