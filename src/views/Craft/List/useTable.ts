import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { CraftDetail } from "/@/api/model/craft";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<CraftDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "工艺编号",
      dataIndex: "craftNo",
      ellipsis: true,
      width: 130,
    },
    {
      title: "工艺名称",
      dataIndex: "craftName",
      ellipsis: true,
      width: 120,
    },
    {
      title: "工艺适用产品",
      dataIndex: "craftProductList",
      width: 520,
      align: "center",
    },
    {
      title: "操作",
      key: "action",
      width: 80,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
