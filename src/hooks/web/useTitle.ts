import { watch, unref } from "vue";
import { useRouter } from "vue-router";
import { useGlobSetting } from "../setting";
import { REDRIECT_NAME } from "/@/router/config";

export function useTitle() {
  const { title } = useGlobSetting();
  const { currentRoute } = useRouter();

  watch(
    () => currentRoute.value.path,
    () => {
      const route = unref(currentRoute);

      if (route.name === REDRIECT_NAME) {
        return;
      }

      const rTitle = route?.meta?.title as string;

      document.title = rTitle ? `${rTitle} - ${title}` : title;
    },
    {
      immediate: true,
    }
  );
}
