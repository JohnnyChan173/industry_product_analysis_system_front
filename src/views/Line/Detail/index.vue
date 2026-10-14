<template>
  <div class="detail">
    <div class="detail-tabs">
      <Radio.Group v-model:value="tabIndex" button-style="solid" size="large" @change="handleTabIndexChange">
        <Radio.Button :value="0">物理产线</Radio.Button>
        <Radio.Button :value="1">虚拟产线</Radio.Button>
        <!-- <Radio.Button :value="2">点检历史</Radio.Button> -->
        <!-- <Radio.Button :value="3">XR数据管理</Radio.Button> -->
      </Radio.Group>
      <BackBtn />
    </div>

    <DetailLine v-if="tabIndex === 0" />
    <DetailVirtualLine v-else-if="tabIndex === 1" />
    <div v-else>建设中...</div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { Radio } from "ant-design-vue";
  import BackBtn from "/@/components/BackBtn/index.vue";
  import DetailLine from "/@/views/Line/DetailLine/index.vue";
  import DetailVirtualLine from "/@/views/Line/DetailVirtualLine/index.vue";
  import { parseSearch } from "/@/utils/util";
  import { replaceUrlQuery } from "/@/utils/router";

  const searchTab = Number(parseSearch().tab) || 0;

  const tabIndex = ref(searchTab);

  function handleTabIndexChange() {
    const tab = tabIndex.value;
    replaceUrlQuery({
      tab,
    });
  }
</script>

<style lang="less" scoped>
  .detail {
    padding-bottom: 45px;
    max-width: 1380px;
    &-tabs {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid #ccc;
    }
  }
</style>
