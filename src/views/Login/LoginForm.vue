<template>
  <div>
    <p class="enter-x text-24px py-20px mb-40px mt-80px">用户登录</p>

    <Form autocomplete="false" class="enter-x" :model="formData" :rules="cpFormRules" ref="formRef">
      <FormItem name="username" class="enter-x">
        <Input
          class="input-field"
          :style="normalBtnStyle1"
          v-model:value="formData.username"
          placeholder="请输入用户账号"
        >
          <template #prefix>
            <UserOutlined class="flex !text-gray-400 !text-18px" />
          </template>
        </Input>
      </FormItem>

      <FormItem name="password" class="enter-x">
        <InputPassword
          class="input-field"
          :style="normalBtnStyle1"
          v-model:value="formData.password"
          placeholder="请输入密码"
        >
          <template #prefix>
            <LockFilled class="flex !text-gray-400 !text-18px" />
          </template>
        </InputPassword>
      </FormItem>

      <!-- 
      <div class="enter-x flex justify-between text-primary pt-12px pb-28px">
        <p class="flex items-center hover-opacity" @click="handleTogglePhoneLoginClick">
          <SwapOutlined style="font-size: 18px; padding-right: 5px" />
          切换手机号登录
        </p>
        <p class="text-primary hover-opacity" @click="handleForgetPasswordClick">忘记密码?</p>
      </div> -->

      <FormItem class="enter-x">
        <Button type="primary" html-type="submit" :style="normalBtnStyle1" @click="handleLogin">登录</Button>
      </FormItem>
    </Form>

    <div class="flex justify-end items-center">
      <!-- <p class="text-gray-400">
        还没有账号?
        <span class="pl-5px text-primary hover-opacity" @click="handleRegisterClick">立即注册</span></p
      > -->
      <p class="text-gray-400">(联系管理员获取平台主账号)</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance, message } from "ant-design-vue";
  import { Form, Input, Button } from "ant-design-vue";
  import { reactive, ref } from "vue";
  import { UserOutlined, LockFilled, SwapOutlined } from "@ant-design/icons-vue";
  import { LoginStateEnum, useFormRules, useLoginState } from "./useLogin";
  import { useFormUtils } from "/@/hooks/antd/form";
  import { useRouter } from "vue-router";
  import { PageEnum } from "/@/enums/pageEnum";
  import { normalBtnStyle1 } from "/@/config/domStyle";
  import { UserLoginData, UserLoginInfo } from "/@/api/model/user";
  import { useUserInfoStore } from "/@/store";
  import { isDevMode } from "/@/utils/env";
  import authStorage from "/@/utils/storage/auth";
import { createLoading } from "/@/components/Loading/createLoading";

  const FormItem = Form.Item;
  const InputPassword = Input.Password;

  let testUsername = authStorage.getLastAccount();
  let testPassword = "";
  // if (isDevMode()) {
  //   testUsername = "nbqx";
  //   testPassword = "TeiFn_87213%";
  // }

  const router = useRouter();
  const formRef = ref<FormInstance>();
  const { cpFormRules } = useFormRules();
  const { validForm } = useFormUtils(formRef);

  const formData = reactive<UserLoginInfo>({
    // username: "",
    // password: "",
    username: testUsername,
    password: testPassword,
  });

  const { getLoginState, setLoginState } = useLoginState();

  /** 点击 - 登录 */
  async function handleLogin() {
    let close;

    try {
      const values = (await validForm()) as UserLoginData;
      let { username, password } = values;

      const { login } = useUserInfoStore();

      close = createLoading().close;

      await login({ username, password });

      authStorage.setLastAccount(username!!);
    } finally {
      close && close();
    }
  }

  /** 点击 - 注册 */
  async function handleRegisterClick() {
    router.push(PageEnum.REGISTER);
  }

  /** 点击 - 切换手机号登录 */
  async function handleTogglePhoneLoginClick() {
    setLoginState(LoginStateEnum.PHONE_LOGIN);
  }

  /** 点击 - 忘记密码 */
  async function handleForgetPasswordClick() {
    setLoginState(LoginStateEnum.FORGET_PASSWORD);
  }
</script>

<style lang="less" scoped>
  :deep {
    .input-field .ant-input {
      font-size: @font-size;
    }
  }
</style>
