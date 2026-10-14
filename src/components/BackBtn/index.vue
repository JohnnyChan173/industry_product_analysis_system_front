<template>
  <div>
    <Button class="!bg-white" type="primary" ghost @click="handleClick">
      <RollbackOutlined />
      {{ props.title }}
    </Button>
  </div>
</template>

<script setup lang="ts">
  import { defineProps } from "vue";
  import { Button } from "ant-design-vue";
  import { RollbackOutlined } from "@ant-design/icons-vue";
  import { useRouter } from "vue-router";

  const props = defineProps({
    title: {
      type: String,
      default: "返回",
    },
    click: {
      type: Function,
    },
  });

  const router = useRouter();

  function handleClick() {
    const { click } = props;
    if (click) {
      click();
    } else {
      router.back();
    }
  }
</script>

<style></style>
