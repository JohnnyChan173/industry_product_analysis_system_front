import dayjs from "dayjs";
import { IntervalHandle, Recordable, TimeoutHandle } from "/#/global";
import { clipboardCopy } from "./dom";
import { message } from "ant-design-vue";
import { userGetSecureSsoLogin } from "../api/user";
import { DictItemInfo } from "../api/model/dictItem";

/**
 * 数组去重
 * @param {Array} arr 数组
 */
export function duplicateArray(arr: any[]) {
  if (arr instanceof Array) {
    return Array.from(new Set([...arr]));
  }
  throw new Error("not Array");
}

/**
 * 解析 search 参数
 */
export function parseSearch(): Recordable<string> {
  // 需兼容 hash模式
  const { href } = window.location;
  const searchIndex = href.indexOf("?");
  let search = href.slice(searchIndex);

  if (!search.includes("?")) {
    return {};
  }
  search = search.slice(1);
  const map: Recordable = {};
  const searchArr = search.split("&");
  searchArr.forEach((i, index) => {
    const equalIndex = i.indexOf("=");
    const k = i.substring(0, equalIndex);
    const v = i.substring(equalIndex + 1);
    map[k] = v;
  });
  return map;
}

/**
 * 解析 hash 参数
 */
export function parseHash() {
  // 需兼容 hash模式
  let { hash } = window.location;
  hash = hash.slice(1);

  const map: Recordable = {};
  const hashArr = hash.split("&");
  hashArr.forEach((i, index) => {
    const [k, v] = i.split("=");
    map[k] = v;
  });
  return map;
}

/** 打开外部网页 */
export function windowOpen(url: string) {
  window.open(url);
}

/** 节流函数 */
export const throttle = (fn: () => void, delay: number, immediate?: boolean) => {
  let _timer: TimeoutHandle | null;

  return function (this: any, ...args: []) {
    // 是否即刻触发
    if (immediate) {
      fn.apply(this, args);
      immediate = false;
      return;
    }

    if (_timer) {
      return;
    } else {
      _timer = setTimeout(() => {
        fn.apply(this, args);
        clearTimeout(_timer!!);
        _timer = null;
      }, delay);
    }
  };
};

/** 防抖函数 */
export const debounce = (fn: any, delay = 200, immediate?: boolean) => {
  let _timer: TimeoutHandle | null;
  return function (this: any, ...args: any[]) {
    return new Promise<any>((resolve, reject) => {
      // 是否即刻触发
      if (immediate) {
        const rs = fn.apply(this, args);
        immediate = false;
        resolve(rs);
      }

      clearTimeout(_timer!!);
      _timer = setTimeout(() => {
        const rs = fn.apply(this, args);
        _timer = null;
        resolve(rs);
      }, delay);
    });
  };
};

/** 生产随机哈希标识 */
export function randomId() {
  return Math.random().toString(32).slice(2);
}

/** 获取时间编号 */
export function getTimeNo(date = Date.now()) {
  // 到秒
  const timeStr = dayjs(date).format("YYYYMMDDHHmmss");

  // 到毫秒
  // const millonSecond = (Date.now() % 10000).toString().padStart(4, "0");
  // return timeStr + millonSecond;

  return timeStr;
}

/** 格式化时间 */
export function formatDateByDayjs(date: any = Date.now(), format = "YYYY-MM-DD") {
  const d = dayjs(date);
  const s = d.format(format);
  return s;
}

/** 获取秒 */
export function getSecondByDate(date: string) {
  const millisecond = getMillisecondByDate(date);
  const second = Math.floor(millisecond / 1000);
  return second;
}

/** 获取毫秒 */
export function getMillisecondByDate(date: string) {
  const d = new Date(date);
  const millisecond = d.getTime();
  return millisecond;
}

/** 创建 a 标签下载链接 */
export function createDownload(url: string, name: string) {
  const a = document.createElement("a"); // 创建a标签
  a.setAttribute("href", url); // href链接
  a.setAttribute("download", name); // download属性
  a.click(); // 自执行点击事件
}

/** 获取时间单位（中文） */
export function getDateUnitText(date: string) {
  const yearReg = RegExp("^\\d{4}$");
  const monthReg = RegExp("^\\d{4}-\\d{1,2}$");
  const dayReg = RegExp("^\\d{4}-\\d{1,2}-\\d{1,2}$");
  if (yearReg.test(date)) {
    return "年";
  } else if (monthReg.test(date)) {
    return "月";
  } else if (dayReg.test(date)) {
    return "日";
  } else {
    console.warn("未知时间单位");
    return "";
  }
}

/** 异步延迟 */
export function delay(time = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("");
    }, time);
  });
}

/** 操作面板模式文本 */
export function compModeText(id?: number, text = "") {
  if (id) {
    return "编辑" + text;
  } else {
    return "创建" + text;
  }
}

/** 剪切免登地址 */
export async function clipSsoLoginUrl(username: string, name: string) {
  // 获取免登地址
  const ssoPath = await userGetSecureSsoLogin(username);
  const { origin } = window.location;
  const wholeUrl = `${origin}/ssoLogin?token=${ssoPath}#${name}`;
  clipboardCopy(wholeUrl);
  message.success(`链接已复制到剪切板: ${wholeUrl}`);
}

/** 检测日期未过期 */
export function checkDateNotExpired(date: string) {
  const dt = new Date(date).getTime();
  const ct = Date.now();

  return dt > ct;
}

/** 获取assets静态资源 */
export function getAssetsFile(url: string) {
  return new URL(`../assets/${url}`, import.meta.url).href;
}

/** hex转rgba */
export function hexToRgba(hex: string, opacity: number) {
  if (!hex) hex = "#ededed";
  let rgbastr = "";
  if (hex.length == 4) {
    const str = hex.split("");
    rgbastr += "#" + str[1] + str[1] + str[2] + str[2] + str[3] + str[3];
    hex = rgbastr;
  }
  const rgba =
    "rgba(" +
    parseInt("0x" + hex.slice(1, 3)) +
    "," +
    parseInt("0x" + hex.slice(3, 5)) +
    "," +
    parseInt("0x" + hex.slice(5, 7)) +
    "," +
    (opacity || "1") +
    ")";
  return rgba;
}

/** ids转成数组 */
export function parseIds2List(ids?: string) {
  if (typeof ids === "string") {
    const list = ids.split(",").map((i) => Number(i));
    return list;
  } else {
    return [];
  }
}

/** 数组转成ids */
export function parseList2Ids(idsList: number[]) {
  if (Array.isArray(idsList)) {
    const list = idsList.join(",");
    return list;
  } else {
    return "";
  }
}

/** 判断时间是否为今日 */
export function isToday(date: string) {
  const day = formatDateByDayjs(date);
  const today = formatDateByDayjs();
  const check = today === day;
  console.log(day, today, check);
  return check;
}

/** 筛选字典 filterOption */
export function dictItemFilterOption(inputValue: string, option: any) {
  const exist = option.label.includes(inputValue);
  return exist;
}
