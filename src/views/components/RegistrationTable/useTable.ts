import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { RegistrationDetail } from "/@/api/model/registration";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<RegistrationDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      ellipsis: true,
      width: 70,
    },
    {
      title: "登记编号",
      dataIndex: "registrationNo",
      ellipsis: true,
      width: 150,
    },
    {
      title: "生产产线",
      dataIndex: "lineInfo",
      width: 110,
    },
    {
      title: "关联任务单",
      dataIndex: "taskInfo",
      ellipsis: true,
      width: 150,
    },
    {
      title: "生产产品",
      dataIndex: "productInfo",
      width: 150,
    },
    {
      title: "计划生产",
      dataIndex: "planProductNumber",
      ellipsis: true,
      width: 90,
    },
    {
      title: "登记产出",
      dataIndex: "beatProductNumber",
      ellipsis: true,
      width: 90,
    },
    {
      title: "实际生产",
      dataIndex: "actualProductNumber",
      ellipsis: true,
      width: 90,
    },
    {
      title: "开始时间",
      dataIndex: "startDate",
      width: 110,
    },
    {
      title: "结束时间",
      dataIndex: "endDate",
      width: 110,
    },
    {
      title: "生产状态",
      dataIndex: "registrationStatus",
      ellipsis: true,
      width: 110,
    },
    {
      title: "操作",
      key: "action",
      width: 90,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
