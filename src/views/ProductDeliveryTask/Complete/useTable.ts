import { ColumnsType } from "ant-design-vue/lib/table";
import { ref } from "vue";

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
      title: "库存",
      dataIndex: "stockValue",
      width: 90,
    },
    {
      title: "已出库量",
      dataIndex: "alreadyPrepareValue",
      width: 90,
    },
    {
      title: "出库量",
      dataIndex: "prepareValue",
      width: 90,
    },
  ];

  return {
    columns,
  };
}
