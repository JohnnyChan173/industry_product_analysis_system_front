import { onMounted, onUnmounted, ref } from "vue";

/** 表格列工具 */
export function useColumnsTools(columns: any[]) {
  const curColumns = ref<any[]>(columns);

  /** 隐藏列 */
  function toHideColumns(hColumns?: string) {
    if (!hColumns) {
      return;
    }
    const hl = hColumns.split(",");
    const newColumns = columns.filter((i) => !hl.includes(i.key) && !hl.includes(i.dataIndex));
    curColumns.value = newColumns;
  }

  return {
    curColumns,
    toHideColumns,
  };
}
