import MyStorage from "./storage";

const lineAddKey = "LINE_ADD";

export class LineAddStorage extends MyStorage {
  constructor() {
    super();
  }

  // 设置线体创建信息
  setLineAddInfo = (info: any) => {
    return this._set(lineAddKey, info);
  };

  getLineAddInfo = () => {
    return this._get(lineAddKey);
  };

  removeLineAddInfo = () => {
    return this._remove(lineAddKey);
  };
}

const lineAddStorage = new LineAddStorage();

export default lineAddStorage;
