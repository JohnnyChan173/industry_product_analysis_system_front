<template>
  <div @click="handleClick" class="hover-opacity">
    <slot></slot>
  </div>

  <Modal :style="{ minWidth: AntModalWidth.md }" v-model:visible="visible" title="" :footer="null" destroyOnClose>
    <div class="flex justify-center items-center">
      <img
        :src="props.src"
        :style="{
          maxWidth: '620px',
          maxHeight: '75vw',
          objectFit: 'contain',
        }"
      />
    </div>
  </Modal>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps, reactive, computed, ref } from "vue";
  import { Modal, Input, InputNumber } from "ant-design-vue";
  import { AntInputType, AntModalWidth } from "/@/enums/antEnum";

  interface Props {
    src: string;
    defaultVisible?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    src: "",
    defaultVisible: false,
  });

  const visible = ref(props.defaultVisible);

  function handleClick() {
    visible.value = true;
  }
</script>

<style></style>
