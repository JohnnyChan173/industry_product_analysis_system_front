<template>
  <div class="card">
    <div class="card-line"></div>
    <p class="card-title">{{ title }}</p>
    <section class="card-sec">
      <article
        class="card-sec-art"
        v-for="({ key, text, value1, value2, parseResult, oneValue }, index) in list"
        :key="index"
      >
        <p>{{ text }}</p>
        <p class="text-22px">
          <span v-if="value2" class="text-primary">{{ parseResult }}</span>
          <span v-else class="text-gray-400">/</span>
        </p>
        <p class="text-gray-400">
          <span>[ </span>
          <span v-if="!oneValue">{{ value1 }}</span>
          <span v-if="!oneValue"> / </span>
          <span>{{ value2 }}</span>
          <span> ]</span>
        </p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps, computed, onMounted, watch, reactive, ref, onUnmounted } from "vue";
  import { PlatformBasicDataInfo } from "/@/api/model/statistics";
  import { numberToFixed } from "/@/utils/math";

  interface Props {
    title: string;
    list?: PlatformBasicDataInfo[];
  }

  const props = withDefaults(defineProps<Props>(), {
    title: "",
    list: () => [],
  });
</script>

<style lang="less" scoped>
  .card {
    position: relative;
    display: flex;
    justify-content: space-between;
    // min-width: 160px;
    // min-height: 86px;
    height: 128px;
    box-sizing: border-box;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 5px;
    overflow: hidden;

    .simple-shadow(0px,2px,1px);
    &-line {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
      background-color: @color-primary;
    }
    &-title {
      flex: 0.45;
      font-size: 18px;
      width: 130px;
      white-space: nowrap;
      .center();
    }
    &-sec {
      flex: 0.55;
      .center();

      &-art {
        .center();
        flex-direction: column;
        padding: 0px 14px;
        > p {
          text-align: center;
          white-space: nowrap;
        }
      }
    }
  }
</style>
