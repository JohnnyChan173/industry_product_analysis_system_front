import { craftAdd, craftDetail } from "../api/craft";
import { craftProcedureAdd } from "../api/craftProcedure";
import { lineAdd, lineDetail } from "../api/line";
import { CraftInfo, CraftDetail } from "../api/model/craft";
import { CraftProcedureInfo } from "../api/model/craftProcedure";
import { LineInfo } from "../api/model/line";
import { StationInfo } from "../api/model/station";
import { VirtualLineInfo } from "../api/model/virtualLine";
import { VirtualStationDetail, VirtualStationInfo } from "../api/model/virtualStation";
import { stationAdd, stationDetail, stationListAll } from "../api/station";
import { virtualLineAdd, virtualLineDetail } from "../api/virtualLine";
import { virtualStationAdd } from "../api/virtualStation";
import { generateStationName, generateStationNo, randomCraftNo, randomLineNo } from "../config/parse/number";

/** 新增工艺 (工艺比较特殊，存在2块内容) */
export async function addCraft(newCraftData: Partial<CraftInfo>, craftProcedureList: Partial<CraftProcedureInfo>[]) {
  // 新增工艺
  const craftId = await craftAdd(newCraftData);

  // 新增工序列表
  craftProcedureList.forEach((i, index) => {
    i.craftId = craftId;
    i.procedureSort = index;
  });

  // 创建工序
  await craftProcedureAdd(craftProcedureList);

  return craftId;
}

/** 复制工艺 */
export async function copyCraft(id: number) {
  // 先获取详情
  const craftInfo = await craftDetail(id);

  const newCraftData = craftInfo as Partial<CraftInfo>;
  const craftProcedureList = craftInfo.craftProcedureList as Partial<CraftProcedureInfo>[];

  // 去主键、随机编号
  delete newCraftData.id;
  newCraftData.craftNo = randomCraftNo();

  craftProcedureList.forEach((i: Partial<CraftProcedureInfo>, index) => {
    delete i.id;
  });

  await addCraft(newCraftData, craftProcedureList);
}

/** 复制产线 */
export async function copyLine(id: number) {
  // 1、先复制产线
  // 先获取详情
  const lineInfo = await lineDetail(id);
  // 获取工位列表
  const stationList = await stationListAll(lineInfo.id);

  const newLineData = lineInfo as Partial<LineInfo>;
  // 去主键、随机编号
  delete newLineData.id;
  newLineData.lineNo = randomLineNo();

  const newLineId = await lineAdd(newLineData);

  // 2、再复制工位
  for (let i = 0; i < stationList.length; i++) {
    const si = stationList[i] as Partial<StationInfo>;
    // 去主键、注入数据
    delete si.id;
    const stationNo = generateStationNo(i + 1);
    const stationName = generateStationName(i + 1);

    si.stationNo = randomLineNo();
    si.stationName = randomLineNo();

    const newStationData = {
      lineId: newLineId,
      staffId: undefined,
      stationNo,
      stationName,
      stationSort: i,
    } as Partial<StationInfo>;

    // 创建工位
    const newStationId = await stationAdd(newStationData);
  }
  return newLineId;
}

/** 新增虚拟产线 (虚拟产线比较特殊，存在2块内容) */
export async function addVirtualLine(
  newVirtualLineData: Partial<VirtualLineInfo>,
  virtualStationList: Partial<VirtualStationDetail>[]
) {
  // 先创建虚拟产线
  const virtualLineId = await virtualLineAdd(newVirtualLineData);

  // 虚拟工位注入 virtualLineId 与 virtualStationSort
  virtualStationList?.forEach((i, index) => {
    i.virtualLineId = virtualLineId;
    i.virtualStationSort = index;
  });

  const sList = virtualStationList as VirtualStationInfo[];

  // 创建虚拟工位
  await virtualStationAdd(sList);

  return virtualLineId;
}

/** 复制虚拟产线 */
export async function copyVirtualLine(id: number) {
  // 先获取详情
  const virtualLineInfo = await virtualLineDetail(id);

  const newVirtualLineData = virtualLineInfo as Partial<VirtualLineInfo>;
  const virtualStationList = virtualLineInfo.virtualStationList as Partial<VirtualStationDetail>[];

  // 去主键、随机编号
  delete newVirtualLineData.id;
  // 虚拟产线没编号
  // newVirtualLineData.virtualLineNo = randomVirtualLineNo();

  virtualStationList.forEach((i: Partial<VirtualStationDetail>, index) => {
    delete i.id;
  });

  await addVirtualLine(newVirtualLineData, virtualStationList);
}
