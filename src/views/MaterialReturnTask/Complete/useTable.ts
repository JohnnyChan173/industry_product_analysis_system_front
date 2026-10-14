import { ColumnsType } from "ant-design-vue/lib/table";
import { ref } from "vue";
import { MaterialBatchDetail, MaterialBatchInfo } from "/@/api/model/materialBatch";

/** 使用表单 */
export function useTable() {
  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
    },
    {
      title: "批次号",
      dataIndex: "batchNo",
      width: 150,
    },
    {
      title: "供方",
      dataIndex: "supplierInfo",
      width: 150,
    },
    {
      title: "已领量",
      dataIndex: "alreadyPrepareValue",
      width: 90,
    },
    {
      title: "已退量",
      dataIndex: "alreadyReturnValue",
      width: 90,
    },
    {
      title: "单位",
      key: "unit",
      width: 50,
    },
    {
      title: "退量",
      dataIndex: "returnValue",
      width: 90,
    },
  ];

  return {
    columns,
  };
}
