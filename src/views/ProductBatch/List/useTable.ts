import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductBatchInfo } from "/@/api/model/productBatch";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ProductBatchInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "产品批次号",
      dataIndex: "batchNo",
      ellipsis: true,
      width: 110,
    },
    {
      title: "关联任务单",
      dataIndex: "productTaskInfo",
      ellipsis: true,
      width: 110,
    },
    {
      title: "产品名称",
      dataIndex: "productInfo",
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
