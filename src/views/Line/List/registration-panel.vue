<template>
  <div class="min-h-300px">
    <!-- 1、生产登记-基础信息 -->
    <SubTitle class="!text-gray-800" :size="AntUniversalSize.small" title="1、生产登记-基础信息" />
    <Descriptions
      v-if="info"
      :column="1"
      size="small"
      title=""
      :labelStyle="labelStyle"
      :contentStyle="contentStyle"
      bordered
    >
      <Descriptions.Item label="登记编号">{{ info?.registrationNo }}</Descriptions.Item>
      <Descriptions.Item label="关联生产单">{{ info?.taskInfo?.taskNo }}</Descriptions.Item>
      <Descriptions.Item label="生产产品">
        <ProductRelate
          class="text-primary"
          :mode="CommonComponentMode.DETAIL"
          :productId="info?.productId"
          :productAttrValueIdsList="info?.productAttrValueIdsList"
        />
      </Descriptions.Item>
      <Descriptions.Item label="计划生产">{{ info?.planProductNumber }}</Descriptions.Item>
      <Descriptions.Item label="实际生产">{{ info?.actualProductNumber }}</Descriptions.Item>
      <Descriptions.Item label="生产描述">{{ info?.memo }}</Descriptions.Item>

      <Descriptions.Item label="登记开始">{{ info?.startDate }}</Descriptions.Item>
      <Descriptions.Item label="登记完成">
        {{ info?.endDate }}
      </Descriptions.Item>
      <Descriptions.Item label="登记状态">
        <TagRegistrationStatus :value="info?.registrationStatus" />
      </Descriptions.Item>
    </Descriptions>
  </div>
</template>

<script setup lang="ts">
  import {
    onMounted,
    ref,
    reactive,
    unref,
    withDefaults,
    defineProps,
    defineEmits,
    computed,
    CSSProperties,
  } from "vue";
  import { AntUniversalSize } from "/@/enums/antEnum";

  import { Descriptions, Tag } from "ant-design-vue";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import TagRegistrationStatus from "/@/views/baseComponents/TagRegistrationStatus.vue";
  import { RegistrationDetail } from "/@/api/model/registration";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";

  interface Props {
    info?: RegistrationDetail;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });

  const labelStyle: CSSProperties = {
    textAlign: "right",
    width: "130px",
    padding: "4px 8px",
  };

  const contentStyle: CSSProperties = {
    padding: "4px 8px",
  };

  onMounted(async () => {});

  /** 获取必要信息 */
  async function toGetNeedInfo() {}
</script>

<style></style>
