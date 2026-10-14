import { CSSProperties, StyleValue } from "vue";
import { useDesign } from "/@/hooks/web/useDesign";

/** 标准按钮1：注册、登录页 */
export const normalBtnStyle1: CSSProperties = {
  width: "360px",
  height: "42px",
  borderRadius: "5px",
};

/** 标准按钮2：表单底部按钮 */
export const normalBtnStyle: CSSProperties = {
  minWidth: "130px",
  height: "38px",
  borderRadius: "5px",
};

/** form 表单标准长度( label + 控件的 总长度) */
export const formNormalWidth = "440px";

/** form 表单标准长度( label + 控件的 总长度) */
export const formNormalParams = {
  labelCol: { span: 6 },
  divItemStyle: {
    width: formNormalWidth,
  },
  divBtnStyle: {
    marginTop: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  btnStyle: normalBtnStyle,
};

/** 获取重置样式命名 */
export function getResetCSSPrefix() {
  const resetAntdCSSPrefix = "resetAntdCSS";
  const { prefixCls } = useDesign(resetAntdCSSPrefix);
  return prefixCls;
}

/** Modal 固定效果样式 */
export const modalFixedStyle: StyleValue = { maxHeight: "75vh", overflowY: "auto", margin: "-24px", padding: "24px" };

/** Table 可编辑单元格 控件样式 */
export const tableEditableStyle = {
  margin: "-5px 0",
};
