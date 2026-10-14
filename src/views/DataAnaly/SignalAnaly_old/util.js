import { cloneDeep } from "lodash-es";
import { numberToFixed, sum } from "/@/utils/math";

/** 导出排行xlsx */
export function exportRankXlsx(balanceList, stationList, headParams) {
  // 通过小时获取平衡信息
  function _getBalanceItemWithHour(hour) {
    const item = balanceList.find((i) => {
      const { balanceDate } = i;
      const curDate = balanceDate.slice(11, 13);
      return hour === Number(curDate);
    });

    return item;
  }

  // 二维数据 excel 映射
  const arr = [];

  // 早8晚9 共14小时
  const hourList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  // 按照工位顺序遍历
  for (let i = 0; i < stationList.length; i++) {
    const s = stationList[i];
    const index = i + 1;
    const stationId = s.id;
    const stationName = s.stationName;
    const hourAverageList = [];
    let hourAverage = 0;

    // 根据14小时取值 注入
    for (let j = 0; j < hourList.length; j++) {
      const hour = hourList[j];

      const bItem = _getBalanceItemWithHour(hour);

      // 如果 平衡信息不存在
      if (!bItem) {
        // 该小时注入 undefined
        hourAverageList.push(undefined);
        continue;
      }

      // 根据工位id 去 stationBalanceMap 中取average
      const { stationBalanceMap } = bItem;

      const sbMapItem = stationBalanceMap[stationId];

      // 如果 平衡工位不存在 注入值是 undefined
      hourAverageList.push(sbMapItem?.average);
    }

    // 计算平均值 (总和/有值数据长度)
    const hourEffectList = hourAverageList.filter((i) => i);
    hourAverage = sum(hourEffectList) / hourEffectList.length;

    // 注入arr
    const data = {
      index,
      stationName,
      hourAverageList,
      hourAverage: numberToFixed(hourAverage, 2),
    };
    arr.push(data);
  }

  // 治理 arr 里的 hourAverageList
  arr.forEach((i) => {
    i.hourAverageList = i.hourAverageList.map((i) => (i ? i : "/"));
  });

  // 将结构展开为 aoa
  const aoaList = arr.map((i) => {
    const { index, stationName, hourAverageList, hourAverage } = i;
    const curArr = [index, stationName, ...hourAverageList, hourAverage];
    return curArr;
  });

  // aoaList 注入头部
  const headArr = _getRankXlsxHead(headParams);

  aoaList.unshift(...headArr);

  // console.log(aoaList);

  const colW = 6;
  const defaultCellParams = {
    s: {
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      font: {
        sz: 12,
        name: "宋体",
      },
      border: {
        top: {
          style: "thin",
          color: {
            rgb: "000000",
          },
        },
        bottom: {
          style: "thin",
          color: {
            rgb: "000000",
          },
        },
        left: {
          style: "thin",
          color: {
            rgb: "000000",
          },
        },
        right: {
          style: "thin",
          color: {
            rgb: "000000",
          },
        },
      },
    },
  };

  const { XLSX } = window;
  const ws = XLSX.utils.aoa_to_sheet(aoaList); /* 新建空workbook，然后加入worksheet */

  // 遍历单元格
  Object.keys(ws).forEach((key) => {
    if (key !== "!ref") {
      // 设置单元格样式
      const params = cloneDeep(defaultCellParams);
      ws[key] = { ...ws[key], ...params };
    }
  });

  // 单元格A1 文字变大加粗
  ws["A1"].s.font.sz = 14;
  ws["A1"].s.font.bold = true;

  // 设置列宽
  ws["!cols"] = [
    { wch: colW * 1.5 },
    { wch: colW * 2.5 },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW },
    { wch: colW * 1.5 },
  ];

  // 设置合并
  ws["!merges"] = [
    // 0行
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },

    // 1行
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
    { s: { r: 1, c: 4 }, e: { r: 1, c: 6 } },
    { s: { r: 1, c: 7 }, e: { r: 1, c: 16 } },

    // 2行
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    { s: { r: 2, c: 2 }, e: { r: 2, c: 15 } },
    { s: { r: 2, c: 16 }, e: { r: 3, c: 16 } },
  ];

  const name = `${headParams.date} ${headParams.lineName}【${headParams.productModel}】-节拍表`;

  const wb = XLSX.utils.book_new(); /*新建book*/

  XLSX.utils.book_append_sheet(wb, ws, "sheet1"); /* 生成xlsx文件(book,sheet数据,sheet命名) */

  XLSX.writeFile(wb, `${name}.xlsx`); /*写文件(book,xlsx文件名称)*/
}

/** 获取排行 xlsx 头部 */
function _getRankXlsxHead(headParams) {
  const { productModel, lineName, staffName, date } = headParams;
  const row1 = ["节拍表"];
  const row2 = [
    "产品型号",
    productModel,
    "产线：" + lineName,
    "",
    "线长：" + staffName,
    "",
    "",
    "日期：" + date,
    ...Array.from({ length: 9 }).fill(""),
  ];
  const row3 = ["序号", "岗位名称", "时间/用时", ...Array.from({ length: 13 }).fill(""), "平均值"];
  const row4 = [
    "",
    "",
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "",
  ];

  const arr = [row1, row2, row3, row4];

  return arr;
}
