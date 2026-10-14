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
      width: 70,
    },
    {
      title: "检测项类型",
      dataIndex: "detectionType",
      width: 70,
    },
    {
      title: "计量值区间",
      key: "detectionMeasureSection",
      width: 90,
    },
    {
      title: "检测要求",
      dataIndex: "detectionDesc",
      width: 220,
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
