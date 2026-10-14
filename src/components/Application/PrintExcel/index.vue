<template>
  <div id="print-box">
    <div :id="printDomId" class="print" :style="printContainerStyle">
      <!-- 模式1-工艺流程卡 -->
      <CraftCard v-if="isCraftCardPrintMode" />
      <!-- 功能按钮 -->
      <div id="print-btns" class="print-btns">
        <div>
          <Button @click="handleClose">返回</Button>
          <Button type="primary" @click="handlePrint">打印</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref, nextTick, computed } from "vue";
  import { Button, Radio, Select } from "ant-design-vue";
  import { a4Size } from "./index";
  import { usePrintStore } from "/@/store";
  import { $ } from "/@/utils/dom";
  import CraftCard from "./CraftCard/index.vue";

  const printStore = usePrintStore();

  const isCraftCardPrintMode = computed(() => printStore.printMode === "craft-card");

  const printContainerStyle = {
    width: a4Size.width - 2 + "px",
    minHeight: a4Size.height + "px",
    maxHeight: a4Size.height + "px",
  };

  const printDomId = "print";

  onMounted(() => {
    // 监听打印开始
    window.onbeforeprint = async function () {
      // 隐藏按钮
      const btnsDom = $("#print-btns")!!;
      btnsDom.classList.add("hidden");
    };

    // 监听打印结束
    window.onafterprint = async function () {
      // 关闭打印页
      printStore.setPrintShow(false);
    };
  });

  /** 返回 */
  function handleClose() {
    printStore.setPrintShow(false);
  }

  /** 打印 */
  function handlePrint() {
    // 唤起原生打印
    window.print();
  }
</script>

<style lang="less" scoped>
  .print {
    position: relative;
    // width: 792px;
    // min-height: 1123px;
    background-color: #fff;
    // border-right: 1px solid #000;
    // border-top: 1px solid #000;
    // border-bottom: 1px solid #000;
    color: #000;
    margin-left: 1px;
    font-family: "宋体";
    cursor: pointer;
    &-btns {
      position: absolute;
      right: 0;
      top: 0;
      transform: translateX(100%);
      background-color: #fff;
      padding: 12px;
      border: 1px solid #ccc;
    }
  }
  .title {
    text-align: center;
    // font-weight: bolder;
    text-shadow: 0.15pt 0px 0px black, 0.25pt 0px 0px black, 0.35pt 0px 0px black, -0.25pt 0px 0px black,
      0px 0.25pt 0px black, 0px -0.25pt 0px black;
    font-size: 28px;
    padding-bottom: 16px;
  }
</style>
