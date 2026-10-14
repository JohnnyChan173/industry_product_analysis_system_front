// type PartialOne<T, U> = Pick<T, Exclude<keyof T, U>> & { [U in keyof T]: T[U] };

// const giao = {
//   name: "shilu",
// };

// interface Person {
//   name: string;
//   age: number;
//   giao: typeof giao;
// }

// // const enum E1 {
// //   A,
// //   B,
// //   C,
// // }
// const enum E1 {
//   A = "A",
//   B = "B",
//   C = "C",
// }

// const fn = () => {};

// type PersonProps = keyof Person;

// type E1Props = typeof E1;
// type E11Props = keyof E1;
// type FN1Props = typeof fn;

// const o ={a:1,b:2}
// type OProps = keyof typeof o

// const o1:OProps =

// const p1: PersonProps = "age";
// const e1: E1Props = 0;
// const e11: E11Props = "endsWith";

// const p: Person = {
//   name: "shilu",
//   age: 26,
//   giao: {
//     name: "gaojiawei",
//   },
// };

// interface Animal {
//   walk: () => void;
//   children: number[];
// }

// type NoChildrenAnimal = PartialOne<Animal, "children">;

// const noca: NoChildrenAnimal = {
//   walk() {},
//   children: [],
// };

// const noca2: Omit<Animal, "children"> = {
//   walk() {},
// };

// // type PAnimal = Person & Animal;

// // interface IPAnimal extends PAnimal {}

// // const p1: PAnimal = {
// //   name: "",
// //   walk: () => {},
// // };

// // type TPAnimal = PAnimal;

// // interface PersonAnimal extends Animal {
// //   run(): void;
// // }

// // const p1: Partial<IPAnimal> = {
// //   // name: "giao",
// //   // children: [1, 2, "s"],
// // };
