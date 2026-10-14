import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { IndustryconfgInfo } from "/@/api/model/Industryconfg";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<IndustryconfgInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
    },
    {
      title: "应用名称",
      dataIndex: "configName",
      ellipsis: true,
      width: 120,
    },
    {
      title: "应用值",
      dataIndex: "configValue",
      width: 120,
    },
    {
      title: "应用类型",
      dataIndex: "configType",
      width: 120,
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
