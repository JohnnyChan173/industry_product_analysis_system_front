import { onMounted, onUnmounted, watch } from "vue";
import { useAppStore } from "/@/store";

/** document.body hook */
export function useResize(fn: any) {
  const appStore = useAppStore();

  watch(
    () => appStore.fullscreen,
    () => {
      resizeHander();
    }
  );

  onMounted(() => {
    window.addEventListener("resize", resizeHander);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", resizeHander);
  });

  function resizeHander() {
    fn();
  }
}
