import { defineComponent, h, createVNode, render, VNode } from "vue";
import ModalInput from "./ModalInput.vue";
import { ModalInputProps } from "./typing";
import { Nullable } from "/#/global";
import { AntInputType } from "/@/enums/antEnum";

/** 创建一个审核专用输入弹窗 */
export function createReasonInput(props: ModalInputProps) {
  const title = "审核驳回信息填写";
  const placeholder = "请填写审核驳回的理由";
  const mode = AntInputType.TEXTAREA;

  let vm: Nullable<VNode> = null;

  // 定义组件
  const ReasonInputWrap = defineComponent({
    render() {
      return h(ModalInput, {
        title,
        placeholder,
        mode,
        ...props,
      });
    },
  });

  // 创建虚拟节点
  vm = createVNode(ReasonInputWrap);

  // 渲染节点
  render(vm, document.createElement("div"));
}

/** 创建一个输入弹窗 */
export function createInputModal(props: ModalInputProps) {
  let vm: Nullable<VNode> = null;

  // 定义组件
  const ReasonInputWrap = defineComponent({
    render() {
      return h(ModalInput, {
        ...props,
      });
    },
  });

  // 创建虚拟节点
  vm = createVNode(ReasonInputWrap);

  // 渲染节点
  render(vm, document.createElement("div"));
}
