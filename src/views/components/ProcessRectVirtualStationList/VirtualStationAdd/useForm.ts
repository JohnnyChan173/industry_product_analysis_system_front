import { RuleObject } from "ant-design-vue/lib/form";
import { Recordable } from "/#/global";

export function getFormRules(): Recordable<RuleObject[]> {
  return {
    stationId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    virtualStationName: [
      {
        required: true,
        message: "请输入",
      },
    ],
    craftProcedureIds: [
      {
        type: "array",
        required: true,
        message: "请选择",
      },
    ],
    // virtualStationProductWeight: [
    //   {
    //     // required: true,
    //     message: "请输入",
    //   },
    // ],
    staffId: [
      {
        required: true,
        message: "请选择",
      },
    ],
    beatFormat: [
      {
        validator(rule, value, callback) {
          // 查看表达式是否能运算
          const formula = value;
          console.log("formula: ", value);

          // 如果是空值也允许
          if (value === "" || value === undefined || value === null) {
            return Promise.resolve();
          }

          // 检测x
          if (!value.includes("x")) {
            return Promise.reject(`表达式必须含有x`);
          }

          try {
            eval(`
            const x = 100;
            const value = ${formula};
            value;
          `);
            return Promise.resolve();
          } catch (e) {
            return Promise.reject(`表达式错误: ${e}`);
          }
        },
      },
    ],
  };
}
