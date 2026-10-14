<template>
  <div>
    <div class="flex items-center">
      <div class="mr-6px">
        <MaterialRelate v-model:materialId="pageState.materialId" v-model:materialSpecsId="pageState.materialSpecsId" />
      </div>
      <Select
        allowClear
        placeholder="输入批次号查询"
        class="w-180px !mr-6px"
        v-model:value="pageState.materialBatchId"
        :showSearch="true"
        showArrow
        :filterOption="false"
        @search="onMaterialBatchSearch"
      >
        <Select.Option v-for="{ id, batchNo } in materialBatchSelectList" :key="id" :value="id">
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
        placeholder="输入物料种类搜索"
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialBatchStockLogData>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 操作时间 -->
          <template v-if="column.dataIndex === 'operationDate'">
            <span>{{ formatDateByDayjs(text, "YYYY-MM-DD HH:mm") }}</span>
          </template>

          <!-- 批次号 -->
          <template v-if="column.dataIndex === 'materialBatchInfo'">
            <span>{{ record.materialBatchInfo.batchNo }}</span>
          </template>

          <!-- 物料名称 -->
          <template v-if="column.dataIndex === 'materialInfo'">
            <MaterialRelate
              class="text-primary"
              :mode="CommonComponentMode.DETAIL"
              :materialId="record.materialId"
              :materialSpecsId="record.materialSpecsId"
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
            <p>{{ getListItemLabel(MaterialBatchStockLogOperationTypeSubList, text) }}</p>
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
  import { MaterialBatchInfo, MaterialBatchStockLogData } from "/@/api/model/materialBatch";
  import { materialBatchDetail, materialBatchList, materialBatchStockLogList } from "/@/api/materialBatch";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { AntButtonWidth } from "/@/enums/antEnum";
  import { useTable } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { debounce, formatDateByDayjs } from "/@/utils/util";
  import {
    BatchStockLogOperationTypeList,
    MaterialBatchStockLogOperationTypeSubList,
    getListItemLabel,
  } from "/@/config/data";
  import MaterialRelate from "/@/views/components/MaterialRelate/index.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { cloneDeep } from "lodash";

  interface Props {
    keyword?: string;
    materialBatchId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    keyword: "",
    materialBatchId: undefined,
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    materialId: undefined,
    materialSpecsId: [],
    materialBatchId: undefined,
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
  const materialBatchSelectList = ref<MaterialBatchInfo[]>([]);

  const debounceToGetList = debounce(toGetList, 200);

  const debounceGetMaterialBatchList = debounce(toGetMaterialBatchList);

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

  /** 获取物料批次列表 */
  async function toGetMaterialBatchList(keyword?: string) {
    const data = { pageNum: 1, pageSize: defaultPageSize, sort: "id desc", keyword };

    const { records } = await materialBatchList(data);
    materialBatchSelectList.value = records;
  }

  /** 物料批次搜索 */
  function onMaterialBatchSearch(input: string) {
    debounceGetMaterialBatchList(input);
  }

  function handleSearch() {
    toGetList();
  }

  async function toGetList() {
    otherState.loading = true;

    const data = cloneDeep(toRaw(pageState));

    // materialSpecsId 需要逗号拼接
    const materialSpecsIdText = data.materialSpecsId;
    data.materialSpecsId = materialSpecsIdText;

    const { records, total } = await materialBatchStockLogList(pageState);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    const { materialBatchId } = props;
    if (materialBatchId) {
      const pbInfo = await materialBatchDetail(materialBatchId);
      materialBatchSelectList.value = [pbInfo];
      pageState.materialBatchId = materialBatchId;
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
