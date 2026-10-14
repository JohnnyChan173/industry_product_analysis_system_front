import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { LineInfo, LineRankInfo } from "/@/api/model/line";
import { StaffInfo, StaffRankInfo } from "/@/api/model/staff";

/** 使用线体排行表单 */
export function useLineRankTable() {
  const dataSource = ref<LineRankInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "排名",
      key: "order",
      width: 60,
    },
    {
      title: "线体名称",
      dataIndex: "lineName",
      ellipsis: true,
      width: 180,
    },
    {
      title: "生产速率(h)",
      dataIndex: "hourProduction",
      ellipsis: true,
      width: 100,
    },
  ];

  return {
    dataSource,
    columns,
  };
}

/** 使用员工排行表单 */
export function useStaffRankTable() {
  const dataSource = ref<StaffRankInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "排名",
      key: "order",
      width: 60,
    },

    {
      title: "员工名称",
      dataIndex: "staffName",
      ellipsis: true,
      width: 180,
    },
    {
      title: "生产速率(h)",
      dataIndex: "hourProduction",
      ellipsis: true,
      width: 100,
    },
  ];

  return {
    dataSource,
    columns,
  };
}

/** 使用岗位排行表单 */
export function useStationRankTable() {
  const dataSource = ref<any[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
      align: "right",
    },
    {
      title: "岗位名称",
      dataIndex: "name",
      ellipsis: true,
      width: 130,
    },
    // {
    //   title: "有效次数",
    //   dataIndex: "count",
    //   ellipsis: true,
    //   width: 100,
    //   // sorter: true,
    // },
    {
      title: "平均节拍",
      dataIndex: "average",
      ellipsis: true,
      width: 100,
      // sorter: true,
      // defaultSortOrder: "ascend",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
