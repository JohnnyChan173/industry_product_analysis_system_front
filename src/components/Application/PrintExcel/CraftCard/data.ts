import { labelParams, genRowCol, genMainTableDataStyle, textShadow, titleLabelStyle } from "../index";
import { ProductTaskDetail } from "/@/api/model/productTask";
import { getMaterialUnitText, getMaterialWholeText, getProductWholeText } from "/@/config/parse";
import { LineDetail } from "/@/api/model/line";
import { MaterialPrepareTaskDemandInfo } from "/@/api/model/materialPrepareTaskDemand";
import { formatDateByDayjs } from "/@/utils/util";
import { VirtualStationDetail } from "/@/api/model/virtualStation";
import { ProcedureTypeList, getListItemLabel } from "/@/config/data";

/** 生产任务单-基础信息 */
export function getProductTaskTableData(productTaskInfo: ProductTaskDetail, lineInfo: LineDetail) {
  console.log("productTaskInfoproductTaskInfo", productTaskInfo);
  if (!productTaskInfo) {
    return;
  }
  const { taskNo, saleOrderNo, productId, productAttrValueIdsList, planCompleteDate, productNumber, memo } =
    productTaskInfo;
  const { lineName, lineLeaderStaffInfo, workshopInfo } = lineInfo;
  const { staffName } = lineLeaderStaffInfo;
  const { workshopName } = workshopInfo;

  const productWholeName = getProductWholeText(productId, productAttrValueIdsList);

  return {
    r0c0: {
      ...labelParams,
      style: {
        ...labelParams.style,
        width: "110px",
        textShadow,
      },
      text: "生产单号:",
    },
    r0c1: {
      ...labelParams,
      style: {
        ...labelParams.style,
        width: "320px",
      },
      text: taskNo,
    },
    r0c2: {
      ...labelParams,
      style: {
        ...labelParams.style,
        width: "120px",
        textShadow,
      },
      text: "关联销售单号:",
    },
    r0c3: {
      ...labelParams,
      style: {
        ...labelParams.style,
        width: "260px",
      },
      text: saleOrderNo,
    },

    r1c0: {
      ...labelParams,
      text: "生产产品:",
      style: {
        ...labelParams.style,
        textShadow,
      },
    },
    r1c1: {
      ...labelParams,
      text: productWholeName,
    },
    r1c2: {
      ...labelParams,
      text: "计划完成时间:",
      style: {
        ...labelParams.style,
        textShadow,
      },
    },
    r1c3: {
      ...labelParams,
      text: formatDateByDayjs(planCompleteDate),
    },

    r2c0: {
      ...labelParams,
      text: "生产产线:",
      style: {
        ...labelParams.style,
        textShadow,
      },
    },
    r2c1: {
      ...labelParams,
      text: `${workshopName} / ${lineName}`,
    },
    r2c2: {
      ...labelParams,
      text: "线长:",
      style: {
        ...labelParams.style,
        textShadow,
      },
    },
    r2c3: {
      ...labelParams,
      text: staffName,
    },

    r3c0: {
      ...labelParams,
      text: "生产数量:",
      style: {
        ...labelParams.style,
        textShadow,
      },
    },
    r3c1: {
      ...labelParams,
      text: productNumber,
    },
    r3c2: {
      ...labelParams,
      text: "备注:",
      style: {
        ...labelParams.style,
        textShadow,
      },
    },
    r3c3: {
      ...labelParams,
      text: memo,
    },
  };
}

