import { onMounted, onUnmounted } from "vue";

/** document.body hook */
export function useBodyClick(fn: any) {
  function clickHander(e: KeyboardEvent) {
    fn();
  }

  onMounted(() => {
    window.addEventListener("click", clickHander);
  });

  onUnmounted(() => {
    window.removeEventListener("click", clickHander);
  });
}
