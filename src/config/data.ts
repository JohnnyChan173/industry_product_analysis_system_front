import {
  AddonEventStatus,
  AddonEventType,
  CommonCheck,
  DetectionType,
  DetectionWeight,
  MaterialPrepareTaskStatus,
  MaterialPurchaseStatus,
  MaterialReturnTaskStatus,
  OrderHandleLogOperationType,
  OrderHandleStatus,
  OrderType,
  OrderUrgency,
  ProcedureType,
  BatchDetectionConclusion,
  BatchDetectionStatus,
  BatchStatus,
  BatchStockLogOperationType,
  ProductBatchStockLogOperationTypeSub,
  ProductCategory,
  ProductGroupPackingType,
  ProductTaskStatus,
  RegistrationStatus,
  StaffSignStatus,
  StaffType,
  StockWarnHappenStage,
  StockWarnWarnStatus,
  StockWarnWarnType,
  TenantStatus,
  PlatformRoleKey,
  UserType,
  MaterialBatchStockLogOperationTypeSub,
  ProductDeliveryTaskType,
  ProductDeliveryTaskStatus,
  ProductTaskType,
  DetectionMode,
  LineType,
  IndustryconfgConfigType,
  BeatType,
} from "../enums/model";
import { DateType } from "../enums/model";

/** 获取列表项文本 */
export function getListItemLabel(list: any[], value?: number) {
  const item = list.find((i) => i.value === value);
  return item ? item.label : "";
}

// V2新增
export const LineTypeList = [
  {
    label: "工装板线",
    value: LineType.GZB,
  },
  {
    label: "皮带线",
    value: LineType.PDX,
  },
];

/** 产品任务单-类型（0预生产；1销售生产） */
export const ProductTaskTypeList = [
  {
    label: "预生产",
    value: ProductTaskType.PREPARE,
  },
  {
    label: "销售生产",
    value: ProductTaskType.SALE,
  },
];

/** 产品出库任务单-状态（0待出库；1出库中；2部分出库；3已出库） */
export const ProductDeliveryTaskStatusList = [
  {
    label: "待出库",
    value: ProductDeliveryTaskStatus.READY,
  },
  {
    label: "出库中",
    value: ProductDeliveryTaskStatus.DOING,
  },
  {
    label: "部分出库",
    value: ProductDeliveryTaskStatus.SOME_COMPLETE,
  },
  {
    label: "全部出库",
    value: ProductDeliveryTaskStatus.COMPLETE,
  },
];

/** 产品出库任务单-类型（0销售出库；1直接出库） */
export const ProductDeliveryTaskTypeList = [
  {
    label: "销售出库",
    value: ProductDeliveryTaskType.SALE,
  },
  {
    label: "直接出库",
    value: ProductDeliveryTaskType.DIRECT,
  },
];

/** 退料任务单状态（0待退料；1退料中；2部分退料；3已退料） */
export const MaterialReturnTaskStatusList = [
  {
    label: "待退料",
    value: MaterialReturnTaskStatus.READY,
  },
  {
    label: "退料中",
    value: MaterialReturnTaskStatus.DOING,
  },
  {
    label: "部分退料",
    value: MaterialReturnTaskStatus.SOME_COMPLETE,
  },
  {
    label: "全部退料",
    value: MaterialReturnTaskStatus.COMPLETE,
  },
];

/** 物料采购单状态（0未完成；1 进行中；2已完成） */
export const MaterialPurchaseStatusList = [
  {
    label: "未完成",
    value: MaterialPurchaseStatus.READY,
  },
  {
    label: "进行中",
    value: MaterialPurchaseStatus.DOING,
  },
  {
    label: "已完成",
    value: MaterialPurchaseStatus.COMPLETE,
  },
];

/** 备料任务单状态（0待备料；1备料中；2部分备料；3已备料） */
export const MaterialPrepareTaskStatusList = [
  {
    label: "待备料",
    value: MaterialPrepareTaskStatus.READY,
  },
  {
    label: "备料中",
    value: MaterialPrepareTaskStatus.DOING,
  },
  {
    label: "部分备料",
    value: MaterialPrepareTaskStatus.SOME_COMPLETE,
  },
  {
    label: "全部备料",
    value: MaterialPrepareTaskStatus.COMPLETE,
  },
];

/** 检测模式（1:抽检；2全检） */
export const DetectionModeList = [
  {
    label: "抽检",
    value: DetectionMode.SOME_CHECK,
  },
  {
    label: "全检",
    value: DetectionMode.ALL_CHECK,
  },
];

