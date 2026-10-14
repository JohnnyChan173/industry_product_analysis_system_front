import { unref } from "vue";
import { useAppStore } from "../store";
import { Recordable } from "/#/global";

/** 替换路由 search */
export function replaceUrlQuery(queryParams: Recordable = {}, replaceParams = false) {
  const { router } = useAppStore();

  if (router) {
    const { currentRoute } = router;
    const { path, query } = unref(currentRoute);

    let newParams = {
      ...query,
      ...queryParams,
    };

    if (replaceParams) {
      newParams = queryParams;
    }

    router.replace({
      path,
      query: newParams,
    });
  }
}
