import { App, Directive, reactive } from "vue";

const focusDirective: Directive = {
  mounted(el: HTMLElement, binding) {
    let dom = el;
    // 如果非input 在内部找 input
    if (el.tagName !== "INPUT") {
      dom = el.querySelector("input")!!;
    }
    dom && dom.focus();
  },
};

export function setupFocusDirective(app: App) {
  app.directive("focus", focusDirective);
}
