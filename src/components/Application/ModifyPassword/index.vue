<template>
  <FormTitle :size="AntUniversalSize.small" title="1. 账号密码修改" />
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    class="w-520px"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="{ style: { width: '150px' } }"
    ref="formRef"
  >
    <Form.Item name="password" label="原密码">
      <Input.Password v-model:value="formData.password" placeholder="请输入" />
    </Form.Item>
    <Form.Item name="newPassword" label="新密码">
      <Input.Password v-model:value="formData.newPassword" placeholder="请输入" />
    </Form.Item>
    <Form.Item name="rePassword" label="确认密码">
      <Input.Password v-model:value="formData.rePassword" placeholder="请输入" />
    </Form.Item>

    <div class="flex justify-end mb-20px">
      <Button class="" type="primary" :style="normalBtnStyle" @click="handlePasswordChangeClick">修改</Button>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Input, message } from "ant-design-vue";
  import { ref, reactive } from "vue";
  import { getResetCSSPrefix, normalBtnStyle } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import FormTitle from "/@/components/Title/FormTitle.vue";
  import { UserChangePasswordData } from "/@/api/model/user";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { userChangePassword } from "/@/api/user";
  import { useUserInfoStore } from "/@/store";

  const userInfoStore = useUserInfoStore();

  const resetCSSPrefix = getResetCSSPrefix();

  const formRef = ref<FormInstance>();
  const { validForm } = useFormUtils(formRef);

  // 根据原密码修改密码
  const formData = reactive<Partial<UserChangePasswordData>>({
    password: undefined,
    newPassword: undefined,
  });

  const formRules = getFormRules(formData);

  /** 点击 - 修改密码 */
  async function handlePasswordChangeClick() {
    await validForm();

    const { password, newPassword } = formData;
    await userChangePassword({
      password: password!!,
      newPassword: newPassword!!,
    });

    message.success("密码修改成功，请重新登录");

    userInfoStore.logout();
  }
</script>

<style></style>
