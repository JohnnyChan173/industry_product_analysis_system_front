// V1.2新增

/** 模块功能 */
export enum ModuleAbility {
  "ADDON" = "安灯输入",
  "GENERAL" = "通用输入",
  "WRISTBAND" = "静电手环",
  "GROUND" = "设备接地",
  "SCALE" = "秤盘输入",
}
/** 产线类型（1；工装板线；2皮带线） */
export enum LineType {
  "GZB" = 1,
  "PDX" = 2,
}

/** 产品任务单-类型（0预生产；1销售生产） */
export enum ProductTaskType {
  "PREPARE" = 0,
  "SALE" = 1,
}

/** 产品出库任务单-状态（0待出库；1出库中；2部分出库；3已出库） */
export enum ProductDeliveryTaskStatus {
  "READY" = 0,
  "DOING" = 1,
  "SOME_COMPLETE" = 2,
  "COMPLETE" = 3,
}

/** 产品出库任务单-类型（0销售出库；1直接出库） */
export enum ProductDeliveryTaskType {
  "SALE" = 0,
  "DIRECT" = 1,
}

/** 退料任务单状态（0待退料；1退料中；2部分退料；3已退料） */
export enum MaterialReturnTaskStatus {
  "READY" = 0,
  "DOING" = 1,
  "SOME_COMPLETE" = 2,
  "COMPLETE" = 3,
}

/** 物料采购单状态（0未开始；1 进行中；2已完成） */
export enum MaterialPurchaseStatus {
  "READY" = 0,
  "DOING" = 1,
  "COMPLETE" = 2,
}

/** 备料任务单状态（0待备料；1备料中；2部分备料；3已备料） */
export enum MaterialPrepareTaskStatus {
  "READY" = 0,
  "DOING" = 1,
  "SOME_COMPLETE" = 2,
  "COMPLETE" = 3,
}

/** 检测模式（1:抽检；2全检） */
export enum DetectionMode {
  "SOME_CHECK" = 1,
  "ALL_CHECK" = 2,
}

/** 检测项类型（0 计量型： 1 计数型） */
export enum DetectionType {
  "MEASURE" = 0,
  "COUNT" = 1,
}

/** 检测项权重(0 一般；1 关键) */
export enum DetectionWeight {
  "NORMAL" = 0,
  "IMPORTANT" = 1,
}

/** 物料批次库存日志-操作类型二级
 * （1直接出库;2生产出库;3留；4直接入库；5退料入库；6接收入库；7直接盘库；8留；9留；）
 **/
export enum MaterialBatchStockLogOperationTypeSub {
  "STOCK_OUT_DIRECT" = 1,
  "STOCK_OUT_PRODUCT" = 2,
  // "" = 3,

  "STOCK_IN_DIRECT" = 4,
  "STOCK_IN_RETURN" = 5,
  "STOCK_IN_RECEIVE" = 6,

  "STOCK_RESET_DIRECT" = 7,
  // "" = 8,
  // "" = 9,
}

/** 产品批次库存日志-操作类型二级
 * （1直接出库;2销售出库;3留；4直接入库；5退货入库；6接收入库；7直接盘库；8留；9留；）
 **/
export enum ProductBatchStockLogOperationTypeSub {
  "STOCK_OUT_DIRECT" = 1,
  "STOCK_OUT_SALE" = 2,
  // "" = 3,

  "STOCK_IN_DIRECT" = 4,
  "STOCK_IN_RETURN" = 5,
  "STOCK_IN_RECEIVE" = 6,

  "STOCK_RESET_DIRECT" = 7,
  // "" = 8,
  // "" = 9,
}

/** 批次库存日志-操作类型（1出库；2入库；3盘库） */
export enum BatchStockLogOperationType {
  "STOCK_OUT" = 1,
  "STOCK_IN" = 2,
  "STOCK_RESET" = 3,
}

/** 检测项结果（-1 不合格；1合格） */
export enum DetectionResult {
  "UNQUALIFIED" = -1,
  "QUALIFIED" = 1,
}

/** 批次检测-检测结论（-1 不合格；1合格） */
export enum BatchDetectionConclusion {
  "UNQUALIFIED" = -1,
  "QUALIFIED" = 1,
}

/** 批次-批次状态（-1已退回；0未接收；1已接收；2已上架；3已下架） */
export enum BatchStatus {
  "BACK" = -1,
  "DEFAULT" = 0,
  "STOCK_IN" = 1,
  "SHELF_UP" = 2,
  "SHELF_DOWN" = 3,
}

/** 批次-检测状态（-1不合格；0未检测；1合格） */
export enum BatchDetectionStatus {
  "UNQUALIFIED" = -1,
  "DEFAULT" = 0,
  "QUALIFIED" = 1,
}

// 项目实际枚举
/** 模块类型（信号量查询用） */
export enum SubModuleType {
  "ADDON" = "addon",
  "DEVICE_GROUND" = "deviceGround",
  "WRISTBAND" = "wristband",
  "GENERAL_INPUT" = "generalInput",
  "SCALE" = "scale",
}

/** 信号量状态-常规 */
export enum SignalPayloadCheck {
  "ON" = "1",
  "OFF" = "0",
}

