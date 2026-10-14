import { message } from "ant-design-vue";
import axios, { AxiosResponse, AxiosInstance, AxiosRequestConfig } from "axios";
import { useGlobSetting } from "../hooks/setting";
import { ResponseCommonData } from "../api/model";
import authStorage from "../utils/storage/auth";
import { TokenPrefix } from "./auth";
import { useAppStore, useDataStore, useUserInfoStore } from "../store";

const { domainUrl, apiUrlPrefix } = useGlobSetting();

/** 网络请求超时时长 */
const NET_TIMEOUT = 30000;
/** 令牌前缀 */
export const AUTHORIZATION_HEADER = "Authorization";
/** 网络正常响应码 */
const SUCCESS_CODE = 200;
/** 鉴权失败 */
const AUTH_FAIL_CODE = 401;

const antMessage = message;

const request2 = axios.create({
  baseURL: domainUrl + apiUrlPrefix,
  timeout: NET_TIMEOUT,
  headers: {
    [AUTHORIZATION_HEADER]: "",
  },
});

// Add a request interceptor
request2.interceptors.request.use(
  function (config) {
    // 注入令牌
    const token = authStorage.getToken() || "";
    config.headers!![AUTHORIZATION_HEADER] = TokenPrefix + " " + token;
    return config;
  },
  function (error) {
    antMessage.error(error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
request2.interceptors.response.use(
  function (response: AxiosResponse<any>) {
    const { data: resData } = response;
    const { code, message, data } = resData;
    const { globalMessageAllowed } = useAppStore();
    const { logout } = useUserInfoStore();

    if (code === SUCCESS_CODE) {
      return Promise.resolve(resData);
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

export default request2;
