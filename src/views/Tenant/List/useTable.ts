import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { TenantDetail } from "/@/api/model/tenant";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<TenantDetail[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 60,
      align: "center",
    },
    {
      title: "租户名称",
      dataIndex: "tenantName",
      width: 210,
      ellipsis: true,
    },
    {
      title: "租户主账号",
      key: "tenantMainUsername",
      width: 120,
      ellipsis: true,
    },
    {
      title: "有效期至",
      dataIndex: "validDate",
      width: 120,
      ellipsis: true,
    },
    {
      title: "租户成员",
      dataIndex: "tenantUserTotal",
      width: 100,
    },
    {
      title: "租户状态",
      dataIndex: "tenantStatus",
      width: 100,
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: 160,
    },
  ];

  return {
    dataSource,
    columns,
  };
}
