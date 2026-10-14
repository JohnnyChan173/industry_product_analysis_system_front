<template>
  <div :class="prefixCls" class="h-full <xl:bg-gray-300">
    <!-- 顶部板块省略 -->
    <div class="container h-full">
      <div class="left h-full hidden">
        <div class="left-image h-full"></div>
      </div>

      <div class="right h-full flex">
        <div class="m-auto login-panel">
          <AppLogo class="enter-x" />

          <div class="enter-x flex justify-center">
            <LoginForm v-if="loginFormShow" />
            <!-- <PhoneLoginForm v-else-if="phoneLoginFormShow" /> -->
            <!-- <ForgetPasswordForm v-else-if="forgetPasswordFormShow" /> -->
          </div>

          <div class="enter-x flex justify-center mt-80px">
            <AppCopyright />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { AppLogo, AppCopyright } from "/@/components/Application";
  import { useDesign } from "/@/hooks/web/useDesign";
  import LoginForm from "./LoginForm.vue";
  // import PhoneLoginForm from "./PhoneLoginForm.vue";
  // import ForgetPasswordForm from "./ForgetPasswordForm.vue";
  import { LoginStateEnum, useFormRules, useLoginState } from "./useLogin";
  import { computed, unref } from "vue";

  const { getLoginState } = useLoginState();

  const loginFormShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);
  const phoneLoginFormShow = computed(() => unref(getLoginState) === LoginStateEnum.PHONE_LOGIN);
  const forgetPasswordFormShow = computed(() => unref(getLoginState) === LoginStateEnum.FORGET_PASSWORD);

  const { prefixCls } = useDesign("login");
</script>

<style lang="less" scoped>
  @prefix-cls: ~"@{namespace}-login";

  .@{prefix-cls} {
    .container {
      max-width: none !important;
      background: @color-bcg;
      // background: url(/@/assets/bcg-1.jpeg), linear-gradient(rgb(219, 166, 166), rgb(0, 0, 172));
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;

      .center();

      .left {
        flex: 1.1;

        &-image {
          width: 100%;
          // background-image: url(/@/assets/gongniu-img.png);
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center center;
        }
      }

      .right {
        flex: 0.8;
        // @media (max-width: @screen-xl) {
        background: @color-bcg;
        // }
        background-color: transparent;

        .login-panel {
          background-color: #fff;

          // @media (max-width: @screen-xl) {
          .simple-shadow();

          padding: 3em 6em;
          border-radius: @border-radius;
          // }
        }
      }
    }
  }
</style>
