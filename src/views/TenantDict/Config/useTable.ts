import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { DictItemInfo } from "/@/api/model/dictItem";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<DictItemInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
      align: "center",
    },
    {
      title: "数据值",
      key: "itemValue",
      dataIndex: "itemValue",
      width: 110,
      ellipsis: true,
    },
    {
      title: "排序值",
      key: "itemSort",
      dataIndex: "itemSort",
      width: 100,
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      dataIndex: "action",
      width: 130,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
