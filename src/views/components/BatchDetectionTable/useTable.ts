import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { ProductDetectionInfo } from "/@/api/model/productDetection";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<ProductDetectionInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 50,
    },
    {
      title: "检测项名称",
      dataIndex: "detectionName",
      width: 110,
    },
    {
      title: "检测项权重",
      dataIndex: "detectionWeight",
      width: 90,
    },
    {
      title: "检测项类型",
      dataIndex: "detectionType",
      width: 90,
    },
    {
      title: "计量值区间",
      key: "detectionMeasureSection",
      width: 100,
    },
    {
      title: "检测要求",
      dataIndex: "detectionDesc",
      width: 280,
    },
    {
      title: "操作",
      key: "action",
    },
    {
      title: "检测结果",
      key: "result",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
