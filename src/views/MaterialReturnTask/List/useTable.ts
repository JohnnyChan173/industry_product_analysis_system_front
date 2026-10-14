import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { MaterialReturnTaskDetail } from "/@/api/model/materialReturnTask";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<MaterialReturnTaskDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "退料单号",
      dataIndex: "returnTaskNo",
      width: 110,
    },
    {
      title: "关联生产单",
      dataIndex: "productTaskInfo",
      width: 110,
    },
    {
      title: "生产产品",
      key: "productInfo",
      width: 160,
    },
    {
      title: "生产数量",
      key: "productNumber",
      width: 90,
    },
    {
      title: "生产产线",
      key: "lineInfo",
      width: 110,
    },
    {
      title: "物料仓管",
      dataIndex: "operationUserInfo",
      width: 110,
    },
    {
      title: "开始时间",
      dataIndex: "startDate",
      width: 110,
    },
    {
      title: "完成时间",
      dataIndex: "completeDate",
      width: 110,
    },
    {
      title: "退料状态",
      dataIndex: "returnTaskStatus",
      width: 110,
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
