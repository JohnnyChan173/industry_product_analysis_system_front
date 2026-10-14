/** 页面路由 */
export enum PageEnum {
  LOGIN = "/login",
  REGISTER = "/register",
  PRODUCT_LIST = "/product/list",
  CRAFT_DETAIL = "/craft/detail",

  DASHBOARD_INDEX = "/dashboard/index",
  DATA_ANALY_INDEX = "/dataAnaly/index",
  LINE_DETAIL = "/line/detail",
  PRODUCT_TASK_DETAIL = "/productTask/detail",
  PRODUCT_REGISTRY_DETAIL = "/productRegistry/detail",

  PRODUCT_BOM_DETAIL = "/product/bom",
  MATERIAL_BATCH_LIST = "/materialBatch/list",
  PRODUCT_BATCH_LIST = "/productBatch/list",
  PRODUCT_TASK_LIST = "/productTask/list",
}

/** 线体详情选项 */
export enum LineDetailTabEnum {
  "LINE" = 0,
  "VIRTUAL_LINE" = 1,
}
