import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { SupplierDetail } from "/@/api/model/supplier";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<SupplierDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "供应商编号",
      dataIndex: "supplierNo",
      ellipsis: true,
      width: 130,
    },
    {
      title: "供应商名称",
      dataIndex: "supplierName",
      ellipsis: true,
      width: 180,
    },
    {
      title: "负责人",
      dataIndex: "leader",
      ellipsis: true,
      width: 150,
    },
    {
      title: "联系方式",
      dataIndex: "contract",
      ellipsis: true,
      width: 110,
    },
    {
      title: "备注",
      dataIndex: "memo",
      ellipsis: true,
      width: 110,
    },
    {
      title: "操作",
      key: "action",
      width: 200,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