/** 检测项类型（0 计量型： 1 计数型） */
export const DetectionTypeList = [
  {
    label: "计数型",
    value: DetectionType.COUNT,
  },
  {
    label: "计量型",
    value: DetectionType.MEASURE,
  },
];

/** 检测项权重(0 一般；1 关键) */
export const DetectionWeightList = [
  {
    label: "一般",
    value: DetectionWeight.NORMAL,
  },
  {
    label: "关键",
    value: DetectionWeight.IMPORTANT,
  },
];

/** 物料批次库存日志-操作类型二级
 * （1直接出库;2生产出库;3留；4直接入库；5退料入库；6接收入库；7直接盘库；8留；9留；）
 **/
export const MaterialBatchStockLogOperationTypeSubList = [
  {
    label: "直接出库",
    value: MaterialBatchStockLogOperationTypeSub.STOCK_OUT_DIRECT,
  },
  {
    label: "生产出库",
    value: MaterialBatchStockLogOperationTypeSub.STOCK_OUT_PRODUCT,
  },

  {
    label: "直接入库",
    value: MaterialBatchStockLogOperationTypeSub.STOCK_IN_DIRECT,
  },
  {
    label: "退料入库",
    value: MaterialBatchStockLogOperationTypeSub.STOCK_IN_RETURN,
  },
  {
    label: "接收入库",
    value: MaterialBatchStockLogOperationTypeSub.STOCK_IN_RECEIVE,
  },

  {
    label: "直接盘库",
    value: MaterialBatchStockLogOperationTypeSub.STOCK_RESET_DIRECT,
  },
];

/** 产品批次库存日志-操作类型二级
 * （1直接出库;2销售出库;3留；4直接入库；5退货入库；6接收入库；7直接盘库；8留；9留；）
 **/
export const ProductBatchStockLogOperationTypeSubList = [
  {
    label: "直接出库",
    value: ProductBatchStockLogOperationTypeSub.STOCK_OUT_DIRECT,
  },
  {
    label: "销售出库",
    value: ProductBatchStockLogOperationTypeSub.STOCK_OUT_SALE,
  },

  {
    label: "直接入库",
    value: ProductBatchStockLogOperationTypeSub.STOCK_IN_DIRECT,
  },
  {
    label: "退货入库",
    value: ProductBatchStockLogOperationTypeSub.STOCK_IN_RETURN,
  },
  {
    label: "接收入库",
    value: ProductBatchStockLogOperationTypeSub.STOCK_IN_RECEIVE,
  },

  {
    label: "直接盘库",
    value: ProductBatchStockLogOperationTypeSub.STOCK_RESET_DIRECT,
  },
];

/** 库存日志-操作类型（1出库；2入库；3盘库） */
export const BatchStockLogOperationTypeList = [
  {
    label: "出库",
    value: BatchStockLogOperationType.STOCK_OUT,
  },
  {
    label: "入库",
    value: BatchStockLogOperationType.STOCK_IN,
  },
  {
    label: "盘库",
    value: BatchStockLogOperationType.STOCK_RESET,
  },
];

/** 批次检测-检测结论（-1 不合格；1合格） */
export const BatchDetectionConclusionList = [
  {
    label: "合格",
    value: BatchDetectionConclusion.QUALIFIED,
  },
  {
    label: "不合格",
    value: BatchDetectionConclusion.UNQUALIFIED,
  },
];

export const BatchStatusList = [
  {
    label: "已退回",
    value: BatchStatus.BACK,
  },
  {
    label: "未入库",
    value: BatchStatus.DEFAULT,
  },
  {
    label: "已入库",
    value: BatchStatus.STOCK_IN,
  },
  {
    label: "已上架",
    value: BatchStatus.SHELF_UP,
  },
  {
    label: "已下架",
    value: BatchStatus.SHELF_DOWN,
  },
];

/** 批次-检测状态（-1不合格；0未检测；1合格） */
export const BatchDetectionStatusList = [
  {
    label: "不合格",
    value: BatchDetectionStatus.UNQUALIFIED,
  },
  {
    label: "未检测",
    value: BatchDetectionStatus.DEFAULT,
  },
  {
    label: "合格",
    value: BatchDetectionStatus.QUALIFIED,
  },
];

/** 登记状态（0 未生产；1 生产中；2 生产结束） */
export const RegistrationStatusList = [
  {
    label: "未登记",
    value: RegistrationStatus.NOT_REGISTRATION,
  },
  {
    label: "登记中",
    value: RegistrationStatus.IN_REGISTRATION,
  },
  {
    label: "登记结束",
    value: RegistrationStatus.END_REGISTRATION,
  },
];

