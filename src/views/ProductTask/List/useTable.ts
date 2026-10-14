import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductTaskDetail } from "/@/api/model/productTask";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ProductTaskDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
      fixed: "left",
    },
    {
      title: "任务单编号",
      dataIndex: "taskNo",
      width: 130,
    },
    {
      title: "关联销售订单",
      dataIndex: "saleOrderNo",
      width: 130,
    },

    {
      title: "生产产品",
      dataIndex: "productInfo",
      width: 150,
    },
    {
      title: "生产产线",
      dataIndex: "lineInfo",
      width: 100,
    },
    {
      title: "数量",
      dataIndex: "productNumber",
      width: 70,
    },
    {
      title: "计划完成时间",
      dataIndex: "planCompleteDate",
      width: 110,
    },
    {
      title: "备料单状态",
      dataIndex: "materialPrepareTaskInfo",
      width: 110,
    },
    {
      title: "任务单状态",
      dataIndex: "taskStatus",
      width: 110,
    },
    {
      title: "任务单进度",
      key: "progress",
      width: 110,
    },
    {
      title: "退料单状态",
      dataIndex: "materialReturnTaskInfo",
      width: 110,
    },
    {
      title: "关联产品批",
      dataIndex: "productBatchIdList",
      width: 110,
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      fixed: "right",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
