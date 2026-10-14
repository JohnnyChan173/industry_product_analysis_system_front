// declare type RuleObject = AggregationRule;
// declare type AggregationRule = BaseRule;
// interface ArrayRule extends Omit<AggregationRule, "type"> {
//   type: "array";
//   defaultField?: RuleObject;
// }
// interface BaseRule {
//   warningOnly?: boolean;
//   /** validate the value from a list of possible values */
//   enum?: [];
//   /** validate the exact length of a field */
//   len?: number;
//   /** validate the max length of a field */
//   max?: number;
//   /** validation error message */
//   message?: string;
//   /** validate the min length of a field */
//   min?: number;
//   /** validate from a regular expression */
//   pattern?: RegExp;
//   /** indicates whether field is required */
//   required?: boolean;
//   /** transform a value before validation */
//   /** built-in validation type, available options: https://github.com/yiminghe/async-validator#type */
//   type?: RuleType;
//   /** treat required fields that only contain whitespace as errors */
//   whitespace?: boolean;
//   /** Customize rule level `validateTrigger`. Must be subset of Field `validateTrigger` */
//   validateTrigger?: string | string[];
//   /** Check trigger timing */
//   trigger?: "blur" | "change";
// }
// interface ValidatorRule {
//   warningOnly?: boolean;
//   message?: string;
//   /** custom validate function (Note: callback must be called) */
//   validator: Validator;
// }
// type RuleType =
//   | "string"
//   | "number"
//   | "boolean"
//   | "method"
//   | "regexp"
//   | "integer"
//   | "float"
//   | "object"
//   | "enum"
//   | "date"
//   | "url"
//   | "hex"
//   | "email";

// declare type Validator = (rule: RuleObject, value: any, callback: (error?: string) => void) => Promise<void> | void;

// const accountRule = [
//   {
//     message: "giao",
//     trigger: "blur",
//   },
// ];

// const a: RuleObject[] = accountRule;

// // const o: { [k: string]: RuleObject | RuleObject[] } = {
// //   account: accountRule,
// // };

// interface Person {
//   name: string;
//   gender?: "male" | "female";
// }

// enum Trigger {
//   male = "male",
//   female = "female",
// }

// const people = [
//   {
//     name: "shilu",
//     gender: "female",
//   },
// ];

// const pe: Person[] = people;
// const p: Person = people[0];
