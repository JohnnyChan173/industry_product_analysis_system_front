<template>
  <Table
    class="headerify borderify"
    bordered
    rowKey="id"
    :loading="loading"
    :dataSource="dataSource"
    :columns="columns"
    :pagination="false"
    size="small"
  >
    <template #bodyCell="{ text, record, index, column }: BodyCellData<RegistrationDetail>">
      <!-- 序号 -->
      <template v-if="column.key === 'order'">
        <span>{{ index + 1 }}</span>
      </template>

      <!-- 生产产线 -->
      <template v-if="column.dataIndex === 'lineInfo'">
        {{ record.lineInfo.lineName }}
      </template>

      <!-- 关联任务单 -->
      <template v-if="column.dataIndex === 'taskInfo'">
        {{ record.taskInfo.taskNo || "/" }}
      </template>

      <!-- 生产产品 -->
      <template v-if="column.dataIndex === 'productInfo'">
        <ProductRelate
          class="text-primary"
          :mode="CommonComponentMode.DETAIL"
          :productId="record.productId"
          :productAttrValueIdsList="record.productAttrValueIdsList"
        />
      </template>

      <!-- 计划生产 -->
      <template v-if="column.dataIndex === 'planProductNumber'">
        <span> {{ record.planProductNumber }}</span>
      </template>

      <!-- 实际生产 -->
      <template v-if="column.dataIndex === 'actualProductNumber'">
        <span class="font-bold text-primary">{{ text ? text : "/" }}</span>
      </template>

      <!-- 开始时间 -->
      <template v-if="column.dataIndex === 'startDate'">
        <span v-if="text">
          <span>{{ record.startDate.split(" ")[0] }}</span>
          <br />
          <span>{{ record.startDate.split(" ")[1] }}</span>
        </span>
        <span v-else class="text-gray-400">/</span>
      </template>

      <!-- 结束时间 -->
      <template v-if="column.dataIndex === 'endDate'">
        <span v-if="text">
          <span>{{ record.endDate.split(" ")[0] }}</span>
          <br />
          <span>{{ record.endDate.split(" ")[1] }}</span>
        </span>
        <span v-else class="text-gray-400">/</span>
      </template>

      <!-- 登记状态 -->
      <template v-if="column.dataIndex === 'registrationStatus'">
        <TagRegistrationStatus :value="record.registrationStatus" />
      </template>

      <template v-if="column.key === 'action'">
        <span class="text-primary hover-opacity" @click="handleRegistrationDetail(record.id)">查看</span>
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
  import { RegistrationDetail } from "/@/api/model/registration";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import TagRegistrationStatus from "../../baseComponents/TagRegistrationStatus.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { registrationListByProductTaskNo } from "/@/api/registration";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";

  interface Props {
    taskNo: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    taskNo: "",
  });

  const router = useRouter();

  /** 其他数据 */
  const loading = ref(false);

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  // mounted
  onMounted(() => {
    toGetNeedInfo();

    // 获取列表
    toGetList();
  });

  /** 获取必要数据 */
  async function toGetNeedInfo() {}

  /** 获取登记列表 */
  async function toGetList() {
    loading.value = true;

    const records = await registrationListByProductTaskNo(props.taskNo);
    dataSource.value = records;

    loading.value = false;
  }

  /** 点击 - 查看登记 */
  function handleRegistrationDetail(id: number) {
    const query = {
      id,
    };

    router.push({
      path: PageEnum.PRODUCT_REGISTRY_DETAIL,
      query,
    });
  }
</script>

<style lang="less" scoped></style>
