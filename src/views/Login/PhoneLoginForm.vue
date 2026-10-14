<template>
  <div>
    <p class="enter-x text-24px py-20px mb-40px mt-80px flex items-center">
      <span>企业手机号登录</span>
    </p>

    <Form autocomplete="on" class="enter-x" :model="formData" :rules="cpFormRules" ref="formRef">
      <FormItem name="phone" class="enter-x">
        <Input
          class="input-field"
          :style="normalBtnStyle1"
          v-model:value="formData.phone"
          placeholder="请输入您的手机号"
        >
          <template #prefix>
            <UserOutlined class="flex !text-gray-400 !text-18px" />
          </template>
        </Input>
      </FormItem>

      <FormItem name="verifyCode" class="enter-x">
        <Input
          class="input-field"
          :style="normalBtnStyle1"
          v-model:value="formData.verifyCode"
          placeholder="请输入验证码"
        >
          <template #prefix>
            <LockFilled class="flex !text-gray-400 !text-18px" />
          </template>

          <template #addonAfter>
            <FormCountDown v-model="countDownStart" @click="onCountDownClick" @finish="onCountDownFinish" />
          </template>
        </Input>
      </FormItem>

      <FormItem class="enter-x">
        <Button type="primary" html-type="submit" :style="normalBtnStyle1" @click="handleLogin">登录</Button>
      </FormItem>

      <FormItem class="enter-x">
        <BackBtn />
      </FormItem>
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance, message } from "ant-design-vue";
  import { Form, Input, Button } from "ant-design-vue";
  import { computed, reactive, ref, unref } from "vue";
  import { UserOutlined, LockFilled, SwapOutlined } from "@ant-design/icons-vue";
  import { LoginStateEnum, useFormRules, useLoginState } from "./useLogin";
  import { useFormUtils } from "/@/hooks/antd/form";
  import { useRouter } from "vue-router";
  import { PageEnum } from "/@/enums/pageEnum";
  import { normalBtnStyle1 } from "/@/config/domStyle";
  import { UserLoginData } from "/@/api/model/user";
  import { useUserInfoStore } from "/@/store";
  import BackBtn from "./BackBtn.vue";
  import { userPhoneLogin } from "/@/api/user";
  // import { smsEnterpriseLogin } from "/@/api/sms";
  import FormCountDown from "/@/components/Form/FormCountDown.vue";

  const FormItem = Form.Item;

  const router = useRouter();
  const formRef = ref<FormInstance>();
  const { cpFormRules } = useFormRules();
  const { validForm } = useFormUtils(formRef);

  const formData = reactive<UserLoginData>({
    phone: "",
    verifyCode: undefined,
  });

  const countDownStart = ref(false);

  /** 点击 - 登录 */
  async function handleLogin() {
    const { validForm } = useFormUtils(formRef);
    const values = (await validForm()) as UserLoginData;
    const { phone, verifyCode } = values;

    const { login } = useUserInfoStore();
    login({ phone, verifyCode });
  }

  /** 点击 - 发送验证码 */
  async function onCountDownClick() {
    // await validForm<UserLoginData>(["phone"]);
    // await smsEnterpriseLogin(formData.phone!!);
    // message.success("验证码已发送，请注意查收");
    // countDownStart.value = true;
  }

  /** 监听 - 验证码倒计时完成 */
  function onCountDownFinish() {
    console.log("finish");
  }
</script>

<style lang="less" scoped>
  :deep {
    .input-field .ant-input {
      font-size: @font-size;
    }
  }
</style>
