<template>
  <a-table
    :style="computedStyle"
    class="my-table"
    size="small"
    bordered
    :columns="tableColumn"
    :data-source="tableDataSource"
    :showHeader="false"
    :pagination="false"
    :loading="loading"
  >
    <template #bodyCell="{ column, text }"> </template>
  </a-table>
</template>
<script lang="ts" setup>
  import { watch, computed, ref, onMounted, withDefaults, defineProps } from "vue";
  import { Recordable } from "/#/global";
  import { isObject } from "/@/utils/is";

  interface Props {
    /** 表格列数（默认为自动分析） */
    tableCol?: number;
    /** 自定义表格数据 */
    tableData: Recordable | string;
    tableMaxWidth?: number | string;
    size?: "small" | "default" | "large";
  }

  const props = withDefaults(defineProps<Props>(), {
    tableMaxWidth: "100%",
    tableCol: 0,
    tableData: () => "",
    size: "default",
  });

  const loading = ref(false);

  const tableDataSource = ref();
  const tableColumn = ref();
  const computedStyle = computed(() => {
    const { tableMaxWidth } = props;
    if (typeof tableMaxWidth === "number") {
      return {
        maxWidth: tableMaxWidth + "px",
      };
    } else {
      return { maxWidth: tableMaxWidth };
    }
  });

  watch(
    () => props.tableData,
    () => {
      if (props.tableData) {
        loading.value = true;
        formatTableData(props.tableData);
        loading.value = false;
      }
    }
  );

  // onMounted(() => {
  // });

  /** 格式化表单数据 */
  function formatTableData(data: any) {
    const dataSource = generateDataSource(data);
    const column = generateColumn(data);

    console.log(dataSource);
    console.log(column);

    tableDataSource.value = dataSource;
    tableColumn.value = column;
  }

  /** 生成 dataSource */
  function generateDataSource(data: any) {
    const list: any[] = [];
    Object.keys(data).forEach((key) => {
      let value = data[key];

      if (isObject(value)) {
        value = value.text;
      }

      const [r, c] = getRowCol(key);

      // 行列注入数据
      if (!list[r]) {
        list[r] = {
          [c]: value,
        };
      } else {
        list[r][c] = value;
      }
    });

    return list;
  }

  /** 生成 column */
  function generateColumn(data: any) {
    // 行对应每列的配置
    const column: any[] = Array.from({ length: getTableCol() }).map((i, index) => ({ dataIndex: index }));

    // 列自定义回调 [[]]
    const columnCustomCellFns: any[] = Array.from({ length: getTableCol() }).map(() => []);

    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const [r, c] = getRowCol(key);

      let value = data[key];

      if (isObject(value)) {
        const { rowSpan, colSpan } = value;
        // 如果 rowSpan 存在
        if (rowSpan !== undefined) {
          // 行合并
          columnCustomCellFns[c].push({
            index: r,
            rowSpan,
            ...value,
          });

          // 相关行设为0
          for (let j = 1; j < rowSpan; j++) {
            columnCustomCellFns[c].push({
              index: r + j,
              rowSpan: 0,
            });
          }
        } else {
          // 其他参数注入
          columnCustomCellFns[c].push({
            index: r,
            ...value,
          });
        }

        // 如果 colSpan 存在
        if (colSpan !== undefined) {
          // 列合并
          columnCustomCellFns[c].push({
            index: r,
            colSpan,
            ...value,
          });

          // 相关列设为0
          for (let j = 1; j < colSpan; j++) {
            columnCustomCellFns[c + j].push({
              index: r,
              colSpan: 0,
            });
          }
        } else {
          // 其他参数注入
          columnCustomCellFns[c].push({
            index: r,
            ...value,
          });
        }
      }
    }

    // 根据 fns 生成最终 columns
    // console.log(columnCustomCellFns);
    columnCustomCellFns.forEach((fns, index) => {
      // 基于 indexFn 列表去触发回调
      const customCell = (_: any, index: number) => {
        const matchItem = fns.find((i: any) => i.index === index);
        return matchItem;
      };

      column[index].customCell = customCell;
    });

    return column;
  }

  /** 解析行列 */
  function getRowCol(key: any) {
    const matchReg = /r(\d+)|c(\d+)/g;
    // 解析行列
    let [r, c] = key.match(matchReg);
    r = r.slice(1) | 0;
    c = c.slice(1) | 0;
    return [r, c];
  }

  /** 获取表单列数 */
  function getTableCol() {
    const { tableCol, tableData } = props;
    if (tableCol) {
      return tableCol;
    } else {
      let maxCol = 0;
      Object.keys(tableData).forEach((key) => {
        let [, c] = getRowCol(key);
        // 实际列数要+1
        c = c + 1;
        maxCol = Math.max(maxCol, c);
      });
      return maxCol;
    }
  }
</script>

<style lang="less" scoped>
  :deep {
    &.my-table {
      @table-border-color: #000 !important;

      .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > tbody > tr > td {
        border-color: @table-border-color;
      }
      .ant-table-tbody > tr > td {
        border-color: @table-border-color;
      }
      .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table {
        border-color: @table-border-color;
      }
      .ant-table.ant-table-bordered > .ant-table-container > .ant-table-content > table > tbody > tr > td {
        border-color: @table-border-color;
      }
      .ant-table.ant-table-bordered > .ant-table-container {
        border-color: @table-border-color;
      }

      .ant-table-cell {
        color: #000;
        font-size: 15px;
      }
    }
  }
</style>
