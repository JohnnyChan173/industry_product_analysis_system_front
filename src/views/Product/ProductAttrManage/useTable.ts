import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductAttrDetail } from "/@/api/model/productAttr";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ProductAttrDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
    },
    {
      title: "选项名称",
      dataIndex: "attrName",
      width: 100,
      ellipsis: true,
    },
    {
      title: "选项顺序",
      dataIndex: "attrSort",
      width: 70,
      ellipsis: true,
    },
    {
      title: "选项值",
      dataIndex: "productAttrValueList",
      width: 180,
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