/** 生产任务单状态列表（0未开始；1 进行中；2已完成） */
export const ProductTaskStatusList = [
  {
    label: "未开始",
    value: ProductTaskStatus.NOT_DO,
  },
  {
    label: "进行中",
    value: ProductTaskStatus.DOING,
  },
  {
    label: "已完成",
    value: ProductTaskStatus.COMPLETE,
  },
];

/** 员工登记状态列表（-1 请假；0 未登记；1 登记中；2 登记结束） */
export const StaffSignStatusList = [
  {
    label: "请假",
    value: StaffSignStatus.ABSENT,
  },
  {
    label: "未登记",
    value: StaffSignStatus.NOT_DO,
  },
  {
    label: "登记中",
    value: StaffSignStatus.DOING,
  },
  {
    label: "登记结束",
    value: StaffSignStatus.DONE,
  },
];

/** 平台租户可用角色键（xz 线长;pg 普工;djy 点检员；sjgly 事件管理员;cg 仓管; gcgly 工厂管理员） */
export const TenantValidRoleKeyList = [
  {
    label: "线长",
    value: PlatformRoleKey.XIANZHANG,
  },
  {
    label: "普工",
    value: PlatformRoleKey.PUGONG,
  },
  // {
  //   label: "点检员",
  //   value: PlatformRoleKey.SPOTCHECK,
  // },
  {
    label: "事件管理员",
    value: PlatformRoleKey.EVENT,
  },
  {
    label: "仓管",
    value: PlatformRoleKey.WAREHOUSE,
  },
  {
    label: "车间主任",
    value: PlatformRoleKey.CJZR,
  },
  {
    label: "工厂管理员",
    value: PlatformRoleKey.GCGLY,
  },
];

/** 员工类型列表 */
export const StaffTypeList = [
  {
    label: "线长",
    value: StaffType.XIANZHANG,
  },
  {
    label: "普工",
    value: StaffType.PUGONG,
  },
  // {
  //   label: "点检员",
  //   value: StaffType.SPOTCHECK,
  // },
  {
    label: "事件管理员",
    value: StaffType.EVENT,
  },
  {
    label: "仓管",
    value: StaffType.WAREHOUSE,
  },
  {
    label: "车间主任",
    value: StaffType.CJZR,
  },
  {
    label: "工厂管理员",
    value: StaffType.GCGLY,
  },
];

/** 事件类型列表 */
export const AddonEventTypeList = [
  {
    label: "物料",
    value: AddonEventType.MATERIAL,
  },
  {
    label: "设备",
    value: AddonEventType.DEVICE,
  },
  {
    label: "品质",
    value: AddonEventType.QUALITY,
  },
  {
    label: "其他",
    value: AddonEventType.OTHER,
  },
  {
    label: "制程",
    value: AddonEventType.MULTIPLE,
  },
];

/** 事件状态列表 */
export const AddonEventStatusList = [
  {
    label: "无效事件",
    value: AddonEventStatus.INVALID,
  },
  {
    label: "待接收",
    value: AddonEventStatus.READY,
  },
  {
    label: "处理中",
    value: AddonEventStatus.PROCESSING,
  },
  {
    label: "已处理",
    value: AddonEventStatus.PROCESSED,
  },
];

/** 工序类型列表（0 检查类；1 非检查类） */
export const ProcedureTypeList = [
  {
    label: "检查类",
    value: ProcedureType.CHECK,
  },
  {
    label: "非检查类",
    value: ProcedureType.NOT_CHECK,
  },
];

/** 租户状态列表（-1冻结；0正常） */
export const TenantStatusList = [
  {
    label: "冻结",
    value: TenantStatus.FREEZE,
  },
  {
    label: "正常",
    value: TenantStatus.NORMAL,
  },
];

/** 常规是否启用(TRUE FALSE => 1 0) */
export const UseCheckList = [
  {
    label: "启用",
    value: CommonCheck.TRUE,
  },
  {
    label: "未启用",
    value: CommonCheck.FALSE,
  },
];

/** 常规判断列表(TRUE FALSE => 1 0) */
export const CommonCheckList = [
  {
    label: "是",
    value: CommonCheck.TRUE,
  },
  {
    label: "否",
    value: CommonCheck.FALSE,
  },
];

/** 预警类型列表 */
export const StockWarnWarnTypeList = [
  {
    label: "产品缺货",
    value: StockWarnWarnType.OUT_STOCK,
  },
  {
    label: "其他",
    value: StockWarnWarnType.OTHER,
  },
];

