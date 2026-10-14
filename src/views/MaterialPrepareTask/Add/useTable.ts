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
      title: "采购物料",
      dataIndex: "materialId",
      ellipsis: true,
      width: 150,
    },
    {
      title: "单价",
      dataIndex: "price",
      ellipsis: true,
      width: 80,
    },
    {
      title: "数量",
      dataIndex: "value",
      ellipsis: true,
      width: 80,
    },
    {
      title: "合计",
      key: "priceTotal",
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
