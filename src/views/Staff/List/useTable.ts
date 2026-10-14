import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { StaffDetail } from "/@/api/model/staff";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<StaffDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 48,
      align: "center",
    },
    {
      title: "员工编号",
      dataIndex: "staffNo",
      width: 80,
    },
    {
      title: "员工账号",
      dataIndex: "userInfo",
      width: 80,
    },
    {
      title: "员工姓名",
      dataIndex: "staffName",
      width: 90,
    },
    {
      title: "员工类型",
      dataIndex: "staffType",
      width: 90,
    },
    {
      title: "手机号",
      key: "phoneNumber",
      width: 100,
    },
    {
      title: "所属车间",
      dataIndex: "workshopInfo",
      width: 90,
    },
    {
      title: "备注",
      key: "memo",
      width: 120,
      align: "center",
    },
    // {
    //   title: "登记工位",
    //   key: "staffSignStation",
    //   width: 90,
    //   ellipsis: true,
    // },
    // {
    //   title: "最近登记开始",
    //   key: "staffSignStart",
    //   width: 90,
    //   ellipsis: true,
    // },
    // {
    //   title: "最近登记结束",
    //   key: "staffSignEnd",
    //   width: 90,
    //   ellipsis: true,
    // },
    {
      title: "操作",
      key: "action",
      width: 130,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
