import { REGISTRATION_NO_END_DATE_OFFSET } from "..";
import { DetectionInfo, SignalDataInfo } from "/@/api/model";
import { CraftProcedureInfo } from "/@/api/model/craftProcedure";
import { LineInfo } from "/@/api/model/line";
import { MaterialInfo } from "/@/api/model/material";
import { MaterialPurchaseItemInfo } from "/@/api/model/materialPurchaseItem";
import { MaterialSpecsInfo } from "/@/api/model/materialSpecs";
import { ProductDetail, ProductInfo } from "/@/api/model/product";
import { ProductAttrValueInfo } from "/@/api/model/productAttrValue";
import { RegistrationDetail, RegistrationInfo } from "/@/api/model/registration";
import { SignalBeatData } from "/@/api/model/signal";
import { StaffSignDetail } from "/@/api/model/staffSign";
import { VirtualStationDetail, VirtualStationInfo } from "/@/api/model/virtualStation";
import { AddonEventStatus, CommonCheck, LineType, ProcedureType, StaffType } from "/@/enums/model";
import { themeColor } from "/@/settings/var";
import { useDataStore, useUserInfoStore } from "/@/store";
import { formatDateByDayjs } from "/@/utils/util";

/** 是工装板线 */
export function isGZBLine(lineType?: LineType) {
  return lineType === LineType.GZB;
}

/** 是皮带线 */
export function isPDXLine(lineType?: LineType) {
  return lineType === LineType.PDX;
}

/** 判断是否可以操作（通过操作用户id比较） */
export function canOperation(record: { operationUserId: number }) {
  const { userId } = useUserInfoStore();
  const { operationUserId } = record;
  // 如果操作用户不存在 即未接单 也允许操作
  if (!operationUserId) {
    return true;
  } else if (operationUserId === userId) {
    return true;
  } else {
    return false;
  }
}

/** 判断产品是否已存在于列表 */
export function isProductExistInList(
  productId: number,
  productAttrValueIdsList: number[],
  list: Array<{ productId: number; productAttrValueIdsList: number[] }>
) {
  if (productId) {
    // 判断是否已添加
    const existItem = list.find(
      (i) => i.productId === productId && i.productAttrValueIdsList.join("") === productAttrValueIdsList.join("")
    );

    return !!existItem;
  } else {
    return false;
  }
}

/** 计获采购订单总金额 */
export function getMaterialPurchasePriceTotal(materialPurchaseItemList: MaterialPurchaseItemInfo[]) {
  const priceTotal = materialPurchaseItemList.reduce((total, item) => total + item.price * item.value || 0, 0);
  return priceTotal;
}

/** 物料单位文案 */
export function getMaterialUnitText(materialId: number) {
  const dataStore = useDataStore();

  const materialInfo = dataStore.materialListAll.find((i) => i.id === materialId);
  if (materialInfo) {
    const materialUnitId = materialInfo.dictItemMaterialUnitInfo.itemValue;
    const text = `${materialUnitId}`;
    return text;
  } else {
    return "";
  }
}

/** 物料名称文案 */
export function getMaterialWholeText(materialId: number, materialSpecsId: number) {
  const dataStore = useDataStore();

  const materialInfo = dataStore.materialListAll.find((i) => i.id === materialId);
  if (materialInfo) {
    const materialSpecsInfo = materialInfo.materialSpecsList.find((i) => i.id === materialSpecsId);
    const materialName = materialInfo.materialName;
    const specsName = materialSpecsInfo?.specsName;
    const text = `${materialName}-${specsName}`;
    return text;
  } else {
    return "";
  }
}

/** 产品名称文案 */
export function getProductWholeText(productId: number, productAttrValueIdsList: number[]) {
  const dataStore = useDataStore();

  const { productListAll, productAttrValueList } = dataStore;
  const pavIds = productAttrValueIdsList || [];

  if (!productId) {
    return "";
  }

  // 找产品id
  const productInfo = productListAll.find((i) => i.id === productId)!!;

  const { productName,productNo,productModel } = productInfo;
  console.log(productInfo, "============");
  const selectAttrValueList: ProductAttrValueInfo[] = [];
  // 找选项值
  for (let i = 0; i < pavIds.length; i++) {
    const avId = pavIds[i];
    const findAVInfo = productAttrValueList.find((i) => i.id === avId);
    if (findAVInfo) {
      selectAttrValueList.push(findAVInfo);
    }
  }
  const attrText = getProductAttrValueListText(selectAttrValueList);

  if (!attrText) {
    return `${productNo} | ${productName}`;
  } else {
    return `${productNo} | ${productName} / ${attrText}`;
  }
}

