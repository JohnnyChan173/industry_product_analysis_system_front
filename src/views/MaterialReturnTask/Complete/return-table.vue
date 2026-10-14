<template>
  <div class="mt">
    <section v-for="(mpItem, index) in props.materialPrepareTaskDemandList" :key="mpItem.id">
      <div class="mt-title" :class="getPrepareTitleClass(mpItem)">
        <div class="flex items-center">
          <span>{{ index + 1 }}- </span>
          <MaterialRelate
            :mode="CommonComponentMode.DETAIL"
            :materialId="mpItem.materialId"
            :materialSpecsId="mpItem.materialSpecsId"
          />
          <span class="ml-6px text-gray-400 font-bold">
            [{{ mpItem.demandValue }}<TextMaterialUnit :materialId="mpItem.materialId" />]
          </span>
        </div>
        <!-- <p class="mt-title-number">
          <span> 领:{{ getWillPrepareValue(mpItem) }} / 需:{{ getNeedPrepareValue(mpItem) }}</span>
        </p> -->
      </div>
      <div class="mt-table">
        <Table
          class="headerify borderify"
          bordered
          rowKey="uuid"
          :dataSource="mpItem.materialBatchList.filter((i) => i.alreadyPrepareValue)"
          :columns="curColumns"
          size="small"
          :pagination="false"
        >
          <template #emptyText>
            <span class="text-gray-400">物料暂无可用批次</span>
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

            <!-- 供方 -->
            <template v-if="column.dataIndex === 'supplierInfo'">
              <span v-if="record.supplierInfo">{{ record.supplierInfo.supplierName }}</span>
              <span v-else class="text-gray-400">(无供方)</span>
            </template>

            <!-- 已领量 -->
            <template v-if="column.dataIndex === 'alreadyPrepareValue'">
              <span>{{ record.alreadyPrepareValue || "/" }} </span>
            </template>

            <!-- 已退量 -->
            <template v-if="column.dataIndex === 'alreadyReturnValue'">
              <span>{{ record.alreadyReturnValue || "/" }} </span>
            </template>

            <!-- 单位 -->
            <template v-if="column.key === 'unit'">
              <TextMaterialUnit :materialId="record.materialId" />
            </template>

            <!-- 退量 -->
            <template v-if="column.dataIndex === 'returnValue'">
              <InputNumber
                v-model:value="record.returnValue"
                :min="0"
                placeholder="请输入"
                @change="handleReturnValueChange"
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
  import { MaterialPrepareTaskItemDetail, MaterialPrepareTaskItemInfo } from "/@/api/model/materialPrepareTaskItem";
  import { MaterialPrepareTaskDemandInfo } from "/@/api/model/materialPrepareTaskDemand";
  import MaterialRelate from "/@/views/components/MaterialRelate/index.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { MaterialPrepareTaskDemandDetail } from "/@/api/model/materialPrepareTaskDemand";
  import { cloneDeep } from "lodash";
  import { MaterialBatchDetail, MaterialBatchDetailExpand } from "/@/api/model/materialBatch";
  import { useColumnsTools } from "/@/hooks/web/useColumnsTools";
  import { MaterialReturnTaskItemInfo } from "/@/api/model/materialReturnTaskItem";
  import TextMaterialUnit from "/@/views/baseComponents/TextMaterialUnit.vue";

  interface Props {
    materialPrepareTaskDemandList: MaterialPrepareTaskDemandDetail[];
    materialPrepareTaskItemList: MaterialPrepareTaskItemInfo[];
    materialReturnTaskItemList: MaterialReturnTaskItemInfo[];
    prepareTaskComplete: boolean;
    hideColumns?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    materialPrepareTaskDemandList: () => [],
    materialPrepareTaskItemList: () => [],
    materialReturnTaskItemList: () => [],
    prepareTaskComplete: false,
  });

  const emits = defineEmits(["update:materialPrepareTaskDemandList", "update:prepareTaskComplete"]);
  const { columns } = useTable();
  const { curColumns, toHideColumns } = useColumnsTools(columns);

  toHideColumns(props.hideColumns);

  watch(
    [() => props.materialPrepareTaskDemandList, () => props.materialPrepareTaskItemList],
    () => {
      toUpdatePrepareTableItemList();
      // toCheckPrepareComplete();
    },
    { immediate: true }
  );

  /** 变更备料项 */
  function toUpdatePrepareTableItemList() {
    console.log("udpate");
    const {
      materialPrepareTaskDemandList: dList,
      materialPrepareTaskItemList: iList,
      materialReturnTaskItemList: riList,
    } = props;
    // 注入预计备料数量
    for (let i = 0; i < dList.length; i++) {
      const pi = dList[i];
      const { demandValue, materialBatchList, materialId } = pi;

      //  根据需求量 按顺序赋予批次 prepareValue 初始值
      for (let j = 0; j < materialBatchList.length; j++) {
        const mbi = materialBatchList[j];
        const { stockValue, id: materialBatchId } = mbi;

        // 注入已领量
        const alreadyPrepareValue = iList
          .filter((k) => k.materialBatchId === materialBatchId)
          .reduce((total, prev) => total + prev.value, 0);

        // 注入已退量
        const alreadyReturnValue = riList
          .filter((k) => k.materialBatchId === materialBatchId)
          .reduce((total, prev) => total + prev.value, 0);

        mbi.materialId = materialId;
        mbi.alreadyPrepareValue = alreadyPrepareValue;
        mbi.alreadyReturnValue = alreadyReturnValue;

        // 初始化退量
        mbi.returnValue = 0;
      }
    }
  }

  /** 获取备料标题样式 */
  function getPrepareTitleClass(demandInfo: MaterialPrepareTaskDemandDetail) {
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

  /** 检测全部备料情况 */
  function toCheckPrepareComplete() {
    const { materialPrepareTaskDemandList: dList, materialPrepareTaskItemList: iList } = props;

    const isAllComplete = dList.every((i) => getWillPrepareValue(i) >= getNeedPrepareValue(i));

    if (isAllComplete) {
      emits("update:prepareTaskComplete", true);
    } else {
      emits("update:prepareTaskComplete", false);
    }
  }

  /** 领量变化 */
  function handleReturnValueChange() {
    // 检测是部分备料 或全部备料
    toCheckPrepareComplete();

    const { materialPrepareTaskDemandList } = props;
    emits("update:materialPrepareTaskDemandList", materialPrepareTaskDemandList);
  }

  /** 获取 预备料数量 */
  function getWillPrepareValue(demandInfo: MaterialPrepareTaskDemandDetail) {
    // 对应物料 批次列表下 计数器 prepareValue 的累和
    const { materialBatchList } = demandInfo;
    const tableItem = materialBatchList as MaterialBatchDetailExpand[];
    const sum = tableItem.reduce((total, prev) => total + (prev.prepareValue || 0), 0);
    return sum;
  }

  /** 获取 已备料数量 */
  function getAlreadyPrepareValue(demandInfo: MaterialPrepareTaskDemandDetail) {
    const { materialId, materialSpecsId, id } = demandInfo;
    const { materialPrepareTaskItemList: itemList } = props;

    // 必须严格匹配
    const sum = itemList.reduce((total: number, prev) => {
      const isMatch = prev.id === id && prev.materialId === materialId && prev.materialSpecsId === materialSpecsId;
      if (isMatch) {
        total += prev.value;
      }
      return total;
    }, 0);

    return sum;
  }

  /** 获取 待备料数量 */
  function getNeedPrepareValue(demandInfo: MaterialPrepareTaskDemandDetail) {
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
      padding-top: 12px;
      font-size: 16px;
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
