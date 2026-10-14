<template>
  <Table
    class="headerify borderify !w-420px"
    bordered
    rowKey="id"
    :loading="loading"
    :dataSource="staffSignList"
    :columns="columns"
    :pagination="false"
    size="small"
  >
    <template #bodyCell="{ text, record, index, column }: BodyCellData<StaffSignDetail>">
      <!-- 序号 -->
      <template v-if="column.key === 'order'">
        <span>{{ index + 1 }}</span>
      </template>

      <!-- 工位员工 -->
      <template v-if="column.dataIndex === 'staffInfo'">
        {{ record.staffInfo?.staffName || "/" }}
      </template>

      <!-- 工位名称 -->
      <template v-if="column.dataIndex === 'virtualStationInfo'">
        {{ record.virtualStationInfo.virtualStationName || "/" }}
      </template>

      <!-- 到岗情况 -->
      <template v-if="column.dataIndex === 'signStatus'">
        <TagStaffSignStatus :info="record" />
      </template>
    </template>
  </Table>
</template>

<script setup lang="ts">
  import { Table } from "ant-design-vue";
  import { withDefaults, defineProps, onMounted, ref } from "vue";
  import { useTable } from "./useTable";
  import { useRouter } from "vue-router";
  import { BodyCellData } from "/#/antd";
  import { StaffSignDetail } from "/@/api/model/staffSign";
  import TagStaffSignStatus from "../../baseComponents/TagStaffSignStatus.vue";

  interface Props {
    staffSignList: StaffSignDetail[];
  }

  const props = withDefaults(defineProps<Props>(), {
    staffSignList: () => [],
  });

  const router = useRouter();

  /** 其他数据 */
  const loading = ref(false);

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  // mounted
  onMounted(() => {
    toGetNeedInfo();
  });

  /** 获取必要数据 */
  async function toGetNeedInfo() {}
</script>

<style lang="less" scoped></style>
