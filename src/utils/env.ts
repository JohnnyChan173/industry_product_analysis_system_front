import { GlobEnvConfig } from "/#/config";

/** 获取项目环境变量 */
export function getAppEnvConfig() {
  const ENV = import.meta.env as unknown as GlobEnvConfig;
  // console.log(ENV);

  const {
    VITE_GLOB_API_URL_PREFIX,
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_DOMAIN_URL,
    VITE_GLOB_UNIVERSAL_UPLOAD_URL,
    VITE_GLOB_UNIVERSAL_BUCKET_URL,
  } = ENV;

  return {
    VITE_GLOB_API_URL_PREFIX,
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_DOMAIN_URL,
    VITE_GLOB_UNIVERSAL_UPLOAD_URL,
    VITE_GLOB_UNIVERSAL_BUCKET_URL,
  };
}

/** 获取当前环境模式 */
export function getEnvMode() {
  return import.meta.env.MODE;
}

/** 检测是否为开发模式 */
export function isDevMode() {
  if (getEnvMode() === "development") {
    return true;
  }
}

/** 检测是否为线上模式 */
export function isProdMode() {
  if (getEnvMode() === "production") {
    return true;
  }
}
