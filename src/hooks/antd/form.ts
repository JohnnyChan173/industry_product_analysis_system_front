import type { FormInstance } from "ant-design-vue";
import { NamePath } from "ant-design-vue/lib/form/interface";
import type { Ref } from "vue";
import { unref } from "vue";

/** Form 工具类 */
export function useFormUtils(formRef: Ref<FormInstance | undefined>) {
  /** 校验表单 */
  function validForm<T>(nameList?: Extract<keyof T, string>[]) {
    /** 校验ref是否存在 */
    const form = unref(formRef);
    if (form) {
      return form.validateFields(nameList);
    } else {
      return Promise.reject("form 不存在");
    }
  }

  /** 重置表单 */
  function resetForm() {
    /** 校验ref是否存在 */
    const form = unref(formRef);
    if (form) {
      return form.resetFields();
    } else {
      return Promise.reject("form 不存在");
    }
  }

  return {
    validForm,
    resetForm,
  };
}
