import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { WorkshopInfo } from "/@/api/model/workshop";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<WorkshopInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
    },
    {
      title: "车间编号",
      dataIndex: "workshopNo",
    },
    {
      title: "车间名称",
      dataIndex: "workshopName",
    },
    {
      title: "车间主任",
      dataIndex: "staffName",
    },
    {
      title: "操作",
      key: "action",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
