import { Recordable } from "/#/global";

/** 判断是否为 NumberString */
export function isNumberString(str: string) {
  for (let i = 0; i < str.length; i++) {
    const code = str[i].charCodeAt(i);
    // 任意字符 ascii 码 不满足数字情况
    if (code < 48 || code > 57) {
      return false;
    }
  }
  return true;
}

/** 格式化枚举类型 */
export function formatEnum<T>(record: Recordable<T>) {
  const newObj: Recordable<T> = {};
  Object.keys(record).forEach((key) => {
    if (!isNumberString(key)) {
      newObj[key] = record[key];
    }
  });
  return newObj;
}

/** 获取属性值(泛型) */
export function getPropertyValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

/** 设置属性值(泛型) */
export function setPropertyValue<T, K extends keyof T>(obj: T, key: K, value: any) {
  return (obj[key] = value);
}

/** 判空 */
export function checkEmpty(data: any) {
  // 数组空
  if (Array.isArray(data)) {
    return data.length === 0;
  } else if (data && typeof data === "object") {
    // 对象空
    return Object.keys(data).length === 0;
  } else if (data === undefined || data == null) {
    // 未定义或null
    return true;
  } else if (typeof data === "string") {
    // 字符串空
    return data === "";
  }
  return false;
}
