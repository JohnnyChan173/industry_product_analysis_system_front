/** 解决精度问题 */
export function fixNumber(n: number) {
  return parseFloat(n.toPrecision(12));
}

/** 保留小数 */
export function numberToFixed(data: string | number, digit: number = 0) {
  const val = Number(data.toString());
  return Number(val.toFixed(digit));
}

/** 求平均值 */
function average(nums: number[]): number;
function average(...args: number[]): number;

function average(nums: number[] | number, ...args: number[]) {
  if (typeof nums === "number") {
    nums = [nums, ...args];
  }

  const l = nums as number[];

  return l.reduce((total, val) => total + val, 0) / nums.length;
}

/** 求和 */
function sum(nums: number[]): number {
  return nums.reduce((total, item) => {
    total += item || 0;
    return total;
  }, 0);
}

export { average, sum };
