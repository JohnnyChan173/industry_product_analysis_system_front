<template>
  <div>
    <p class="enter-x text-24px py-20px mb-40px mt-80px flex items-center">
      <span>账号密码找回（手机号方式）</span>
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

      <FormItem name="password" class="enter-x">
        <Input.Password
          class="input-field"
          :style="normalBtnStyle1"
          v-model:value="formData.password"
          placeholder="请输入账号的新密码"
        >
          <template #prefix>
            <UserOutlined class="flex !text-gray-400 !text-18px" />
          </template>
        </Input.Password>
      </FormItem>

      <FormItem class="enter-x">
        <Button type="primary" html-type="submit" :style="normalBtnStyle1" @click="handleModifyClick">确认修改</Button>
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
  import { userChangePasswordByPhone, userPhoneLogin } from "/@/api/user";
  // import { smsEnterpriseChangePassword } from "/@/api/sms";
  import FormCountDown from "/@/components/Form/FormCountDown.vue";
  import { any } from "vue-types";

  const FormItem = Form.Item;

  const router = useRouter();
  const formRef = ref<FormInstance>();
  const { cpFormRules } = useFormRules();
  const { validForm } = useFormUtils(formRef);

  const formData = reactive<UserLoginData>({
    phone: "",
    password: "",
    verifyCode: undefined,
  });

  const countDownStart = ref(false);

  /** 点击 - 修改密码 */
  async function handleModifyClick() {
    const { validForm } = useFormUtils(formRef);
    const values = (await validForm()) as UserLoginData;
    const { phone, verifyCode, password } = values as any;

    await userChangePasswordByPhone({ phone, verifyCode, password });
  }

  /** 点击 - 发送验证码 */
  async function onCountDownClick() {
    // await validForm<UserLoginData>(["phone"]);
    // await smsEnterpriseChangePassword(formData.phone!!);
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
