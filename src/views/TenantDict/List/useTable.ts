import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { DictInfo } from "/@/api/model/dict";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<DictInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
      align: "center",
    },
    {
      title: "字典名称",
      dataIndex: "dictName",
      width: 160,
      ellipsis: true,
    },
    // {
    //   title: "关联车间",
    //   dataIndex: "workshopName",
    //   width: 160,
    //   ellipsis: true,
    // },
    {
      title: "数据量",
      dataIndex: "dictItemTotal",
      width: 160,
      ellipsis: true,
    },
    {
      title: "描述",
      dataIndex: "dictDesc",
      ellipsis: true,
      width: 200,
    },
    {
      title: "操作",
      key: "action",
      width: 220,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
