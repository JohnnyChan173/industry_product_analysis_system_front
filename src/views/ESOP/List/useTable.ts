import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ESOPInfo } from "/@/api/model/esop";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ESOPInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
    },
    {
      title: "模组UUID",
      dataIndex: "stationUuid",
      ellipsis: true,
      width: 120,
    },
    {
      title: "虚拟工位名称",
      dataIndex: "virtualStationName",
      width: 120,
    },
    {
      title: "虚拟产线名称",
      dataIndex: "virtualLineName",
      width: 120,
    },

    {
      title: "ESOP方案名称",
      dataIndex: "sopSchemeName",
      width: 240,
    },
    {
      title: "ESOP 文件存储地址",
      dataIndex: "sopFileUrl",
      width: 200,
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
