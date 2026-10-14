import { onMounted, onUnmounted } from "vue";

/** 按键按下 hook */
export function useKeypress(key: string, fn: any) {
  function keyUpHander(e: KeyboardEvent) {
    if (e.key === key) {
      fn();
    }
  }

  onMounted(() => {
    window.addEventListener("keyup", keyUpHander);
  });

  onUnmounted(() => {
    window.removeEventListener("keyup", keyUpHander);
  });
}
