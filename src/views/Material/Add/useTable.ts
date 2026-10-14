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
      title: "规格料号",
      dataIndex: "specsNo",
      width: 110,
    },
    {
      title: "规格",
      dataIndex: "specsName",
      width: 240,
    },
    {
      title: "图号",
      dataIndex: "drawNo",
      width: 90,
    },
    {
      title: "备注",
      dataIndex: "memo",
      width: 90,
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
