<template>
  <div class="area-model hover-opacity" :class="genSizeClass" @click="handleClick">
    <div class="area-modelItem">
      <slot name="top"></slot>

      <div class="area-box" :class="{ active }">
        <div class="area-box-graph" :class="isDiamond && 'diamond'" :style="genGraphStyle"></div>
        <p class="area-box-text" :style="{ color: fill ? '#fff' : color }">{{ title }}</p>
        <div class="area-box-arrow"></div>

        <!-- 编辑模式显示 -->
        <template v-if="isEditMode">
          <div>
            <!-- 编辑或删除 -->
            <div class="area-box-utils flex items-center">
              <FormOutlined class="text-22px mr-6px !text-secondary" @click="handleEdit" />
              <Popconfirm title="确认删除？" @confirm="handleDel">
                <DeleteFilled class="text-22px !text-danger" />
              </Popconfirm>
            </div>
          </div>
        </template>
      </div>
      <div class="area-sub">
        {{ subTitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { withDefaults, defineProps, defineEmits, computed } from "vue";
  import { Popconfirm } from "ant-design-vue";
  import { FormOutlined, DeleteFilled } from "@ant-design/icons-vue";
  import { CommonComponentMode, CommonComponentSize } from "/@/enums/commonEnum";
  import { hexToRgba } from "/@/utils/util";

  interface Props {
    mode?: CommonComponentMode;
    size?: CommonComponentSize;
    active?: boolean;
    isDiamond?: boolean;
    fill?: boolean;
    color?: string;
    title?: string;
    subTitle?: string;
    showBackground?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    size: CommonComponentSize.NORMAL,
    active: false,
    isDiamond: false,
    fill: false,
    color: "#666",
    title: "",
    subTitle: "",
    showBackground: true,
    needWristband: false,
  });

  const emits = defineEmits(["select:click", "select:edit", "select:del"]);

  /** 详情模式 */
  const isDetailMode = computed(() => props.mode == CommonComponentMode.DETAIL);
  const isEditMode = computed(() => props.mode == CommonComponentMode.EDIT);

  /** 生成图形样式 */
  const genSizeClass = computed(() => {
    const { size } = props;
    return size === CommonComponentSize.SMALL ? "small" : "";
  });

  /** 生成图形样式 */
  const genGraphStyle = computed(() => {
    const { color, fill, showBackground } = props;

    const style: any = {
      border: `1px solid ${color}`,
      background: showBackground ? hexToRgba(color, 0.1) : "",
    };
    if (fill) {
      style.background = color;
    }
    return style;
  });

  /** 点击-  */
  function handleClick() {
    emits("select:click");
  }

  /** 点击- 编辑 */
  function handleEdit() {
    emits("select:edit");
  }

  /** 点击- 删除 */
  function handleDel() {
    emits("select:del");
  }
</script>

<style lang="less" scoped>
  @model-width: 120px;
  @model-height: 40px;

  @model-width-small: 100px;
  @model-height-small: 30px;

  @arrow-width: 40px;
  @arrow-height: 2px;
  @arrow-size: 6px;
  @arrow-color: #ccc;
  @sub-height: 24px;
  @sub-color: #666;

  .area-model {
    position: relative;
    display: inline-block;
    width: calc(@model-width + @arrow-width);
    height: calc(@model-height + @sub-height);
    display: inline-block;
    padding-left: @arrow-width;
    font-size: 14px;

    &.small {
      width: calc(@model-width-small + @arrow-width);
      height: calc(@model-height-small + @sub-height);
      font-size: 13px;

      .area-box {
        width: @model-width-small;
        height: @model-height-small;
        .area-box-graph {
          width: @model-width-small;
          height: @model-height-small;
          &.diamond {
            width: (@model-width-small / 2);
            height: (@model-width-small / 2);
          }
        }
        .area-box-arrow {
          top: calc((30px - 2px) / 2);
        }
      }
    }
  }

  .area-box {
    position: relative;
    width: @model-width;
    height: @model-height;
    user-select: none;
    .center();

    &.active {
      .area-box-graph {
        border: 2px solid @color-secondary;
        box-shadow: 0 0 2px 1px @color-secondary;
      }
    }
    &:hover {
      .area-box-utils {
        display: block;
      }
    }

    &-graph {
      position: absolute;
      width: @model-width;
      height: @model-height;
      // 菱形化
      &.diamond {
        width: (@model-width / 2);
        height: (@model-width / 2);
        transform: rotate(45deg) skew(-25deg, -25deg);
        border-color: transparent;
      }
    }
    &-text {
      position: relative;
      // z-index: 1;
      width: @model-width;
      text-align: center;
      .ellipsis();
    }

    &-arrow {
      position: absolute;
      width: @arrow-width;
      height: @arrow-height;
      background: @arrow-color;
      top: calc((@model-height - @arrow-height) / 2);
      left: 0;
      transform: translateX(-100%);
      &::after {
        position: absolute;
        content: "";
        right: -@arrow-size;
        top: 50%;
        transform: translateY(-50%);
        // top:0;
        border: @arrow-size solid transparent;
        border-left-color: @arrow-color;
        border-left-width: calc(@arrow-size + 2px);
      }
    }
    &-utils {
      position: absolute;
      display: none;
      right: -8px;
      top: -8px;
      .hover-opacity();
    }
  }
  .area-sub {
    width: 100%;
    height: @sub-height;
    text-align: center;
    color: @sub-color;
    .ellipsis();
  }
</style>
