<template>
  <div class="mt">
    <section v-for="(mpItem, index) in props.productDeliveryTaskDemandList" :key="mpItem.id">
      <div class="mt-title" :class="getPrepareTitleClass(mpItem)">
        <div class="flex items-center">
          <span>{{ index + 1 }}- </span>
          <ProductRelate
            :mode="CommonComponentMode.DETAIL"
            :productId="mpItem.productId"
            :productAttrValueIdsList="mpItem.productAttrValueIdsList"
          />
          <span class="ml-6px text-gray-400 font-bold">[{{ mpItem.demandValue }}]</span>
        </div>
        <p class="mt-title-number">
          <span> 领:{{ getWillPrepareValue(mpItem) }} / 需:{{ getNeedPrepareValue(mpItem) }}</span>
        </p>
      </div>
      <div class="mt-table">
        <Table
          class="headerify borderify"
          bordered
          rowKey="uuid"
          :dataSource="mpItem.productBatchList"
          :columns="curColumns"
          size="small"
          :pagination="false"
        >
          <template #emptyText>
            <span class="text-gray-400">产品暂无可用批次</span>
          </template>
          <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialBatchDetailExpand>">
            <!-- 序号 -->
            <template v-if="column.key === 'order'">
              <span>{{ index + 1 }}</span>
            </template>

            <!-- 批次号 -->
            <template v-if="column.dataIndex === 'batchNo'">
              <span>{{ record.batchNo }}</span>
            </template>

            <!-- 库存 -->
            <template v-if="column.dataIndex === 'stockValue'">
              <span>{{ record.stockValue }}</span>
            </template>

            <!-- 已领量 -->
            <template v-if="column.dataIndex === 'alreadyPrepareValue'">
              <span>{{ record.alreadyPrepareValue }}</span>
            </template>

            <!-- 领量 -->
            <template v-if="column.dataIndex === 'prepareValue'">
              <InputNumber
                v-model:value="record.prepareValue"
                :min="0"
                :max="record.stockValue"
                placeholder="请输入"
                @change="handlePrepareValueChange"
              />
            </template>
          </template>
        </Table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { BodyCellData } from "/#/antd";
  import { useTable } from "./useTable";
  import { InputNumber, Table } from "ant-design-vue";
  import { defineEmits, defineProps, withDefaults, computed, watch, ref } from "vue";
  import { ProductDeliveryTaskItemDetail, ProductDeliveryTaskItemInfo } from "/@/api/model/productDeliveryTaskItem";
  import { ProductDeliveryTaskDemandInfo } from "/@/api/model/productDeliveryTaskDemand";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { ProductDeliveryTaskDemandDetail } from "/@/api/model/productDeliveryTaskDemand";
  import { cloneDeep } from "lodash";
  import { MaterialBatchDetail, MaterialBatchDetailExpand } from "/@/api/model/materialBatch";
  import { useColumnsTools } from "/@/hooks/web/useColumnsTools";

  interface Props {
    productDeliveryTaskDemandList: ProductDeliveryTaskDemandDetail[];
    productDeliveryTaskItemList: ProductDeliveryTaskItemInfo[];
    hideColumns?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    productDeliveryTaskDemandList: () => [],
    productDeliveryTaskItemList: () => [],
  });

  const emits = defineEmits(["update:productDeliveryTaskDemandList"]);
  const { columns } = useTable();
  const { curColumns, toHideColumns } = useColumnsTools(columns);

  toHideColumns(props.hideColumns);

  watch(
    [() => props.productDeliveryTaskDemandList, () => props.productDeliveryTaskItemList],
    () => {
      toUpdatePrepareTableItemList();
    },
    { immediate: true }
  );

  /** 变更备料项 */
  function toUpdatePrepareTableItemList() {
    console.log("udpate");
    const { productDeliveryTaskDemandList: dList, productDeliveryTaskItemList: iList } = props;
    // 注入预计备料数量
    for (let i = 0; i < dList.length; i++) {
      const pi = dList[i];
      const { demandValue, productBatchList } = pi;

      const alreadyValue = getAlreadyPrepareValue(pi);

      // 剩余备料数量=备料总量-已备料数量
      let restDemandValue = demandValue - alreadyValue;

      //  根据需求量 按顺序赋予批次 prepareValue 初始值
      for (let j = 0; j < productBatchList.length; j++) {
        const mbi = productBatchList[j];
        const { stockValue, id: productBatchId } = mbi;

        // 注入已领量
        const alreadyPrepareValue = iList
          .filter((k) => k.productBatchId === productBatchId)
          .reduce((total, prev) => total + prev.deliveryValue, 0);
        mbi.alreadyPrepareValue = alreadyPrepareValue;

        // 检测需求是否已分配完
        if (restDemandValue <= 0) {
          // break;
          restDemandValue = 0;
        }

        const prepareValue = Math.min(stockValue, restDemandValue);
        mbi.prepareValue = prepareValue;
        // 需求累减
        restDemandValue -= prepareValue;
      }
    }
  }

  /** 获取备料标题样式 */
  function getPrepareTitleClass(demandInfo: ProductDeliveryTaskDemandDetail) {
    const willValue = getWillPrepareValue(demandInfo);
    const needValue = getNeedPrepareValue(demandInfo);
    console.log(willValue, needValue);
    // 如果已经备齐
    if (needValue === 0) {
      return "text-success";
    } else {
      if (willValue < needValue) {
        return "text-warn";
      } else {
        return "text-success";
      }
    }
  }

  /** 领量变化 */
  function handlePrepareValueChange() {
    const { productDeliveryTaskDemandList } = props;
    emits("update:productDeliveryTaskDemandList", productDeliveryTaskDemandList);
  }

  /** 获取 预备料数量 */
  function getWillPrepareValue(demandInfo: ProductDeliveryTaskDemandDetail) {
    // 对应物料 批次列表下 计数器 prepareValue 的累和
    const { productBatchList } = demandInfo;
    const tableItem = productBatchList;
    const sum = tableItem.reduce((total, prev) => total + (prev.prepareValue || 0), 0);
    return sum;
  }

  /** 获取 已备料数量 */
  function getAlreadyPrepareValue(demandInfo: ProductDeliveryTaskDemandDetail) {
    const { id } = demandInfo;
    const { productDeliveryTaskItemList: itemList } = props;

    // 必须严格匹配
    const sum = itemList.reduce((total: number, prev) => {
      const isMatch = prev.productDeliveryTaskDemandId === id;
      if (isMatch) {
        total += prev.deliveryValue;
      }
      return total;
    }, 0);

    return sum;
  }

  /** 获取 待备料数量 */
  function getNeedPrepareValue(demandInfo: ProductDeliveryTaskDemandDetail) {
    const { demandValue } = demandInfo;
    // 待备料数量 = 备料总数 - 已备料数量
    let needPrepareValue = demandValue - getAlreadyPrepareValue(demandInfo);
    // 不能小于0
    needPrepareValue = Math.max(0, needPrepareValue);
    return needPrepareValue;
  }
</script>

<style lang="less" scoped>
  .mt {
    &-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      // border-bottom: 1px solid #ccc;
      &-number {
        font-size: 16px;
      }
    }
    &-table {
    }
  }
  :deep {
    .mt-table {
      .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > thead > tr > th {
        padding-top: 0;
        padding-bottom: 0;
      }
    }
  }
</style>
