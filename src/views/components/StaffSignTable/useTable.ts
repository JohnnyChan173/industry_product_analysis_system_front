import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { StaffSignDetail } from "/@/api/model/staffSign";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<StaffSignDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 70,
    },
    {
      title: "工位员工",
      dataIndex: "staffInfo",
    },
    {
      title: "工位名称",
      dataIndex: "virtualStationInfo",
    },
    {
      title: "到岗情况",
      dataIndex: "signStatus",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
