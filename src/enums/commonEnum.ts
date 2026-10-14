/** 常规操作提示 */
export enum CommonOperatorTip {
  OK = "操作成功",
  COPY_OK = "复制成功",
  ERROR = "操作异常",
  WAITING_APPROVAL = "操作成功, 等待审核",
  DEVELOPING = "板块开发中...",
  APPROVAL_PASS = "审核已通过",
  APPROVAL_FAIL = "审核未通过",
}

/** 常规组件模式 */
export enum CommonComponentMode {
  /** 默认 */
  DEFAULT = "DEFAULT",

  /** 详情 */
  DETAIL = "DETAIL",

  /** 编辑 */
  EDIT = "EDIT",

  /** 添加 */
  ADD = "ADD",

  /** 复制（特殊） */
  COPY = "COPY",
}

/** 常规组件尺寸 */
export enum CommonComponentSize {
  /** 小 */
  SMALL = "SMALL",

  /** 正常 */
  NORMAL = "NORMAL",

  /** 大*/
  LARGE = "LARGE",
}
