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
      title: "选项值",
      dataIndex: "attrValue",
      width: 100,
      ellipsis: true,
    },
    {
      title: "选项值顺序",
      dataIndex: "attrValueSort",
      width: 70,
      ellipsis: true,
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
