<template>
  <p class="text-primary hover-opacity w-70px" @click="handleVerifyCodeClick">{{ countDownText }}</p>
</template>

<script setup lang="ts">
  import { computed, defineProps, ref, unref, defineEmits, watch } from "vue";
  import { IntervalHandle } from "/#/global";
  import { defaultCountDown } from "/@/config";

  const props = defineProps({
    btnText: {
      type: String,
      default: "发送验证码",
    },
    baseCountDown: {
      type: Number,
      default: defaultCountDown,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["finish", "update:modelValue", "click"]);
  // +1s 即countDownText 计算属性计算
  const countDown = ref(props.baseCountDown);

  let countDownTimer: IntervalHandle;

  const countDownText = computed(() => {
    const isStart = props.modelValue;
    const val = unref(countDown);
    return isStart ? `已发送(${val}s)` : props.btnText;
  });

  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        startCountDown();
      }
    }
  );

  /** 点击 - 获取验证码 */
  function handleVerifyCodeClick() {
    if (!props.modelValue) {
      emit("click");
    }
  }

  function startCountDown() {
    countDownTimer = setInterval(() => {
      countDown.value--;
      if (countDown.value === 0) {
        stopCountDown();
        emit("finish");
      }
    }, 1000);
  }

  function stopCountDown() {
    emit("update:modelValue", false);
    countDown.value = props.baseCountDown;
    clearInterval(countDownTimer);
  }
</script>

<style></style>
