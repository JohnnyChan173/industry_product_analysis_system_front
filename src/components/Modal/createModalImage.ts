import { createVNode, defineComponent, h, ref, render, VNode } from "vue";
import { Nullable } from "/#/global";
import ModalImage from "./ModalImage.vue";

/** 创建显示图片弹窗 */
export function createModalImage(src: string) {
  let vm: Nullable<VNode> = null;

  const ModalImageWrap = defineComponent({
    render() {
      return h(ModalImage, {
        src,
        defaultVisible: true,
      });
    },
  });

  vm = createVNode(ModalImageWrap);

  render(vm, document.createElement("div"));

  if (vm.el) {
    document.body.appendChild(vm.el as HTMLElement);
  }
}
