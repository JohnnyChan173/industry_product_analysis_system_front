import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { MaterialBatchStockLogData } from "/@/api/model/materialBatch";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<MaterialBatchStockLogData[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
    },
    {
      title: "操作时间",
      dataIndex: "operationDate",
      width: 130,
    },
    {
      title: "批次号",
      dataIndex: "materialBatchInfo",
      width: 130,
    },
    {
      title: "物料名称",
      dataIndex: "materialInfo",
      width: 180,
    },
    {
      title: "操作人员",
      dataIndex: "operationUserInfo",
      ellipsis: true,
      width: 80,
    },
    {
      title: "操作类型",
      dataIndex: "operationType",
    },
    {
      title: "二级类型",
      dataIndex: "operationTypeSub",
    },
    {
      title: "操作前值",
      dataIndex: "beforeValue",
    },
    {
      title: "操作值",
      dataIndex: "value",
    },
    {
      title: "操作后值",
      dataIndex: "afterValue",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