/** 预警发生阶段列表 */
export const StockWarnHappenStageList = [
  {
    label: "拣货阶段",
    value: StockWarnHappenStage.PACK,
  },
];

/** 预警状态列表 */
export const StockWarnWarnStatusList = [
  {
    label: "待处理",
    value: StockWarnWarnStatus.READY,
  },
  {
    label: "已处理",
    value: StockWarnWarnStatus.COMPLETED,
  },
];

/** 订单处理日志操作类型列表 */
export const OrderHandleLogOperationTypeList = [
  {
    label: "分拣",
    value: OrderHandleLogOperationType.SORT,
  },
  {
    label: "打印",
    value: OrderHandleLogOperationType.PRINT,
  },
  {
    label: "包装",
    value: OrderHandleLogOperationType.PACK,
  },
  {
    label: "发货",
    value: OrderHandleLogOperationType.SHIP,
  },
];

/** 订单处理状态列表 */
export const OrderHandleStatusList = [
  {
    label: "待分拣",
    value: OrderHandleStatus.READY_SORT,
  },
  {
    label: "分拣中",
    value: OrderHandleStatus.SORTING,
  },
  {
    label: "分拣完成",
    value: OrderHandleStatus.SORTED,
  },
  {
    label: "打印完成",
    value: OrderHandleStatus.PRINTED,
  },
  {
    label: "待包装",
    value: OrderHandleStatus.READY_PACK,
  },
  {
    label: "包装中",
    value: OrderHandleStatus.PACKING,
  },
  {
    label: "包装完成",
    value: OrderHandleStatus.PACKED,
  },
  {
    label: "已发货",
    value: OrderHandleStatus.SHIPPED,
  },
];

/** 订单状态列表 */
export const OrderStatusList = OrderHandleStatusList;

/** 订单紧急程度列表 */
export const OrderUrgencyList = [
  {
    label: "一般",
    value: OrderUrgency.NORMAL,
  },
  {
    label: "加急",
    value: OrderUrgency.URGENCY,
  },
];

/** 订单类型列表 */
export const OrderTypeList = [
  {
    label: "普通",
    value: OrderType.NORMAL,
  },
  {
    label: "OEM",
    value: OrderType.OEM,
  },
];

/** 产品分类列表 */
export const ProductCategoryList = [
  {
    label: "默认",
    value: ProductCategory.DEFAULT,
  },
  {
    label: "正桨",
    value: ProductCategory.LEFT,
  },
  {
    label: "反桨",
    value: ProductCategory.RIGHT,
  },
  {
    label: "包",
    value: ProductCategory.PACKAGE,
  },
];

/** 产品组包装规范列表 */
export const ProductGroupPackingTypeList = [
  {
    label: "无",
    value: ProductGroupPackingType.NONE,
  },
  {
    label: "单桨",
    value: ProductGroupPackingType.SINGLE,
  },
  {
    label: "正反桨",
    value: ProductGroupPackingType.DOUBLE,
  },
];

// 原数组--------

/** 日期类型列表 */
export const DateTypeList = [
  // {
  //   label: "年",
  //   value: DateType.YEAR,
  // },
  {
    label: "月",
    value: DateType.MONTH,
  },
  {
    label: "日",
    value: DateType.DAY,
  },
  {
    label: "时",
    value: DateType.HOUR,
  },
];

/** 用户类型列表 */
export const UserTypeList = [
  {
    label: "管理员",
    value: UserType.ADMIN,
  },
  // {
  //   label: "供应商",
  //   value: UserType.SUPPLIER,
  // },
  // {
  //   label: "供应商子账号",
  //   value: UserType.SUB_SUPPLIER,
  // },
];

export const IndustryconfgConfigTypeList = [
  {
    label: "ESOP",
    value: IndustryconfgConfigType.ESOP,
  },
  // {
  //   label: "其他2",
  //   value: IndustryconfgConfigType.OTHER2,
  // },
  // {
  //   label: "其他3",
  //   value: IndustryconfgConfigType.OTHER3,
  // },
  // {
  //   label: "其他4",
  //   value: IndustryconfgConfigType.OTHER4,
  // },
  // {
  //   label: "其他5",
  //   value: IndustryconfgConfigType.OTHER5,
  // },
  // {
  //   label: "其他6",
  //   value: IndustryconfgConfigType.OTHER6,
  // },
];

// 异常类型列表
export const BeatTypeList = [
  {
    label: "漏装",
    value: BeatType.MISS_PACK,
  },
  {
    label: "超出平均值上限",
    value: BeatType.OVER_AVERAGE,
  },
];