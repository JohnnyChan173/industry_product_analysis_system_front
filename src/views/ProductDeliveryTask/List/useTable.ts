import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductDeliveryTaskInfo } from "/@/api/model/productDeliveryTask";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ProductDeliveryTaskInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "产品出库单编号",
      dataIndex: "deliveryTaskNo",
      width: 130,
    },
    {
      title: "关联销售订单",
      dataIndex: "saleOrderNo",
      width: 110,
    },
    {
      title: "出库产品列表（产品名称+出库数量）",
      dataIndex: "productDeliveryTaskDemandList",
      ellipsis: true,
    },
    {
      title: "产品仓管",
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
      title: "出库单状态",
      dataIndex: "deliveryTaskStatus",
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
