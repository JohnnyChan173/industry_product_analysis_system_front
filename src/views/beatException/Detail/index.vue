<template>
  <div v-loading:absolute="loading" class="min-h-320px">
    <!-- 1、安灯事件信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、安灯事件信息" />
    <Descriptions
      v-if="info"
      :column="1"
      size="small"
      title=""
      :labelStyle="labelStyle"
      :contentStyle="contentStyle"
      bordered
    >
      <Descriptions.Item label="事件编号">{{ info.eventNo }}</Descriptions.Item>
      <Descriptions.Item label="虚拟产线">{{ info.virtualLineInfo.virtualLineName }}</Descriptions.Item>
      <Descriptions.Item label="虚拟工位">
        <TagVirtualStation :info="info.virtualStationInfo" />
      </Descriptions.Item>
      <Descriptions.Item label="生产产品">
        <TagProduct :info="info.productInfo" />
      </Descriptions.Item>
      <Descriptions.Item label="呼叫时间">{{ info.happenDate }}</Descriptions.Item>
      <Descriptions.Item label="事件类型">
        <TagAddonEventType :info="info" />
      </Descriptions.Item>
      <Descriptions.Item label="事件管理人员">{{ info.eventStaffInfo?.staffName }}</Descriptions.Item>
      <Descriptions.Item label="事件状态">
        <TagAddonEventStatus :info="info" />
      </Descriptions.Item>
      <Descriptions.Item label="接收时间">{{ info.receiveDate }}</Descriptions.Item>
      <Descriptions.Item label="处理时间">{{ info.handleDate }}</Descriptions.Item>
      <Descriptions.Item label="处理方式">{{ info.handleMethod }}</Descriptions.Item>
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
  import { addonEventDetail } from "/@/api/addonEvent";
  import { AddonEventDetail } from "/@/api/model/addonEvent";
  import { Descriptions, Tag } from "ant-design-vue";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import TagAddonEventStatus from "../../baseComponents/TagAddonEventStatus.vue";
  import TagAddonEventType from "../../baseComponents/TagAddonEventType.vue";
import TagVirtualStation from "../../baseComponents/TagVirtualStation.vue";

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });

  const loading = ref(false);

  const labelStyle: CSSProperties = {
    textAlign: "right",
    width: "150px",
  };

  const contentStyle: CSSProperties = {};

  const info = ref<AddonEventDetail>();

  onMounted(async () => {
    loading.value = true;

    await toGetNeedInfo();

    loading.value = false;
  });

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    const { id } = props;
    const ainfo = await addonEventDetail(id!!);
    info.value = ainfo;
  }
</script>

<style></style>
