<template>
  <div>
    <div class="flex items-center">
      <div class="mr-6px">
        <ProductRelate
          v-model:productId="pageState.productId"
          v-model:productAttrValueIdsList="pageState.productAttrValueIdsList"
        />
      </div>
      <Select
        allowClear
        placeholder="输入批次号查询"
        class="w-180px !mr-6px"
        v-model:value="pageState.productBatchId"
        :showSearch="true"
        showArrow
        :filterOption="false"
        @search="onProductBatchSearch"
      >
        <Select.Option v-for="{ id, batchNo } in productBatchSelectList" :key="id" :value="id">
          {{ batchNo }}
        </Select.Option>
      </Select>

      <Select
        allowClear
        placeholder="操作类型"
        v-model:value="pageState.operationType"
        style="width: 120px; margin-right: 6px"
      >
        <Select.Option v-for="{ label, value } in BatchStockLogOperationTypeList" :key="value" :value="value">
          {{ label }}
        </Select.Option>
      </Select>

      <Input.Search
        :style="{ width: AntButtonWidth.xl }"
        class=""
        v-model:value="pageState.keyword"
        placeholder="输入产品名称搜索"
        enter-button="搜索"
        @search="handleSearch"
      />
    </div>

    <div class="mt-12px">
      <Table
        bordered
        class="headerify borderify"
        size="small"
        rowKey="id"
        :loading="otherState.loading"
        :dataSource="dataSource"
        :columns="columns"
        :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductBatchStockLogData>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 操作时间 -->
          <template v-if="column.dataIndex === 'operationDate'">
            <span>{{ formatDateByDayjs(text, "YYYY-MM-DD HH:mm") }}</span>
          </template>

          <!-- 批次号 -->
          <template v-if="column.dataIndex === 'productBatchInfo'">
            <span>{{ record.productBatchInfo.batchNo }}</span>
          </template>

          <!-- 产品名称 -->
          <template v-if="column.dataIndex === 'productInfo'">
            <ProductRelate
              class="text-primary"
              :mode="CommonComponentMode.DETAIL"
              :productId="record?.productId"
              :productAttrValueIdsList="record?.productAttrValueIdsList"
            />
          </template>

          <!-- 操作人员 -->
          <template v-if="column.dataIndex === 'operationUserInfo'">
            <p>{{ record.operationUserInfo?.nickname }}</p>
          </template>

          <!-- 操作类型 -->
          <template v-if="column.dataIndex === 'operationType'">
            <p>{{ getListItemLabel(BatchStockLogOperationTypeList, text) }}</p>
          </template>

          <!-- 二级类型 -->
          <template v-if="column.dataIndex === 'operationTypeSub'">
            <p>{{ getListItemLabel(ProductBatchStockLogOperationTypeSubList, text) }}</p>
          </template>

          <!-- 操作值 -->
          <template v-if="column.dataIndex === 'value'">
            <p class="text-primary">{{ text }}</p>
          </template>

          <!-- 操作后值 -->
          <template v-if="column.dataIndex === 'afterValue'">
            <p>{{ text }}</p>
          </template>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Input, Select, Table } from "ant-design-vue";
  import { ref, withDefaults, defineProps, onMounted, reactive, watch, toRaw } from "vue";
  import { ProductBatchInfo, ProductBatchStockLogData } from "/@/api/model/productBatch";
  import { productBatchDetail, productBatchList, productBatchStockLogList } from "/@/api/productBatch";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { AntButtonWidth } from "/@/enums/antEnum";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { debounce, delay, formatDateByDayjs, parseList2Ids } from "/@/utils/util";
  import {
    BatchStockLogOperationTypeList,
    ProductBatchStockLogOperationTypeSubList,
    getListItemLabel,
  } from "/@/config/data";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";

  interface Props {
    keyword?: string;
    productBatchId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    keyword: "",
    productBatchId: undefined,
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    productId: undefined,
    productAttrValueIdsList: "",
    productBatchId: undefined,
    operationType: undefined,
    operationTypeSub: undefined,
    keyword: props.keyword,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();
  const productBatchSelectList = ref<ProductBatchInfo[]>([]);

  const debounceToGetList = debounce(toGetList, 200);

  const debounceGetProductBatchList = debounce(toGetProductBatchList);

  // 重置页码
  watch([() => pageState.keyword], () => {
    pageState.pageNum = 1;
  });

  // 检测变化刷新列表
  watch(
    () => pageState,
    () => {
      debounceToGetList();
    },
    { deep: true }
  );

  onMounted(async () => {
    await toGetNeedInfo();
    toGetList();
  });

  /** 获取产品批次列表 */
  async function toGetProductBatchList(keyword?: string) {
    const data = { pageNum: 1, pageSize: defaultPageSize, sort: "id desc", keyword };

    const { records } = await productBatchList(data);
    productBatchSelectList.value = records;
  }

  /** 产品批次搜索 */
  function onProductBatchSearch(input: string) {
    debounceGetProductBatchList(input);
  }

  function handleSearch() {
    toGetList();
  }

  async function toGetList() {
    otherState.loading = true;

    const data = {
      ...pageState,
      productAttrValueIdsList: parseList2Ids(pageState.productAttrValueIdsList),
    };

    const { records, total } = await productBatchStockLogList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(pageState);
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    const { productBatchId } = props;
    if (productBatchId) {
      const pbInfo = await productBatchDetail(productBatchId);
      productBatchSelectList.value = [pbInfo];
      pageState.productBatchId = productBatchId;
    }
  }
</script>

<style lang="less" scoped>
  :deep {
    .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > thead > tr > th {
      padding: 2px 8px;
    }
  }
</style>
