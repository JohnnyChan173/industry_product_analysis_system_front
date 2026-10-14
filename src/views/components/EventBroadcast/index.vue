<template>
  <Table
    class="headerify borderify"
    bordered
    rowKey="id"
    :dataSource="formatAddonEventList"
    :columns="columns"
    size="small"
    :pagination="false"
  >
    <template #bodyCell="{ text, record, index, column }: BodyCellData<AddonEventDetail>">
      <!-- 序号 -->
      <template v-if="column.key === 'order'">
        <span>{{ index + 1 }}</span>
      </template>

      <!-- 工位-工序 -->
      <template v-if="column.dataIndex === 'virtualStationInfo'">
        <span class="text-primary">
          {{ record.virtualStationInfo.virtualStationName }}
        </span>
      </template>

      <!-- 生产产品 -->
      <template v-if="column.dataIndex === 'productInfo'">
        <span></span>
        <Tag class="large" color="blue">
          {{ record.productInfo.productName }}
        </Tag>
      </template>

      <!-- 呼叫时间 -->
      <template v-if="column.dataIndex === 'happenDate'">
        <span>
          <!-- <span>{{ record.happenDate.split(" ")[0] }}</span>
          <br /> -->
          <span>{{ record.happenDate.split(" ")[1] }}</span>
        </span>
      </template>

      <!-- 管理人员-->
      <template v-if="column.dataIndex === 'eventStaffInfo'">
        <span>{{ record.eventStaffInfo?.staffName }}</span>
      </template>

      <!-- 事件类型-->
      <template v-if="column.dataIndex === 'eventType'">
        <span class="text-warn">{{ getListItemLabel(AddonEventTypeList, text) }}</span>
      </template>

      <!-- 事件状态 -->
      <template v-if="column.dataIndex === 'eventStatus'">
        <Tag class="large" :color="getEventStatusColor(text)">
          ● {{ getListItemLabel(AddonEventStatusList, text) }}
        </Tag>
      </template>
    </template>
  </Table>
</template>

<script setup lang="ts">
  import { Table, Dropdown, Menu, Divider, Tag } from "ant-design-vue";
  import { withDefaults, defineProps, onMounted, reactive, watch, computed } from "vue";
  import { useTable } from "./useTable";
  import { addonEventListByRegistrationId } from "/@/api/addonEvent";
  import { DownOutlined } from "@ant-design/icons-vue";
  import { BodyCellData } from "/#/antd";
  import { AddonEventDetail } from "/@/api/model/addonEvent";
  import { AddonEventTypeList, AddonEventStatusList, getListItemLabel } from "/@/config/data";
  import { AddonEventStatus } from "/@/enums/model";

  interface Props {
    addonEventList: AddonEventDetail[];
  }

  const props = withDefaults(defineProps<Props>(), {
    addonEventList: () => [],
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  const formatAddonEventList = computed(() => {
    const l = props.addonEventList.slice(-5);
    l.reverse();
    return l;
  });

  // mounted
  onMounted(() => {});

  /** 获取安灯事件颜色 */
  function getEventStatusColor(status: AddonEventStatus) {
    if (status == AddonEventStatus.INVALID) {
      return "";
    } else if (status == AddonEventStatus.PROCESSING) {
      return "blue";
    } else if (status == AddonEventStatus.READY) {
      return "orange";
    } else if (status == AddonEventStatus.PROCESSED) {
      return "#87d068";
    }
  }
</script>

<style lang="less" scoped>
  :deep {
    &.headerify {
      .ant-table-thead > tr > th {
        padding: 4px 16px;
      }
    }
  }
</style>
