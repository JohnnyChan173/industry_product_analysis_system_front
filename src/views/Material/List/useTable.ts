import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { MaterialDetail } from "/@/api/model/material";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<MaterialDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "种类编号",
      dataIndex: "materialNo",
      ellipsis: true,
      width: 100,
    },
    {
      title: "种类名称",
      dataIndex: "materialName",
      ellipsis: true,
      width: 130,
    },
    {
      title: "物料类型",
      dataIndex: "dictItemMaterialTypeId",
      ellipsis: true,
      width: 100,
    },
    {
      title: "单位",
      dataIndex: "dictItemMaterialUnitId",
      ellipsis: true,
      width: 70,
    },
    {
      title: "物料选项列表（规格料号+规格+图号+备注）",
      dataIndex: "materialSpecsList",
      ellipsis: true,
      align: "center",
    },
    {
      title: "操作",
      key: "action",
      width: 190,
    },
  ];

  const materialSpecsColumns: ColumnsType = [
    {
      title: "规格料号",
      dataIndex: "specsNo",
      ellipsis: true,
      width: 110,
    },
    {
      title: "规格",
      dataIndex: "specsName",
      ellipsis: true,
      width: 180,
    },
    {
      title: "图号",
      dataIndex: "drawNo",
      ellipsis: true,
      width: 90,
    },
    {
      title: "备注",
      dataIndex: "memo",
      ellipsis: true,
      width: 90,
    },
  ];

  return {
    dataSource,
    columns,
    materialSpecsColumns,
  };
}
