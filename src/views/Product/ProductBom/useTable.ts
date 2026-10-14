import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductAttrInfo } from "/@/api/model/productAttr";
import { ProductAttrValueInfo } from "/@/api/model/productAttrValue";
import { ProductBomDetail } from "/@/api/model/productBom";

/** 分组BOM数据 */
export type GroupBomData = {
  productAttrId: number;
  productAttrInfo: ProductAttrInfo;
  productAttrValueBomList: Array<GroupItemData>;
};

/** 分组选项数据 */
export type GroupItemData = {
  productAttrValueId: number;
  productAttrValueInfo: ProductAttrValueInfo;
  bomList: ProductBomDetail[];
};

/** 使用表单 */
export function useTable() {
  const dataSource = ref<any[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
    },
    {
      title: "选项值",
      key: "productAttrValue",
      width: 100,
      // ellipsis: true,
    },
    {
      title: "选项BOM列表",
      key: "bomList",
      // ellipsis: true,
    },

  ];

  return {
    dataSource,
    columns,
  };
}
