
// type P1 = "x" extends "x" ? string : number;
// type P2 = "x" | "y" extends "x" ? string : number;


// type P3<T> = T extends "x" ? string : number;


// type A3 = P3<"x" | "y">;// => 分配率下 P3<"x"> 再联上 P3<"y"> 
// var a: A3 = 1;