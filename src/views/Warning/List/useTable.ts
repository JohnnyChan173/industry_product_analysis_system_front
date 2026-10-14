import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { AddonEventDetail } from "/@/api/model/addonEvent";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<AddonEventDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
    },
    {
      title: "事件编号",
      dataIndex: "eventNo",
      ellipsis: true,
      width: 130,
    },
    {
      title: "虚拟产线",
      dataIndex: "virtualLineInfo",
      ellipsis: true,
      width: 150,
    },
    {
      title: "虚拟工位",
      dataIndex: "virtualStationInfo",
      width: 150,
    },
    {
      title: "生产产品",
      dataIndex: "productInfo",
      width: 150,
    },
    {
      title: "呼叫时间",
      dataIndex: "happenDate",
      width: 110,
    },
    {
      title: "管理人员",
      dataIndex: "eventStaffInfo",
      width: 110,
    },
    {
      title: "事件类型",
      dataIndex: "eventType",
      width: 90,
    },
    {
      title: "事件状态",
      dataIndex: "eventStatus",
      width: 90,
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
