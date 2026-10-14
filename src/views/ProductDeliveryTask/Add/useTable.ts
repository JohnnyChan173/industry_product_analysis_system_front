import { ColumnsType } from "ant-design-vue/lib/table";

/** 使用表单 */
export function useTable() {
  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
    },
    {
      title: "出库产品",
      dataIndex: "productId",
      ellipsis: true,
      width: 150,
    },
    {
      title: "库存",
      dataIndex: "stockValueTotal",
      ellipsis: true,
      width: 80,
    },
    {
      title: "出库数量",
      dataIndex: "demandValue",
      ellipsis: true,
      width: 80,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
    },
  ];

  return {
    columns,
  };
}
