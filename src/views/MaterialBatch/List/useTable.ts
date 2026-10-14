import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { MaterialBatchInfo } from "/@/api/model/materialBatch";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<MaterialBatchInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 70,
    },
    {
      title: "物料批次号",
      dataIndex: "batchNo",
      width: 110,
    },
    {
      title: "关联采购单",
      dataIndex: "materialPurchaseInfo",
      width: 110,
    },
    {
      title: "物料名称",
      dataIndex: "materialInfo",
      width: 180,
    },
    {
      title: "批次库存",
      dataIndex: "stockValue",
      width: 90,
      align: "center",
    },
    {
      title: "检测状态",
      dataIndex: "detectionStatus",
      width: 90,
      align: "center",
    },
    {
      title: "批次状态",
      dataIndex: "batchStatus",
      width: 90,
      align: "center",
    },
    {
      title: "总量",
      dataIndex: "supplyValue",
      width: 70,
    },
    {
      title: "操作",
      key: "action",
      width: 140,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
