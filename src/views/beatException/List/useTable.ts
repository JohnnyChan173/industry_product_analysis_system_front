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
      title: "虚拟产线",
      dataIndex: "virtualLineName",
      ellipsis: true,
      width: 280,
    },
    {
      title: "登记编号",
      dataIndex: "registrationNo",
      width: 150,
    },
    {
      title: "虚拟工位",
      dataIndex: "virtualStationName",
      width: 150,
    },
    {
      title: "节拍累计时间平均值",
      dataIndex: "sumAvg",
      width: 200,
    },
    {
      title: "节拍单次耗时",
      dataIndex: "singleConSum",
      width: 120,
    },
    {
      title: "标准节拍",
      dataIndex: "standardBeat",
      width: 110,
    },
    {
      title: "登记状态",
      dataIndex: "registrationStatus",
      width: 110,
    },
    {
      title: "上报时间",
      dataIndex: "startDate",
      width: 110,
    },
    {
      title: "异常类型",
      dataIndex: "beatType",
      width: 110,
    },
    {
      title: "节拍异常信息",
      dataIndex: "exDesc",
    },
  ];

  return {
    dataSource,
    columns,
  };
}