/** 信号量状态-安灯 */
export enum SignalPayloadAddon {
  "OFF" = "0",
  "MATERIAL" = "1",
  "DEVICE" = "2",
  "QUALITY" = "3",
  "OTHER" = "4",
}

/** 事件类型 */
export enum AddonEventType {
  "MATERIAL" = 1,
  "DEVICE" = 2,
  "QUALITY" = 3,
  "OTHER" = 4,
  "MULTIPLE" = 6,
}

/** 工序类型 */
export enum ProcedureType {
  "CHECK" = 0,
  "NOT_CHECK" = 1,
}

/** 字典名称 */
export enum DictTypeEnums {
  "PRODUCT_TYPE" = "product_type",
  "MATERIAL_TYPE" = "material_type",
  "MATERIAL_UNIT" = "material_unit",
}

/** 员工登记状态（-1 请假；0 未登记；1 登记中；2 登记结束） */
export enum StaffSignStatus {
  "ABSENT" = -1,
  "NOT_DO" = 0,
  "DOING" = 1,
  "DONE" = 2,
}

/** 产线登记状态（0 未生产；1 生产中；2 生产结束） */
export enum RegistrationStatus {
  "NOT_REGISTRATION" = 0,
  "IN_REGISTRATION" = 1,
  "END_REGISTRATION" = 2,
}

/** 生产任务单状态（0未开始；1 进行中；2已完成） */
export enum ProductTaskStatus {
  "NOT_DO" = 0,
  "DOING" = 1,
  "COMPLETE" = 2,
}

/** 事件状态（-1 无效事件；0 待接收；1处理中；2已处理） */
export enum AddonEventStatus {
  "INVALID" = -1,
  "READY" = 0,
  "PROCESSING" = 1,
  "PROCESSED" = 2,
}

/** 平台租户可用角色键（xz 线长;pg 普工;djy 点检员；sjgly 事件管理员; cg 仓管; gcgly 工厂管理员） */
export enum PlatformRoleKey {
  "ADMIN" = "admin",
  "MAIN" = "zzh",
  "XIANZHANG" = "xz",
  "PUGONG" = "pg",
  "SPOTCHECK" = "djy",
  "EVENT" = "sjgly",
  "WAREHOUSE" = "cg",
  "CJZR" = "cjzr",
  "GCGLY" = "gcgly",
}

/** 员工类型（1 线长;2 普工;3 点检员；4事件管理员；5仓管；6其他；7 工厂管理员）*/
export enum StaffType {
  "XIANZHANG" = 1,
  "PUGONG" = 2,
  "SPOTCHECK" = 3,
  "EVENT" = 4,
  "WAREHOUSE" = 5,
  "CJZR" = 6,
  "GCGLY" = 7,
}

/** 租户状态 */
export enum TenantStatus {
  "FREEZE" = -1,
  "NORMAL" = 0,
}

// --------- 老项目枚举

/** 订单处理日志-类型（0分拣；1打印；2包装；3发货） */
export enum OrderHandleLogOperationType {
  "SORT" = 0,
  "PRINT" = 1,
  "PACK" = 2,
  "SHIP" = 3,
}

/** 订单处理日志-类型（0 开始分拣；1 扫码拣货行为；2 继续分拣； 3 结束分拣）*/
export enum OrderHandleLogOperationSubType {
  "START" = 0,
  "EMIT" = 1,
  "CONTINUE" = 2,
  "FINISH" = 3,
}

/** 通用状态（0正常 1停用） */
export enum RyStatus {
  "NORMAL" = 0,
  "STOP" = 1,
}

/** 库存预警-预警类型（1 产品缺货 2其他） */
export enum StockWarnWarnType {
  "OUT_STOCK" = 1,
  "OTHER" = 2,
}

/** 库存预警-发生阶段（0拣货阶段） */
export enum StockWarnHappenStage {
  "PACK" = 0,
}

/** 库存预警-预警状态（0产品缺货） */
export enum StockWarnWarnStatus {
  "READY" = 0,
  "COMPLETED" = 1,
}

/** 待检库存状态(
 -1 存在待检缺货
- 0 待检库存正常
- 1 订单已完成分拣) 
*/
export enum OrderDemandStockStatus {
  "ABNORMAL" = -1,
  "NORMAL" = 0,
  "COMPLETED" = 1,
}

/** 处理状态（0待分拣；1分拣中；2分拣完成；3打印完成；4待包装；5包装中；6包装完成；7已发货；） */
export enum OrderHandleStatus {
  "READY_SORT" = 0,
  "SORTING" = 1,
  "SORTED" = 2,
  "PRINTED" = 3,
  "READY_PACK" = 4,
  "PACKING" = 5,
  "PACKED" = 6,
  "SHIPPED" = 7,
}

/** 订单类型(0 普通；1 OEM) */
export enum OrderType {
  "NORMAL" = 0,
  "OEM" = 1,
}

/** 订单紧急程度(0 一般;1 加急) */
export enum OrderUrgency {
  "NORMAL" = 0,
  "URGENCY" = 1,
}

