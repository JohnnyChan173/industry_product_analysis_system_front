// type Person<T> = {
//   [K in keyof T]: any;
// };

// var p: Person2<{ name: string }> = {
//   "field1": "name",
// };

// interface Person {
//   name: string;
//   age: number;
//   gender?: string;
// }

// // ----------- 类型定义 ------------
// type MyRecord<T = any> = {
//   [K in keyof T]: T[K];
// };

// type MyPick<T, K extends keyof T> = {
//   [P in K]: T[P];
// };

// type MyExtract<T, U> = T extends U ? T : never;
// type MyExclude<T, U> = T extends U ? never : T;

// type MyOmit<T, K> = {
//   [P in MyExclude<keyof T, K>]: T[P];
// };

// type Keys = "name" | "age" | "gender" | "school";

// var k: MyExtract<Keys, "name" | "age"> = "name";
// var k2: MyExclude<Keys, "age"> = "name";
// var o1: MyOmit<Person, "name" | "age"> = {
//   gender: "male",
// };

// var p: MyRecord<Person> = {
//   name: "shilu",
//   age: 111,
// };

// var p2: MyPick<Person, "name"> = {
//   name: "s",
// };