/** 检测项计量值区间文案 */
export function getDetectionMeasureSectionText(detectionInfo: DetectionInfo) {
  const { detectionMin, detectionBase, detectionMax } = detectionInfo;
  const text = `${detectionMin}≤CL≤${detectionMax}`;
  return text;
}

/** 产品选项值列表文案 */
export function getProductAttrValueListText(productAttrValueList: ProductAttrValueInfo[], split = ";") {
  // console.log(productAttrValueList, "============");
  return productAttrValueList.map((i) => i.attrValue).join(split);
}

/** 是检测类工序 */
export function isCheckProcedure(item: CraftProcedureInfo) {
  return item && item.procedureType == ProcedureType.CHECK;
}

/** 非检测类工序 */
export function isNotCheckProcedure(item: CraftProcedureInfo) {
  return item && item.procedureType !== ProcedureType.CHECK;
}

/** 获取虚拟工位第一个工序 */
export function getVirtualStationFirstProcedure(item: VirtualStationDetail) {
  return item.craftProcedureList[0];
}

/** 获取虚拟工位颜色 */
export function getVirtualStationColor(item: VirtualStationInfo) {
  if (item.outputStation) {
    return themeColor.success;
  } else {
    return themeColor.primary;
  }
}

/** 是否为普工 */
export function isPuGong(staffType: StaffType) {
  return staffType === StaffType.PUGONG;
}

/** 从虚拟工位列表中 获取产出工位 */
export function getOutputStation(virtualStationList: VirtualStationInfo[]) {
  const findOutputStation = virtualStationList.find((i) => i.outputStation == CommonCheck.TRUE);
  return findOutputStation;
}

/** 从登记列表中 获取产出工位 */
export function getOutputStationFromSignList(staffSignList: StaffSignDetail[]) {
  const findOutputStaff = staffSignList.find((i) => i.virtualStationInfo.outputStation == CommonCheck.TRUE);
  if (findOutputStaff) {
    return findOutputStaff.virtualStationInfo;
  }
}

/** 获取工位文案（通过虚拟工位详情）*/
export function getVirtualStationText(vi: VirtualStationDetail) {
  const { stationInfo, virtualStationName } = vi;
  const { stationNo } = stationInfo;
  const text = `${stationNo}\n${virtualStationName}`;
  return text;
}

/** 处理生产登记开始时间 */
export function formatRegistrationStartDate(rInfo: RegistrationInfo) {
  let { startDate, endDate } = rInfo;
  endDate = formatRegistrationEndDate(rInfo);

  // 如果endDate-startDate大于3天，取近3天的数据
  const endDateTime = new Date(endDate).getTime();
  const startDateTime = new Date(startDate).getTime();

  // 极限开始时间
  const nearStartDateTime = endDateTime - REGISTRATION_NO_END_DATE_OFFSET * 1000 * 60 * 60 * 24;
  const startDateFormat = Math.max(startDateTime, nearStartDateTime) - 1000;
  startDate = formatDateByDayjs(startDateFormat, "YYYY-MM-DD HH:mm:ss");

  return startDate;
}

/** 处理生产登记结束时间 */
export function formatRegistrationEndDate(rInfo: RegistrationInfo) {
  let { endDate } = rInfo;

  if (!endDate) {
    endDate = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
  }

  return endDate;
}

/** 判断信号量是否处于上下限 */
export function isSignalInSection(lineInfo: LineInfo, beatTime: number) {
  // 基于线体节拍水准数据过滤
  const { beatMax, beatMin } = lineInfo;
  // console.log("beatTime", beatMax, beatMin, beatTime);
  if (beatTime <= beatMax && beatTime >= beatMin) {
    return true;
  }
}
