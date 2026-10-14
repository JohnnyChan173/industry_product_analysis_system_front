import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { VirtualLineDetail } from "/@/api/model/virtualLine";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<VirtualLineDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
    },

    {
      title: "虚拟产线名称",
      dataIndex: "virtualLineName",
      width: 150,
    },
    {
      title: "所属车间",
      dataIndex: "workshopInfo",
      ellipsis: true,
      width: 110,
    },
    {
      title: "所属产线",
      dataIndex: "lineName",
      ellipsis: true,
      width: 110,
    },

    {
      title: "虚拟工位数",
      dataIndex: "virtualStationTotal",
      ellipsis: true,
      width: 90,
    },
    {
      title: "操作",
      key: "action",
      width: 130,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
