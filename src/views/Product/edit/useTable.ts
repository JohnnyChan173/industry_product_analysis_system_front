import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductDetail } from "/@/api/model/product";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ProductDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 48,
    },
    {
      title: "产品编码",
      dataIndex: "productNo",
      width: 200,
    },
    {
      title: "产品名称",
      dataIndex: "productName",
      width: 240,
    },
    {
      title: "产品重量",
      dataIndex: "productWeight",
      width: 120,
    },
    {
      title: "产品型号",
      dataIndex: "productModel",
      width: 120,
    },
    {
      title: "产品类型",
      dataIndex: "dictItemProductTypeId",
      ellipsis: true,
      width: 240,
    },
  ];

  const productAttrColumns: ColumnsType = [
    {
      title: "选项名称",
      dataIndex: "attrName",
      ellipsis: true,
      width: 70,
    },
    {
      title: "选项值列表",
      dataIndex: "productAttrValueList",
      ellipsis: true,
      width: 160,
    },
  ];

  return {
    dataSource,
    columns,
    productAttrColumns
  };
}
