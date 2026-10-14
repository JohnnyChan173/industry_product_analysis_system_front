import MyStorage from "./storage";

const TokenKey = "Authorization";
const LastAccountKey = "LastAccountKey";

class MyAuthStorage extends MyStorage {
  constructor() {
    super();
  }

  // 设置用户信息
  setToken = (token: string) => {
    return this._set(TokenKey, token);
  };

  getToken = () => {
    return this._get(TokenKey);
  };

  removeToken = () => {
    console.log("removeToken");
    return this._remove(TokenKey);
  };

  /** 设置最近一次账号 */
  setLastAccount = (account: string) => {
    return this._set(LastAccountKey, account);
  };

  /** 获取最近一次账号 */
  getLastAccount = () => {
    return this._get(LastAccountKey);
  };
}

const authStorage = new MyAuthStorage();

export default authStorage;
