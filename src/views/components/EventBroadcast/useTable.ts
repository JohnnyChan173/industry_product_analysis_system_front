import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { AddonEventDetail } from "/@/api/model/addonEvent";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<AddonEventDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "呼叫时间",
      dataIndex: "happenDate",
      width: 100,
    },
    {
      title: "工位-工序",
      dataIndex: "virtualStationInfo",
      width: 140,
    },
    {
      title: "事件类型",
      dataIndex: "eventType",
    },
    {
      title: "管理人员",
      dataIndex: "eventStaffInfo",
    },
    {
      title: "事件状态",
      dataIndex: "eventStatus",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