/** 订单状态 （0-n 基于处理记录按需注入状态） */
export enum OrderStatus {
  "READY_SORT" = 0,
  "SORTING" = 1,
  "SORTED" = 2,
  "PRINTED" = 3,
  "READY_PACK" = 4,
  "PACKING" = 5,
  "PACKED" = 6,
  "SHIPPED" = 7,
}

/** 产品分类（0默认；1 正桨；2反桨；3包） */
export enum ProductCategory {
  "DEFAULT" = 0,
  "LEFT" = 1,
  "RIGHT" = 2,
  "PACKAGE" = 3,
}

/** 产品组包装规范（0无；1单桨；2正反桨） */
export enum ProductGroupPackingType {
  "NONE" = 0,
  "SINGLE" = 1,
  "DOUBLE" = 2,
}

/** 常规判断(TRUE FALSE => 1 0) */
export enum CommonCheck {
  "TRUE" = 1,
  "FALSE" = 0,
}

// --------- 原枚举

/** 用户类型 */
export enum UserType {
  "ADMIN" = 0,
  "ENTERPRISE" = 1,
  "STAFF" = 2,
}

/** 用户状态（0 审核中；1 正常；-1 冻结）*/
export enum CommonStatus {
  "EXAMING" = 0,
  "NORMAL" = 1,
  "FREEZE" = -1,
}

/** 用户状态（0 审核中；1 正常；-1 冻结）*/
export type UserStatus = CommonStatus;

/** 企业类型(0 制造型企业）*/
export enum EnterpriseType {
  "ZHIZAO" = 0,
}

/** 企业状态 */
export type EnterpriseStatus = CommonStatus;

/** 员工状态 */
export type StaffStatus = CommonStatus;

/** 线体状态 */
export type LineStatus = CommonStatus;

/** 员工登记状态 */
export enum StaffWorkStatus {
  "NOT_WORKING" = 0,
  "WORKING" = 1,
}

/** 日期类型 */
export enum DateType {
  "HOUR" = 0,
  "DAY" = 1,
  "MONTH" = 2,
  "YEAR" = 3,
}

/** 供应商类型 （0：五金类 1：电子电器 2：OEM/ODM） */
export enum SupplierType {
  "WUJING_JIXIE" = 0,
  "DIANZI_DIANQI" = 1,
  "OEM_ODM" = 2,
  "BAOCAI_HUAGONG" = 3,
  "QITA" = 4,
}

/** 角色类型 */
export type UserRole = UserType;

/** 常规审核状态（0 待审核；1通过；-1 未通过） */
export enum CommonExamineStatus {
  "UNDER_REVIEW" = 0,
  "PASS" = 1,
  "FAIL" = -1,
}

/** 得分类型 */
export enum ScoreType {
  "PLUS" = 0,
  "MINUS" = 1,
}

/** 工位类型 */
export enum StationType {
  "CHECK" = 0,
  "NOT_CHECK" = 1,
}

/** 点检频率 */
export enum SpotcheckCycle {
  "DAY" = 1,
  "WEEKDAY" = 7,
  "MONTH" = 30,
  "YEAR" = 365,
}

/** 点检多次提交类型 */
export enum SpotcheckMultiSubmitType {
  "HUAN_MO" = 0,
  "HUAN_CAILIAO" = 1,
  "HUAN_BAN" = 2,
  "OTHER" = 3,
}

/** 线体审核类型（0 线体注册；1 线体编辑；2 线体注销；3 线体维度加分；4 分供方质量审核提交） */
export enum ExamineLineType {
  "REGISTER" = 0,
  "EDIT" = 1,
  "CANCELLATION" = 2,
  "APPLY_DIMENSION_SCORE_ADD" = 3,
  "SUB_SUPPLIER_QUALITY_AUDIT" = 4,
}

/** 站内消息类型（0 自定义消息；1 线体审核（注册、编辑、注销、维度加分）；2 供应商审核；3 线体加减分；4 供应商加减分 ） */
export enum PlatformMessageType {
  "CUSTOM" = 0,
  "LINE_EXAMINE" = 1,
  "SUPPLIER_EXAMINE" = 2,
  "LINE_SCORE_MINUS_PLUS" = 3,
  "SUPPLIER_MINUS_PLUS" = 4,
}

/** 站内消息状态（0：未读；1：已读） */
export enum PlatformMessageStatus {
  "UNREAD" = 0,
  "READ" = 1,
}

/** 接口执行模式 */
export enum ApiExecuteMode {
  "add" = "添加",
  "create" = "创建",
  "edit" = "编辑",
}

/** 点检类型 */
export enum SpotcheckType {
  "PROCESS" = 0,
  "PRODUCT" = 1,
}

/** 线体检测类型 */
export enum LineDetectionType {
  "SCENE" = 0,
  "SPOTCHECK" = 1,
}

export enum IndustryconfgConfigType {
  "ESOP" = "1",
  "OTHER2" = "2",
  "OTHER3" = "3",
  "OTHER4" = "4",
  "OTHER5" = "5",
  "OTHER6" = "6",
}

export enum BeatType {
  "MISS_PACK" = 1,
  "OVER_AVERAGE" = 2,
}
