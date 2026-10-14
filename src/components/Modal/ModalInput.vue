<template>
  <div>
    <Modal
      :style="{ width: AntModalWidth.sm }"
      v-model:visible="modalState.visible"
      :title="props.title"
      ok-text="确认"
      cancel-text="取消"
      @ok="handleOk"
      @cancel="handleCancel"
      destroyOnClose
    >
      <Input
        v-if="isInputMode"
        v-model:value="modalState.input"
        :placeholder="props.placeholder"
        @keypress.enter="handleOk"
      />

      <Input.Password
        v-else-if="isPasswordInputMode"
        v-model:value="modalState.input"
        :placeholder="props.placeholder"
        @keypress.enter="handleOk"
      />

      <Input.TextArea
        v-else-if="isTextareaMode"
        :rows="4"
        v-model:value="modalState.input"
        :placeholder="props.placeholder"
        @keypress.enter="handleOk"
      />

      <InputNumber
        :style="{ width: '100%' }"
        v-else-if="isNumberMode"
        :min="0"
        v-model:value="modalState.input"
        :placeholder="props.placeholder"
        @keypress.enter="handleOk"
      />

      <Select
        v-else-if="isSelectMode"
        :placeholder="props.placeholder"
        v-model:value="modalState.input"
        :style="{ width: '100%' }"
      >
        <Select.Option v-for="{ label, value } in options" :key="value">{{ label }}</Select.Option>
      </Select>
    </Modal>
  </div>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps, reactive, computed } from "vue";
  import { Modal, Input, InputNumber, Select } from "ant-design-vue";
  import { AntInputType, AntModalWidth } from "/@/enums/antEnum";
  import { OptionProps } from "ant-design-vue/lib/select";

  interface Props {
    title: string;
    className: string;
    placeholder: string;
    value: string;
    mode: AntInputType;
    options: OptionProps;
    onOk: (value: string) => Promise<any>;
    onCancel: () => void;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: "消息窗口",
    className: "",
    placeholder: "请输入",
    value: undefined,
    mode: AntInputType.INPUT,
    onOk: (value: string) => Promise.resolve(),
    onCancel: () => {},
  });

  /** 弹窗 - 驳回面板 */
  const modalState = reactive<{
    visible: boolean;
    input: string;
  }>({
    visible: true,
    input: props.value,
  });

  const isInputMode = computed(() => props.mode === AntInputType.INPUT);
  const isPasswordInputMode = computed(() => props.mode === AntInputType.PASSWORD);
  const isTextareaMode = computed(() => props.mode === AntInputType.TEXTAREA);
  const isNumberMode = computed(() => props.mode === AntInputType.NUMBER);
  const isSelectMode = computed(() => props.mode === AntInputType.SELECT);

  /** 确认 */
  async function handleOk() {
    const { onOk } = props;
    const { input } = modalState;
    await onOk(input);
    modalState.visible = false;
  }

  /** 取消 */
  function handleCancel() {
    console.log(modalState.input);
    const { onCancel } = props;
    onCancel();
    modalState.visible = false;
  }
</script>

<style></style>
