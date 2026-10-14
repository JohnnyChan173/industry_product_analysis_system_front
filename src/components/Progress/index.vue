<template>
  <div class="progress-wrap">
    <div class="progress-outer" :style="outerStyle">
      <div class="progress-bar" :style="barStyle"></div>
      <!-- 文字内置 -->
      <span class="progress-text" :class="{textWhite: needWhiteText}">
        {{ ratioText }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, computed } from "vue";
import { themeColor } from "/@/settings/var";
import { numberToFixed } from "/@/utils/math";

interface Props {
  /** 进度条宽度，默认100，可继续调窄到90/80 */
  barWidth?: number;
  height?: number;
  color?: string;
  /** 0 ~ 1 */
  ratio: number;
}

const props = withDefaults(defineProps<Props>(), {
  barWidth: 100,
  height: 24,
  color: themeColor.primary,
  ratio: 0,
});

// 限制 0~1
const realRatio = computed(() => Math.max(0, Math.min(props.ratio, 1)));
const ratioText = computed(() => numberToFixed(realRatio.value * 100));

// 进度大于阈值，文字白色；否则深色（防止浅蓝底色上白字看不见）
const needWhiteText = computed(() => realRatio.value >= 0.3);

const outerStyle = computed(() => ({
  width: props.barWidth + "px",
  height: props.height + "px",
  borderRadius: props.height + "px",
  backgroundColor: "#f0f4f9",
}));

const barStyle = computed(() => ({
  width: realRatio.value * 100 + "%",
  height: "100%",
  backgroundColor: props.color,
  borderRadius: props.height + "px",
  transition: "width 0.35s ease-out",
}));
</script>

<style lang="less" scoped>
.progress-wrap {
  display: inline-flex;
}

.progress-outer {
  position: relative;
  overflow: hidden;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
}

.progress-text {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  // 左侧预留 8px 边距，文字不会贴住圆角
  left: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: #333;

  &.textWhite {
    color: #ffffff;
  }
}
</style>
