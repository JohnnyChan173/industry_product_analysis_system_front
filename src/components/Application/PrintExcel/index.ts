/** A4尺寸 */
export const a4Size = {
  width: 794,
  height: 1123,
  // height: 1156,
  effectTop: 60,
  effectBottom: 70,
  effectHeight: 1026,
};

/** 文案阴影（加粗） */
export const textShadow =
  "0.15pt 0px 0px black,0.25pt 0px 0px black,0.35pt 0px 0px black,-0.25pt 0px 0px black,0px 0.25pt 0px black,0px -0.25pt 0px black";

/** 标题文案样式 */
export const titleLabelStyle = {
  fontSize: "15px",
  textShadow,
};

/** 获取文案参数 */
export const labelParams = {
  // align: "right",
  style: {
    fontSize: "15px",
    padding: "1px 3px",
    lineHeight: "18px",
    // fontWeight: "bold", // 宋体加粗 A4打印无效
  },
};

/** 获取列表文案参数 */
export const listLabelParams = {
  align: "center",
  ellipsis: true,
  style: {
    fontSize: "15px",
    padding: "1px 0px",
    lineHeight: "24px",
    whiteSpace: "nowrap",
  },
};

/** 生成行列 */
export function genRowCol(rowIndex: number, colIndex: number, data: any): any {
  const d = {
    [`r${rowIndex}c${colIndex}`]: data,
  };

  return d;
}

/** 主题表格样式生成 */
export function genMainTableDataStyle(text: string, width: number, otherStyle = {}) {
  return {
    ...listLabelParams,
    style: {
      ...listLabelParams.style,
      width: width + "px",
      minWidth: width + "px",
      maxWidth: width + "px",
      ...otherStyle,
    },
    text,
  };
}
