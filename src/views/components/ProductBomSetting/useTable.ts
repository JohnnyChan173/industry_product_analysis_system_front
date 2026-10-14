import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductBomDetail } from "/@/api/model/productBom";

/** 使用表单 */
export function useTable() {
  // const dataSource = ref<ProductBomDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
    },
    {
      title: "物料类型",
      key: "materialType",
      width: 100,
    },
    {
      title: "规格料号",
      key: "materialSpecsNo",
      width: 110,
    },
    {
      title: "物料名称",
      key: "materialName",
      width: 150,
    },
    {
      title: "规格名称",
      key: "materialSpecsName",
      width: 260,
    },
    {
      title: "图号",
      key: "materialSpecsDrawNo",
      width: 100,
    },
    {
      title: "用量",
      dataIndex: "value",
      align: "center",
      width: 100,
    },
    {
      title: "单位",
      key: "materialUnit",
      align: "center",
      width: 50,
    },
    {
      title: "库存",
      dataIndex: "batchStockTotal",
      align: "center",
      width: 70,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
    },
  ];

  return {
    // dataSource,
    columns,
  };
}