/** 生产任务单-备料单列表 */
export function getMaterialPrepareTaskDemandListTableData(list: MaterialPrepareTaskDemandInfo[]) {
  console.log("listlistlistlist", list);
  const tableHeaderCells = [
    {
      cellKey: "index",
      cellLabel: "序号",
      cellWidth: 34,
      cellHeaderStyle: titleLabelStyle,
      cellBodyStyle: {
        // color: "red",
      },
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) => index + 1,
    },
    {
      cellKey: "materialName",
      cellLabel: "物料名称",
      cellWidth: 145,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) =>
        getMaterialWholeText(record.materialId, record.materialSpecsId).split("-")[0],
    },
    {
      cellKey: "materialSpecs",
      cellLabel: "物料规格",
      cellWidth: 275,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) =>
        getMaterialWholeText(record.materialId, record.materialSpecsId).split("-")[1],
    },
    {
      cellKey: "demand",
      cellLabel: "需求",
      cellWidth: 40,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) => record.demandValue,
    },
    {
      cellKey: "unit",
      cellLabel: "单位",
      cellWidth: 40,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) => getMaterialUnitText(record.materialId),
    },
    {
      cellKey: "batch",
      cellLabel: "领料批次",
      cellWidth: 82,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) => "",
    },
    {
      cellKey: "prepareValue",
      cellLabel: "领料量",
      cellWidth: 82,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) => "",
    },
    {
      cellKey: "returnValue",
      cellLabel: "退料量",
      cellWidth: 82,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: MaterialPrepareTaskDemandInfo, index: number) => "",
    },
  ];

  const headerData: any = {};

  // 标题注入
  for (let i = 0; i < tableHeaderCells.length; i++) {
    const { cellLabel, cellWidth, cellStyle } = tableHeaderCells[i];
    const data = genRowCol(0, i, genMainTableDataStyle(cellLabel, cellWidth, cellStyle));
    Object.assign(headerData, data);
  }

  // 主体注入
  const bodyData = {};

  for (let i = 0; i < list?.length; i++) {
    const info = list[i];

    for (let j = 0; j < tableHeaderCells.length; j++) {
      const { cellTextFn, cellWidth, cellBodyStyle } = tableHeaderCells[j];
      const value = cellTextFn(info, i) as string;

      const d = genRowCol(i + 1, j, genMainTableDataStyle(value, cellWidth, cellBodyStyle));

      Object.assign(bodyData, d);
    }
  }

  const wholeData = Object.assign({}, headerData, bodyData);

  return wholeData;
}

/** 生产任务单-工艺工序列表 */
export function getVirtualStationCraftProcedureListTableData(list: VirtualStationDetail[]) {
  const tableHeaderCells = [
    {
      cellKey: "index",
      cellLabel: "序号",
      cellWidth: 34,
      cellHeaderStyle: titleLabelStyle,
      cellBodyStyle: {
        // color: "red",
      },
      cellTextFn: (record: VirtualStationDetail, index: number) => index + 1,
    },
    {
      cellKey: "procedureName",
      cellLabel: "工序名称",
      cellWidth: 145,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: VirtualStationDetail, index: number) => record.craftProcedureList[0].procedureName,
    },
    {
      cellKey: "procedureType",
      cellLabel: "工序类型",
      cellWidth: 72,
      cellStyle: titleLabelStyle,
      cellTextFn: (record: VirtualStationDetail, index: number) =>
        getListItemLabel(ProcedureTypeList, record.craftProcedureList[0].procedureType),
    },
    {
      cellKey: "procedureDesc",
      cellLabel: "工序描述",
      cellWidth: 368,
      cellStyle: titleLabelStyle,
      cellBodyStyle: { whiteSpace: "normal", textAlign: "left" },
      cellTextFn: (record: VirtualStationDetail, index: number) => record.craftProcedureList[0].procedureDesc,
    },
    {
      cellKey: "operation",
      cellLabel: "操作记录",
      cellWidth: 163,
      cellStyle: titleLabelStyle,
      cellBodyStyle: { whiteSpace: "normal" },
      cellTextFn: (record: VirtualStationDetail, index: number) => "",
    },
  ];

  const headerData: any = {};

  // 标题注入
  for (let i = 0; i < tableHeaderCells.length; i++) {
    const { cellLabel, cellWidth, cellStyle } = tableHeaderCells[i];
    const data = genRowCol(0, i, genMainTableDataStyle(cellLabel, cellWidth, cellStyle));
    Object.assign(headerData, data);
  }

  // 主体注入
  const bodyData = {};

  for (let i = 0; i < list.length; i++) {
    const info = list[i];

    for (let j = 0; j < tableHeaderCells.length; j++) {
      const { cellTextFn, cellWidth, cellBodyStyle } = tableHeaderCells[j];
      const value = cellTextFn(info, i) as string;

      const d = genRowCol(i + 1, j, genMainTableDataStyle(value, cellWidth, cellBodyStyle));

      Object.assign(bodyData, d);
    }
  }

  // 如果list为空 则提示 未检测到虚拟产线，请先创建
  if (list.length === 0) {
    const i = 0;
    const j = 3;
    const { cellWidth, cellBodyStyle } = tableHeaderCells[j];
    const d = genRowCol(
      i + 1,
      j,
      genMainTableDataStyle("(产线&产品 未匹配到【虚拟产线】，请先创建!)", cellWidth, { fontWeight: "bold" })
    );

    Object.assign(bodyData, d);
  }

  const wholeData = Object.assign({}, headerData, bodyData);

  return wholeData;
}
