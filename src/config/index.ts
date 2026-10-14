/** 轮询请求 未读消息条目 间隔 */
export const pollingUnreadCountDelay = 1000 * 5;

/** 默认分页大小 */
export const defaultPageSize = 10;

/** 极限页大小 */
export const maxPageSize = 999;

/** 默认排序语句 */
export const defaultSort = "id asc";

/** 上传默认限制大小 */
export const defaultUploadFileSize = 50 * 1024 * 1024;

/** 上传数量默认限制 */
export const defaultUploadMaxCount = 15;

/** 默认验证码倒计时 */
export const defaultCountDown = 30;

/** 产品名称运费 */
export const PRODUCT_NAME_FARE = "运费";

/** 惟实内部信号量专用key */
export const SECURE_KEY = "weishi888";

/** 免登路径 */
export const SSO_PATH = "/ssoLogin";

/** 默认中心限值 */
export const DEFAULT_BEAT_BASE = 200;

/** 无结束时间偏移(天)
 * 由于皮带线特殊性，目前只能计算近4小时内的数据，不然易引发卡顿
 */
export const REGISTRATION_NO_END_DATE_OFFSET = 2 / 24;

/** xlsx模板路径 */
export const XLSX_TEMPLATE_PATH = {
  PRODUCT: "/template-product.xlsx",
  MATERIAL: "/template-material.xlsx",
  DICT: "/template-dictionary.xlsx",
  TENANT_DICT: "/template-tenant-dictionary.xlsx",
  STAFF: "/template-staff.xlsx",
};
