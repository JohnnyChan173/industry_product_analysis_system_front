<template>
  <div
    class="backBtn flex justify-center items-center !text-primary text-16px hover-opacity"
    :style="normalBtnStyle1"
    @click="handleBackBtnClick"
  >
    <RollbackOutlined class="text-18px pr-4px" />
    <span>返回</span>
  </div>
</template>

<script setup lang="ts">
  import { RollbackOutlined } from "@ant-design/icons-vue";
  import { LoginStateEnum, useLoginState } from "./useLogin";
  import { normalBtnStyle1 } from "/@/config/domStyle";

  const { setLoginState } = useLoginState();

  function handleBackBtnClick() {
    setLoginState(LoginStateEnum.LOGIN);
  }
</script>

<style lang="less" scope>
  .backBtn {
    border: 1px solid @color-primary;
    // padding: 6px 8px;
    // border-radius: @border-radius;
  }
</style>
