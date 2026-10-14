import { ref } from "vue";
import { ColumnsType } from "ant-design-vue/lib/table";
import { StationInfo } from "/@/api/model/station";
import { AddonEventTypeList } from "/@/config/data";

/** 使用表单 */
export function useTable() {
  const dataSource = ref<StationInfo[]>([]);

  const columns: ColumnsType = [
    {
      title: "序号",
      key: "order",
      width: 64,
    },
    {
      title: "工位编号",
      dataIndex: "stationNo",
      width: 100,
      ellipsis: true,
    },
    {
      title: "工位名称",
      dataIndex: "stationName",
      width: 100,
      ellipsis: true,
    },
    ...AddonEventTypeList.map(({ label, value }) => ({
      title: `${label}管理员`,
      dataIndex: `eventStaffName_${value}`,
      key: `eventStaff_${value}`,
      width: 130,
      ellipsis: true,
    })),
  ];

  // 定义基础数据源
  const table = {
    startId: "", // 起始id
    endId: "", // 结束id
  };

  // 设置行属性方法
  const customRowHandler = (cb: any) => (record: any, index: number) => {
    return {
      props: {
        // draggable: 'true'
      },
      style: {
        cursor: "pointer",
      },
      // 鼠标移入
      onMouseenter: (event: any) => {
        const ev = event || window.event; // 兼容IE
        ev.target.draggable = true;
      },
      // onMousemove: (event: any) => {
      //   const ev = event || window.event; // 兼容IE
      //   ev.target.draggable = false;
      // },
      // 开始拖拽
      onDragstart: (event: any) => {
        const ev = event || window.event; // 兼容IE
        ev.stopPropagation(); // 阻止冒泡
        // 得到源目标数据序号
        table.startId = record.id;
        console.log("startId", table.startId);
      },
      // 拖动元素经过的元素
      onDragover: (event: any) => {
        // 兼容 IE
        const ev = event || window.event;
        // 阻止默认行为
        ev.preventDefault();
      },
      // 拖动到达目标元素
      onDragenter: (event: any) => {
        const ev = event || window.event;
        ev.preventDefault();
        // 设置拖动高亮效果
        const list = document.getElementsByClassName("ant-table-row");
        const node = document.getElementsByClassName("target");
        if (node.length) {
          node[0].classList.remove("target");
        }
        list[index].classList.add("target");
      },
      // 鼠标松开
      onDrop: (event: any) => {
        const ev = event || window.event; // 兼容IE
        ev.stopPropagation(); // 阻止冒泡
        // 得到目标数据序号
        table.endId = record.id;
        console.log("endId", table.endId);

        // 触发排序方法
        cb(table.startId, table.endId);
      },
    };
  };

  return {
    dataSource,
    columns,
    customRowHandler,
  };
}
