import { message } from "ant-design-vue";
import axios, { AxiosResponse, AxiosInstance, AxiosRequestConfig } from "axios";
import { useGlobSetting } from "../hooks/setting";
import { ResponseCommonData } from "../api/model";
import authStorage from "../utils/storage/auth";
import { TokenPrefix } from "./auth";
import { useAppStore, useDataStore, useUserInfoStore } from "../store";

const { domainUrl, apiUrlPrefix } = useGlobSetting();

/** 网络请求超时时长 */
const NET_TIMEOUT = 150000;
/** 令牌前缀 */
export const AUTHORIZATION_HEADER = "Authorization";
/** 网络正常响应码 */
const SUCCESS_CODE = 200;
/** 鉴权失败 */
const AUTH_FAIL_CODE = 401;

const antMessage = message;

const request = axios.create({
  baseURL: domainUrl + apiUrlPrefix,
  timeout: NET_TIMEOUT,
  headers: {
    [AUTHORIZATION_HEADER]: "",
  },
});

// Add a request interceptor
request.interceptors.request.use(
  function (config) {
    // 注入令牌
    const token = authStorage.getToken() || "";

    config.headers!![AUTHORIZATION_HEADER] = TokenPrefix + " " + token;

    // data 参数修正
    const configData = config.data;
    if (configData) {
      for (const key in configData) {
        const value = configData[key];
        // 字符串字段去空格
        if (typeof value === "string") {
          configData[key] = value.trim();
        }
      }
    }

    // params 参数修正(数组query 转字符串)
    const configParams = config.params;

    if (configParams) {
      for (const key in configParams) {
        const value = configParams[key];

        if (Array.isArray(value)) {
          configParams[key] = value.join(",");
        } else if (typeof value === "string") {
          configParams[key] = value.trim();
        }
      }
    }

    return config;
  },
  function (error) {
    antMessage.error(error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
request.interceptors.response.use(
  function (response: AxiosResponse<ResponseCommonData>) {
    const { data: resData } = response;
    const { code, message, data } = resData;
    const { globalMessageAllowed } = useAppStore();
    const { logout } = useUserInfoStore();

    if (code === SUCCESS_CODE) {
      return Promise.resolve(data);
    } else {
      // 如果是未授权 则登出
      if (code === AUTH_FAIL_CODE) {
        logout();
      }

      if (globalMessageAllowed) {
        antMessage.error(message);
      }

      return Promise.reject(message);
    }
  },
  function (error) {
    console.log(error);
    const msg = error.message;
    antMessage.error(msg);

    return Promise.reject(error);
  }
);

/** 高阶函数 - 无弹窗消息请求 */
export function noMessageRequest(api: any) {
  return async function (...args: any[]) {
    const { setGlobalMessageAllowed } = useAppStore();
    try {
      setGlobalMessageAllowed(false);
      const rs = await api(...args);
      return rs;
    } catch (e: any) {
      // 错误向上抛
      throw new Error(e);
    } finally {
      setGlobalMessageAllowed(true);
    }
  };
}

export default request;
