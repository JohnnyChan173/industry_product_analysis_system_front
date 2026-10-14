import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { MaterialPurchaseDetail } from "/@/api/model/materialPurchase";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<MaterialPurchaseDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "采购单编号",
      dataIndex: "purchaseNo",
      width: 130,
    },
    {
      title: "供应商对象",
      dataIndex: "supplierInfo",
      width: 110,
    },
    {
      title: "采购物料列表（物料名称+单价+数量）",
      dataIndex: "materialPurchaseItemList",
      ellipsis: true,
    },
    {
      title: "总金额",
      key: "priceTotal",
      width: 90,
    },
    {
      title: "采购单状态",
      dataIndex: "purchaseStatus",
      width: 110,
    },
    {
      title: "关联物料批",
      dataIndex: "materialBatchIdList",
      width: 110,
    },
    {
      title: "操作",
      key: "action",
      width: 140,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
