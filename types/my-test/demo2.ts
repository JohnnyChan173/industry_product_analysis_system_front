// interface Person {
//   name: string;
//   age: number;
// }

// const p: Person = {
//   name: "shilu",
//   age: 26,
// };

// type TypeofPerson = typeof p;

// const p2: TypeofPerson = p;

// type KeyofPerson = keyof Person;

// const p3: KeyofPerson = Object.keys(p2).find((k) => k === "age") as "age";
// const p31: KeyofPerson = "age";

// enum Hobby {
//   "shuffle" = 0,
//   "poke" = 1,
//   "jkd" = 2,
// }

// interface IHobby {
//   shuffle: 0;
//   poke: 1;
//   jkd: 2;
// }

// const h: Hobby = Hobby.jkd;

// type TypeofHobby = typeof Hobby;
// const h2: TypeofHobby = { poke: 1, shuffle: 0, jkd: 2 };
// const h21: IHobby = { poke: 1, shuffle: 0, jkd: 2 };

// type KeyofHobby = keyof typeof Hobby;
// type KeyofIHobby = keyof IHobby;

// const kh: KeyofHobby = "poke";
// const kh1: KeyofIHobby = "jkd";

// function getValue<T, K extends keyof T>(map: T, key: K): T[K] {
//   return map[key];
// }

// const getShuffle: <T, K extends keyof T>(map: T, key: K) => T[K] = getValue;

// const v = getValue<typeof Hobby, keyof typeof Hobby>(Hobby, "jkd");
// const v2 = getValue(Hobby, "poke");

// const vp = getValue<Person, keyof Person>(p, "age");

// interface INumber {
//   number: string;
// }

// type KeyofINumber = keyof INumber;

// const in1: INumber = {
//   number: "1",
// };

// const kin: KeyofINumber = "number";

// function useKey<T, K extends keyof INumber>(o: T, k: K) {
//   var name: string = k;
// }

// function createStudent<T extends Person>(arg: T): T {
//   return arg;
// }

// function createStudent2(arg: Person): Person {
//   return arg;
// }

// interface StudentProps {
//   school: string;
//   grade: string;
// }

// const student1 = createStudent2({ name: "shi", age: 25 });
// const student2 = createStudent({});

// interface Car<T> {
//   name: string;
//   moreInfo: T;
//   <T, K>(a: T, b: K): void;
// }
// const car: Car<{ Giao: string }> = function (a, b) {};
// car.name = "东风";
// car.moreInfo = { Giao: "giao" };

// interface CreateCar<T, K> {
//   (a: T, b: K): { name: string; [key: string]: T | K | string | symbol };
// }

// var create2ParamtersCar: CreateCar<string, number> = function (a, b) {
//   return {
//     name: "string",
//   };
// };

// var k = create2ParamtersCar("s", 2);
// k.name = "s";
// k.a = Symbol();

// interface CreateCar {
//   <T, K>(a: T, b: K): { a: T; b: K };
// }

// // var create2ParamtersCar: CreateCar = (a, b) => ({ a, b });
// var create2ParamtersCar: CreateCar = (a, b) => ({ a, b });

// var a = create2ParamtersCar<number, boolean>(1, true);

// function createStudent<T extends Person>(arg: T): T {
//   return arg;
// }

// var a = createStudent({
//   age: 26,
//   name: "shilu",
// });
