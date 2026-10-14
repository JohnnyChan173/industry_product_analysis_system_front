import { RuleObject } from "ant-design-vue/lib/form";

/** 表单规则数据 */
export type FormRuleData = { [k: string]: RuleObject | RuleObject[] };

/** 表格主题数据 */
export interface BodyCellData<T = any> {
  text: any;
  record: T;
  index: number;
  column: {
    key: string;
    dataIndex: keyof T;
  };
}
