import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { LineDetail } from "/@/api/model/line";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<LineDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
      fixed: "left",
    },
    {
      title: "产线类型",
      dataIndex: "lineType",
      width: 110,
      fixed: "left",
    },
    {
      title: "产线编号",
      dataIndex: "lineNo",
      width: 110,
      fixed: "left",
    },
    {
      title: "产线名称",
      dataIndex: "lineName",
      ellipsis: true,
      width: 130,
      fixed: "left",
    },
    {
      title: "所属车间",
      key: "workshopName",
      ellipsis: true,
      width: 110,
    },
    {
      title: "线长",
      dataIndex: "lineLeaderStaffInfo",
      ellipsis: true,
      width: 90,
    },
    {
      title: "最近登记信息",
      dataIndex: "latestRegistrationInfo",
      width: 160,
    },
    // {
    //   title: "今日过程检",
    //   dataIndex: "todayProcessCharacterSpotcheck",
    //   width: 100,
    // },
    // {
    //   title: "今日产品检",
    //   dataIndex: "todayProductCharacterSpotcheck",
    //   width: 100,
    // },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
