<template>
  <section
    v-show="loading"
    class="loading full"
    :class="{ absolute }"
  >
    <div class="loading-content">
      <div class="loading-spinner">
        <span class="loading-spinner__outer"></span>
        <span class="loading-spinner__inner"></span>
      </div>

      <div class="loading-text">
        {{ tip || "数据记载中" }}
        <span class="loading-dots"></span>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
  import { SpinSize } from "ant-design-vue/lib/spin/Spin";
  import { defineComponent, PropType } from "vue";

  export default defineComponent({
    name: "Loading",
    props: {
      tip: {
        type: String as PropType<string>,
        default: "数据记载中",
      },
      size: {
        type: String as PropType<SpinSize>,
        default: "large",
      },
      absolute: {
        type: Boolean as PropType<boolean>,
        default: false,
      },
      loading: {
        type: Boolean as PropType<boolean>,
        default: false,
      },
    },
  });
</script>

<style lang="less" scoped>
  .loading {
    &.full {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2000;
      display: flex;
      width: 100%;
      height: 100%;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      background:
        radial-gradient(
          circle at 50% 45%,
          rgba(24, 144, 255, 0.08),
          transparent 34%
        ),
        rgba(248, 251, 255, 0.82);
      backdrop-filter: blur(1px);
      -webkit-backdrop-filter: blur(1px);
    }

    &.absolute {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 300;
    }
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform: translateY(-12px);
  }

  .loading-spinner {
    position: relative;
    width: 52px;
    height: 52px;
    margin-bottom: 18px;
  }

  .loading-spinner__outer,
  .loading-spinner__inner {
    position: absolute;
    display: block;
    box-sizing: border-box;
    border-radius: 50%;
    border: 3px solid transparent;
  }

  .loading-spinner__outer {
    inset: 0;
    border-top-color: #1677ff;
    border-right-color: #1677ff;
    animation: loading-rotate 0.9s linear infinite;
  }

  .loading-spinner__inner {
    inset: 7px;
    border-bottom-color: #69b1ff;
    border-left-color: #69b1ff;
    animation: loading-rotate-reverse 1.2s linear infinite;
  }

  .loading-text {
    color: #606b7a;
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    letter-spacing: 1px;
    text-align: center;
    white-space: nowrap;
  }

  .loading-dots {
    display: inline-block;
    width: 24px;
    text-align: left;

    &::after {
      content: "";
      animation: loading-dots 1.4s steps(4, end) infinite;
    }
  }

  @keyframes loading-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes loading-rotate-reverse {
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes loading-dots {
    0% {
      content: "";
    }

    25% {
      content: ".";
    }

    50% {
      content: "..";
    }

    75%,
    100% {
      content: "...";
    }
  }
</style>
