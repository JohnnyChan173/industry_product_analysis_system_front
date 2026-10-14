import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { AddonEventType } from "/@/enums/model";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<any[]>([
    {
      field: "materialEventStaffId",
      id: AddonEventType.MATERIAL,
      addonEventType: AddonEventType.MATERIAL,
      staffId: undefined,
    },
    {
      field: "deviceEventStaffId",
      id: AddonEventType.DEVICE,
      addonEventType: AddonEventType.DEVICE,
      staffId: undefined,
    },
    {
      field: "qualityEventStaffId",
      id: AddonEventType.QUALITY,
      addonEventType: AddonEventType.QUALITY,
      staffId: undefined,
    },
    {
      field: "otherEventStaffId",
      id: AddonEventType.OTHER,
      addonEventType: AddonEventType.OTHER,
      staffId: undefined,
    },
    {
      field: "multipleEventStaffId",
      id: AddonEventType.MULTIPLE,
      addonEventType: AddonEventType.MULTIPLE,
      staffId: undefined,
    },
  ]);



  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 50,
    },
    {
      title: "事件类型",
      dataIndex: "addonEventType",
      ellipsis: true,
      width: 90,
    },
    {
      title: "负责人",
      dataIndex: "staffId",
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
