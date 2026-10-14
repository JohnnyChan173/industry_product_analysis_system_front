// // type CreateGiao = (name: string) => string;

// // declare function CreateGiao2(name: string): string;
// interface CreateGiao2 {
//   (name: string, age: number, gender: string): string;
//   (name: string, age: number): string;
// }

// function createStudent(name: string): string;
// function createStudent(name: string, age: number): number;
// function createStudent(name: string, gender: string): typeof Object;

// function createStudent(name: string, secondParam?: string | number) {
//   if (!secondParam) {
//     return name;
//   } else if (typeof secondParam === "number") {
//     return secondParam;
//   } else {
//     return {};
//   }
// }

// var o = createStudent("ss", 13);

// // interface CheckProps {
// //   // [x: number]: number | string;
// //   // [x: string]: string | number;
// //   [x: string | number]: number | string;
// // }

// // var cp: CheckProps = {
// //   age: 26,
// // };
