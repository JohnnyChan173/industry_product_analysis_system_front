const st = window.localStorage;

/** 实例化一个本地存储对象 */
class MyStorage {
  constructor() {}

  protected _set(key: string, data: any) {
    if (typeof data === undefined || data === null) {
      data = "";
    } else if (typeof data === "object") {
      // 数组或对象 序列号
      try {
        data = JSON.stringify(data);
      } catch (e) {
        // console.log(e);
      }
    }

    return st.setItem(key, data);
  }

  protected _get(key: string): any {
    let data = st.getItem(key);
    try {
      data = JSON.parse(data!!);
    } catch (e) {
      // console.log(e);
    }
    return data;
  }

  protected _remove(key: string) {
    st.removeItem(key);
  }

  protected _clear() {
    st.clear();
  }
}

export default MyStorage;
