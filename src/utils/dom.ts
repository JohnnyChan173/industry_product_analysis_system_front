/** 寻找父元素 */
export function findParentDom(target: HTMLElement | null, className: string) {
  while (target) {
    if (target.classList.contains(className)) {
      return target;
    }
    target = target.parentElement;
  }
  return null;
}

/** 获取元素 */
export function $(selector: string) {
  return document.querySelector(selector);
}

/**
 * 复制内容到剪切板
 */
export function clipboardCopy(content: string) {
  try {
    // content为要复制的内容
    // 创建元素用于复制
    const ele = document.createElement("input");
    // 设置元素内容
    ele.setAttribute("value", content);
    // 将元素插入页面进行调用
    document.body.appendChild(ele);
    // 复制内容
    ele.select();
    // 将内容复制到剪贴板
    document.execCommand("copy");
    // 删除创建元素
    document.body.removeChild(ele);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
