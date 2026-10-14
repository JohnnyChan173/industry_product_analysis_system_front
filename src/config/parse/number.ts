import { getTimeNo, randomId } from "/@/utils/util";

// 编号映射表
enum NumberNames {
  PRODUCT_NO = "",
  MATERIAL_NO = "",

  WORKSHOP_NO = "",
  LINE_NO = "",
  CRAFT_NO = "",
  SUPPLIER_NO = "",
  STAFF_NO = "",

  PRODUCT_TASK_NO = "PT",
  PRODUCT_DELIVERY_TASK_NO = "PDT",

  MATERIAL_PURCHASE_NO = "MP",

  MATERIAL_BATCH_NO = "MB",
  PRODUCT_BATCH_NO = "PB",
}

/** 生成默认工位编号 */
export function generateStationNo(sort: number) {
  const numberText = Number(sort).toString().padStart(3, "0");
  const no = `GW${numberText}`;
  return no;
}

/** 生成默认工位名称 */
export function generateStationName(sort: number) {
  const numberText = sort;
  const no = `工位${numberText}`;
  return no;
}

/** 随机员工编号 */
export function randomStaffNo() {
  const prefix = NumberNames.STAFF_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机供应商编号 */
export function randomSupplierNo() {
  const prefix = NumberNames.SUPPLIER_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机线体编号 */
export function randomLineNo() {
  const prefix = NumberNames.LINE_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机车间编号 */
export function randomWorkshopNo() {
  const prefix = NumberNames.WORKSHOP_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机工艺编号 */
export function randomCraftNo() {
  const prefix = NumberNames.CRAFT_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机物料编号 */
export function randomMaterialNo() {
  const prefix = NumberNames.MATERIAL_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机产品编码 */
export function randomProductNo() {
  const prefix = NumberNames.PRODUCT_NO;
  const randomNo = randomId().slice(0, 4).toLocaleUpperCase();
  return prefix + randomNo;
}

/** 随机生产任务单编号 */
export function randomProductTaskNo() {
  const prefix = NumberNames.PRODUCT_TASK_NO;
  const dateText = getTimeNo();
  return prefix + dateText;
}

/** 随机产品出库任务单编号 */
export function randomProductDeliveryTaskNo() {
  const prefix = NumberNames.PRODUCT_DELIVERY_TASK_NO;
  const dateText = getTimeNo();
  return prefix + dateText;
}

/** 随机物料批次编号 */
export function randomMaterialBatchNo() {
  const prefix = NumberNames.MATERIAL_BATCH_NO;
  const dateText = getTimeNo();
  return prefix + dateText;
}

/** 随机产品批次编号 */
export function randomProductBatchNo() {
  const prefix = NumberNames.PRODUCT_BATCH_NO;
  const dateText = getTimeNo();
  return prefix + dateText;
}

/** 随机物料采购单编号 */
export function randomMaterialPurchaseNo() {
  const prefix = NumberNames.MATERIAL_PURCHASE_NO;
  const dateText = getTimeNo();
  return prefix + dateText;
}
